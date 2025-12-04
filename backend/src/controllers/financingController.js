// ====================
// backend/src/controllers/financingController.js
// ====================
const { User, Transaction, Account } = require('../models');
const { Op } = require('sequelize');

exports.getFinancingOptions = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    
    // Get recent transactions to calculate eligibility
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const transactions = await Transaction.findAll({
      where: {
        userId: req.userId,
        date: { [Op.gte]: threeMonthsAgo }
      }
    });

    // Calculate average monthly revenue
    const revenue = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const avgMonthlyRevenue = revenue / 3;

    // Get current balance
    const accounts = await Account.findAll({
      where: { userId: req.userId, isActive: true }
    });

    const currentBalance = accounts.reduce((sum, acc) => 
      sum + parseFloat(acc.currentBalance || 0), 0
    );

    // Calculate financing options
    const options = [
      {
        id: 'instant-5k',
        name: 'Instant Access',
        amount: 5000,
        term: '30 days',
        fee: 150,
        apr: 12,
        eligible: avgMonthlyRevenue >= 10000,
        noPersonalGuarantee: true,
        description: 'Quick access for immediate needs'
      },
      {
        id: 'standard-15k',
        name: 'Standard Line',
        amount: 15000,
        term: '90 days',
        fee: 350,
        apr: 10,
        eligible: avgMonthlyRevenue >= 25000,
        noPersonalGuarantee: true,
        description: 'Flexible credit line for growing businesses'
      },
      {
        id: 'premium-50k',
        name: 'Premium Line',
        amount: 50000,
        term: '180 days',
        fee: 800,
        apr: 8,
        eligible: avgMonthlyRevenue >= 50000 && currentBalance >= 10000,
        noPersonalGuarantee: false,
        description: 'Large credit line for established businesses'
      }
    ];

    res.json({
      avgMonthlyRevenue,
      currentBalance,
      options: options.filter(o => o.eligible)
    });
  } catch (error) {
    console.error('Get financing options error:', error);
    res.status(500).json({ error: 'Failed to fetch financing options' });
  }
};

exports.applyForFinancing = async (req, res) => {
  try {
    const { optionId, amount, purpose } = req.body;

    // In a real app, this would integrate with a lending API
    // For now, we'll simulate the application

    const application = {
      id: `APP-${Date.now()}`,
      userId: req.userId,
      optionId,
      amount,
      purpose,
      status: 'pending',
      appliedAt: new Date(),
      estimatedDecision: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };

    // Simulate instant approval for amounts under $5000
    if (amount <= 5000) {
      application.status = 'approved';
      application.approvedAt = new Date();
    }

    res.json(application);
  } catch (error) {
    console.error('Apply for financing error:', error);
    res.status(500).json({ error: 'Failed to apply for financing' });
  }
};

exports.getApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;

    // In a real app, fetch from database
    // For now, return mock data
    res.json({
      id: applicationId,
      status: 'approved',
      amount: 5000,
      approvedAt: new Date()
    });
  } catch (error) {
    console.error('Get application status error:', error);
    res.status(500).json({ error: 'Failed to fetch application status' });
  }
};
