/**
 * Recurring Invoice Service
 * Automatically generate invoices on a schedule
 */

const { Invoice } = require('../models');
const { Op } = require('sequelize');
const emailService = require('./emailService');

class RecurringInvoiceService {
  /**
   * Create a recurring invoice template
   */
  async createRecurringInvoice(userId, invoiceData) {
    try {
      const recurringInvoice = await Invoice.create({
        ...invoiceData,
        userId,
        isRecurring: true,
        status: 'template',
        nextGenerationDate: this.calculateNextDate(
          new Date(),
          invoiceData.frequency
        )
      });

      return recurringInvoice;
    } catch (error) {
      console.error('Error creating recurring invoice:', error);
      throw error;
    }
  }

  /**
   * Calculate next generation date based on frequency
   */
  calculateNextDate(currentDate, frequency) {
    const date = new Date(currentDate);
    
    switch (frequency) {
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'biweekly':
        date.setDate(date.getDate() + 14);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setMonth(date.getMonth() + 1);
    }
    
    return date;
  }

  /**
   * Generate invoices from recurring templates
   */
  async generateRecurringInvoices() {
    try {
      const today = new Date();
      
      // Find all recurring invoices due for generation
      const recurringInvoices = await Invoice.findAll({
        where: {
          isRecurring: true,
          status: 'template',
          nextGenerationDate: {
            [Op.lte]: today
          },
          [Op.or]: [
            { endDate: null },
            { endDate: { [Op.gte]: today } }
          ]
        }
      });

      console.log(`Found ${recurringInvoices.length} recurring invoices to generate`);

      const generatedInvoices = [];

      for (const template of recurringInvoices) {
        try {
          // Create new invoice from template
          const newInvoice = await Invoice.create({
            userId: template.userId,
            clientName: template.clientName,
            clientEmail: template.clientEmail,
            clientPhone: template.clientPhone,
            items: template.items,
            subtotal: template.subtotal,
            tax: template.tax,
            total: template.total,
            notes: template.notes,
            status: 'pending',
            dueDate: this.calculateDueDate(today, template.paymentTerms || 30),
            isRecurring: false,
            parentRecurringId: template.id
          });

          // Send email notification
          if (template.clientEmail) {
            await emailService.sendInvoiceCreated(
              template.clientEmail,
              template.clientName,
              newInvoice
            );
          }

          // Update template's next generation date
          template.nextGenerationDate = this.calculateNextDate(
            today,
            template.frequency
          );
          
          // Increment generation count
          template.generationCount = (template.generationCount || 0) + 1;
          
          await template.save();

          generatedInvoices.push(newInvoice);

          console.log(`Generated invoice ${newInvoice.invoiceNumber} from template ${template.id}`);
        } catch (error) {
          console.error(`Error generating invoice from template ${template.id}:`, error);
        }
      }

      return {
        generated: generatedInvoices.length,
        invoices: generatedInvoices
      };
    } catch (error) {
      console.error('Error generating recurring invoices:', error);
      throw error;
    }
  }

  /**
   * Calculate due date based on payment terms
   */
  calculateDueDate(issueDate, paymentTerms) {
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + paymentTerms);
    return dueDate;
  }

  /**
   * Update recurring invoice template
   */
  async updateRecurringInvoice(invoiceId, userId, updates) {
    try {
      const invoice = await Invoice.findOne({
        where: {
          id: invoiceId,
          userId,
          isRecurring: true,
          status: 'template'
        }
      });

      if (!invoice) {
        throw new Error('Recurring invoice not found');
      }

      await invoice.update(updates);
      return invoice;
    } catch (error) {
      console.error('Error updating recurring invoice:', error);
      throw error;
    }
  }

  /**
   * Pause recurring invoice
   */
  async pauseRecurringInvoice(invoiceId, userId) {
    try {
      const invoice = await Invoice.findOne({
        where: {
          id: invoiceId,
          userId,
          isRecurring: true
        }
      });

      if (!invoice) {
        throw new Error('Recurring invoice not found');
      }

      invoice.isPaused = true;
      await invoice.save();

      return invoice;
    } catch (error) {
      console.error('Error pausing recurring invoice:', error);
      throw error;
    }
  }

  /**
   * Resume recurring invoice
   */
  async resumeRecurringInvoice(invoiceId, userId) {
    try {
      const invoice = await Invoice.findOne({
        where: {
          id: invoiceId,
          userId,
          isRecurring: true
        }
      });

      if (!invoice) {
        throw new Error('Recurring invoice not found');
      }

      invoice.isPaused = false;
      invoice.nextGenerationDate = this.calculateNextDate(
        new Date(),
        invoice.frequency
      );
      await invoice.save();

      return invoice;
    } catch (error) {
      console.error('Error resuming recurring invoice:', error);
      throw error;
    }
  }

  /**
   * Cancel recurring invoice
   */
  async cancelRecurringInvoice(invoiceId, userId) {
    try {
      const invoice = await Invoice.findOne({
        where: {
          id: invoiceId,
          userId,
          isRecurring: true
        }
      });

      if (!invoice) {
        throw new Error('Recurring invoice not found');
      }

      invoice.status = 'cancelled';
      invoice.endDate = new Date();
      await invoice.save();

      return invoice;
    } catch (error) {
      console.error('Error cancelling recurring invoice:', error);
      throw error;
    }
  }

  /**
   * Get all recurring invoices for a user
   */
  async getRecurringInvoices(userId) {
    try {
      const invoices = await Invoice.findAll({
        where: {
          userId,
          isRecurring: true,
          status: 'template'
        },
        order: [['nextGenerationDate', 'ASC']]
      });

      return invoices;
    } catch (error) {
      console.error('Error getting recurring invoices:', error);
      throw error;
    }
  }

  /**
   * Get invoices generated from a recurring template
   */
  async getGeneratedInvoices(templateId, userId) {
    try {
      const invoices = await Invoice.findAll({
        where: {
          userId,
          parentRecurringId: templateId
        },
        order: [['createdAt', 'DESC']]
      });

      return invoices;
    } catch (error) {
      console.error('Error getting generated invoices:', error);
      throw error;
    }
  }
}

module.exports = new RecurringInvoiceService();
