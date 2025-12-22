// Weekly Tax Deduction Scanner Job
const { User } = require('../models');
const taxDeductionService = require('../services/taxDeductionService');
const emailService = require('../services/emailService');
const notificationService = require('../services/notificationService');

async function runWeeklyTaxScan() {
  console.log('Starting weekly tax deduction scan...');
  
  try {
    // Get all users with weekly scan enabled
    const users = await User.findAll({
      where: {
        'taxSettings.weeklyDeductionScan': true
      }
    });

    let totalScanned = 0;
    let totalFound = 0;
    const results = [];

    for (const user of users) {
      try {
        const scanResult = await taxDeductionService.weeklyDeductionScan(user.id);
        
        totalScanned += scanResult.scanned;
        totalFound += scanResult.found;
        
        results.push({
          userId: user.id,
          email: user.email,
          ...scanResult
        });

        // Send notification if deductions found
        if (scanResult.found > 0) {
          await notificationService.sendTaxDeductionAlert(user, scanResult);
          
          // Send email summary
          await emailService.sendWeeklyTaxSummary(user, scanResult);
        }

        console.log(`Scanned user ${user.email}: ${scanResult.found} deductions found`);
      } catch (error) {
        console.error(`Error scanning user ${user.id}:`, error);
      }
    }

    console.log(`Weekly tax scan complete: ${totalFound} deductions found from ${totalScanned} transactions`);
    
    return {
      success: true,
      usersScanned: users.length,
      totalTransactions: totalScanned,
      totalDeductions: totalFound,
      results
    };
  } catch (error) {
    console.error('Weekly tax scan error:', error);
    throw error;
  }
}

module.exports = { runWeeklyTaxScan };
