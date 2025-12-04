const { Op } = require('sequelize');
const InventoryItem = require('../models/InventoryItem');
const User = require('../models/User');
const emailService = require('../services/emailService');

/**
 * Send low stock alerts
 * Runs daily at 8 AM
 */
async function sendLowStockAlerts() {
  console.log('Starting low stock alert job...');
  
  try {
    // Find all users with low stock items
    const lowStockItems = await InventoryItem.findAll({
      where: {
        quantity: {
          [Op.lte]: sequelize.col('lowStockThreshold'),
        },
        isActive: true,
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'notificationPreferences'],
        },
      ],
    });

    // Group by user
    const itemsByUser = {};
    lowStockItems.forEach(item => {
      const userId = item.userId;
      if (!itemsByUser[userId]) {
        itemsByUser[userId] = {
          user: item.user,
          items: [],
        };
      }
      itemsByUser[userId].items.push(item);
    });

    console.log(`Found low stock items for ${Object.keys(itemsByUser).length} users`);

    let sentCount = 0;
    let errorCount = 0;

    for (const userId in itemsByUser) {
      try {
        const { user, items } = itemsByUser[userId];

        // Check if user wants email notifications
        if (user.notificationPreferences?.email !== false) {
          await emailService.sendLowStockAlert(items, user);
          console.log(`Sent low stock alert to ${user.email} for ${items.length} items`);
          sentCount++;
        }
      } catch (error) {
        console.error(`Failed to send low stock alert to user ${userId}:`, error.message);
        errorCount++;
      }
    }

    console.log(`Low stock alerts completed: ${sentCount} sent, ${errorCount} errors`);
    
    return {
      success: true,
      sent: sentCount,
      errors: errorCount,
    };
  } catch (error) {
    console.error('Low stock alert job error:', error);
    throw error;
  }
}

module.exports = { sendLowStockAlerts };
