/**
 * Report Controller - Handle Report Generation Requests
 */

const reportService = require('../services/reportService');

class ReportController {
  /**
   * Get Profit & Loss Report
   */
  async getProfitLoss(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          error: 'Start date and end date are required'
        });
      }

      const report = await reportService.generateProfitLossReport(
        req.userId,
        new Date(startDate),
        new Date(endDate)
      );

      res.json(report);
    } catch (error) {
      console.error('Error getting P&L report:', error);
      res.status(500).json({ error: 'Failed to generate report' });
    }
  }

  /**
   * Get Cash Flow Report
   */
  async getCashFlow(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          error: 'Start date and end date are required'
        });
      }

      const report = await reportService.generateCashFlowReport(
        req.userId,
        new Date(startDate),
        new Date(endDate)
      );

      res.json(report);
    } catch (error) {
      console.error('Error getting cash flow report:', error);
      res.status(500).json({ error: 'Failed to generate report' });
    }
  }

  /**
   * Get Sales Report
   */
  async getSales(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          error: 'Start date and end date are required'
        });
      }

      const report = await reportService.generateSalesReport(
        req.userId,
        new Date(startDate),
        new Date(endDate)
      );

      res.json(report);
    } catch (error) {
      console.error('Error getting sales report:', error);
      res.status(500).json({ error: 'Failed to generate report' });
    }
  }

  /**
   * Get Expense Report
   */
  async getExpenses(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          error: 'Start date and end date are required'
        });
      }

      const report = await reportService.generateExpenseReport(
        req.userId,
        new Date(startDate),
        new Date(endDate)
      );

      res.json(report);
    } catch (error) {
      console.error('Error getting expense report:', error);
      res.status(500).json({ error: 'Failed to generate report' });
    }
  }

  /**
   * Get Inventory Report
   */
  async getInventory(req, res) {
    try {
      const report = await reportService.generateInventoryReport(req.userId);
      res.json(report);
    } catch (error) {
      console.error('Error getting inventory report:', error);
      res.status(500).json({ error: 'Failed to generate report' });
    }
  }

  /**
   * Get Tax Summary
   */
  async getTaxSummary(req, res) {
    try {
      const { year } = req.query;
      
      if (!year) {
        return res.status(400).json({
          error: 'Year is required'
        });
      }

      const report = await reportService.generateTaxSummaryReport(
        req.userId,
        parseInt(year)
      );

      res.json(report);
    } catch (error) {
      console.error('Error getting tax summary:', error);
      res.status(500).json({ error: 'Failed to generate report' });
    }
  }

  /**
   * Get Dashboard Summary
   */
  async getDashboardSummary(req, res) {
    try {
      const summary = await reportService.generateDashboardSummary(req.userId);
      res.json(summary);
    } catch (error) {
      console.error('Error getting dashboard summary:', error);
      res.status(500).json({ error: 'Failed to generate summary' });
    }
  }

  /**
   * Export Report as PDF
   */
  async exportPDF(req, res) {
    try {
      const { reportType, startDate, endDate } = req.query;
      
      // This would integrate with a PDF generation library like puppeteer or pdfkit
      res.status(501).json({
        message: 'PDF export coming soon',
        reportType,
        period: { startDate, endDate }
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      res.status(500).json({ error: 'Failed to export report' });
    }
  }

  /**
   * Export Report as CSV
   */
  async exportCSV(req, res) {
    try {
      const { reportType, startDate, endDate } = req.query;
      
      // This would generate CSV data
      res.status(501).json({
        message: 'CSV export coming soon',
        reportType,
        period: { startDate, endDate }
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      res.status(500).json({ error: 'Failed to export report' });
    }
  }
}

module.exports = new ReportController();
