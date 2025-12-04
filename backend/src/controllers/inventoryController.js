// ====================
// backend/src/controllers/inventoryController.js
// ====================
const { InventoryItem } = require('../models');
const { Op } = require('sequelize');
const notificationService = require('../services/notificationService');

exports.createItem = async (req, res) => {
  try {
    const {
      sku,
      name,
      description,
      quantity,
      lowStockThreshold,
      costPrice,
      sellingPrice,
      category,
      location,
      supplier
    } = req.body;

    const item = await InventoryItem.create({
      userId: req.userId,
      sku,
      name,
      description,
      quantity,
      lowStockThreshold: lowStockThreshold || 10,
      costPrice,
      sellingPrice,
      category,
      location,
      supplier
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Create inventory item error:', error);
    res.status(500).json({ error: 'Failed to create inventory item' });
  }
};

exports.getItems = async (req, res) => {
  try {
    const { category, lowStock } = req.query;
    const where = { userId: req.userId, isActive: true };

    if (category) {
      where.category = category;
    }

    const items = await InventoryItem.findAll({
      where,
      order: [['name', 'ASC']]
    });

    let filteredItems = items;
    if (lowStock === 'true') {
      filteredItems = items.filter(item => 
        item.quantity <= item.lowStockThreshold
      );
    }

    res.json(filteredItems);
  } catch (error) {
    console.error('Get inventory items error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory items' });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const item = await InventoryItem.findOne({
      where: { id, userId: req.userId }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const oldQuantity = item.quantity;
    await item.update(updates);

    // Check if stock is now low
    if (item.quantity <= item.lowStockThreshold && oldQuantity > item.lowStockThreshold) {
      await notificationService.sendLowStockAlert(item, req.userId);
    }

    res.json(item);
  } catch (error) {
    console.error('Update inventory item error:', error);
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
};

exports.adjustStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { adjustment, reason } = req.body;

    const item = await InventoryItem.findOne({
      where: { id, userId: req.userId }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const newQuantity = item.quantity + adjustment;
    
    if (newQuantity < 0) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    await item.update({ 
      quantity: newQuantity,
      lastRestocked: adjustment > 0 ? new Date() : item.lastRestocked
    });

    // Check for low stock
    if (newQuantity <= item.lowStockThreshold) {
      await notificationService.sendLowStockAlert(item, req.userId);
    }

    res.json(item);
  } catch (error) {
    console.error('Adjust stock error:', error);
    res.status(500).json({ error: 'Failed to adjust stock' });
  }
};

exports.getLowStockItems = async (req, res) => {
  try {
    const items = await InventoryItem.findAll({
      where: { userId: req.userId, isActive: true }
    });

    const lowStockItems = items.filter(item => 
      item.quantity <= item.lowStockThreshold
    );

    res.json(lowStockItems);
  } catch (error) {
    console.error('Get low stock items error:', error);
    res.status(500).json({ error: 'Failed to fetch low stock items' });
  }
};

exports.getInventoryStats = async (req, res) => {
  try {
    const items = await InventoryItem.findAll({
      where: { userId: req.userId, isActive: true }
    });

    const totalValue = items.reduce((sum, item) => 
      sum + (parseFloat(item.costPrice || 0) * item.quantity), 0
    );

    const lowStockCount = items.filter(item => 
      item.quantity <= item.lowStockThreshold
    ).length;

    const outOfStock = items.filter(item => item.quantity === 0).length;

    res.json({
      totalItems: items.length,
      totalValue,
      lowStockCount,
      outOfStock
    });
  } catch (error) {
    console.error('Get inventory stats error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory stats' });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await InventoryItem.findOne({
      where: { id, userId: req.userId }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    await item.update({ isActive: false });
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete inventory item error:', error);
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
};
