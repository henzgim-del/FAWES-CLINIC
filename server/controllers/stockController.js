const Stock = require('../models/Stock');

// @desc    Get all stock items (Doctor, Nurse, Admin)
// @route   GET /api/v1/stock
// @access  Private
exports.getStock = async (req, res, next) => {
  try {
    const stockItems = await Stock.find().sort({ name: 1 });

    res.status(200).json({
      status: 'success',
      results: stockItems.length,
      data: stockItems,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// @desc    Add new stock item or restock (Admin)
// @route   POST /api/v1/stock
// @access  Private (Admin)
exports.addStock = async (req, res, next) => {
  try {
    const { name, category, quantity, unit, unitPrice, minStockLevel } = req.body;

    // Check if item already exists
    let stockItem = await Stock.findOne({ name });

    if (stockItem) {
      // If it exists, update quantity (restock)
      stockItem.quantity += Number(quantity);
      if (unitPrice) stockItem.unitPrice = unitPrice;
      await stockItem.save();

      return res.status(200).json({
        status: 'success',
        message: 'Existing stock restocked successfully',
        data: stockItem,
      });
    }

    // Otherwise create new
    stockItem = await Stock.create({
      name,
      category,
      quantity,
      unit,
      unitPrice,
      minStockLevel,
    });

    res.status(201).json({
      status: 'success',
      message: 'New stock item created successfully',
      data: stockItem,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// @desc    Update stock quantity/dispense (Nurse / Admin)
// @route   PATCH /api/v1/stock/:id/dispense
// @access  Private (Nurse, Admin)
exports.dispenseStock = async (req, res, next) => {
  try {
    const { quantityUsed } = req.body;

    const stockItem = await Stock.findById(req.params.id);

    if (!stockItem) {
      return res.status(404).json({
        status: 'fail',
        message: 'Stock item not found',
      });
    }

    if (stockItem.quantity < quantityUsed) {
      return res.status(400).json({
        status: 'fail',
        message: `Insufficient stock available. Current quantity: ${stockItem.quantity}`,
      });
    }

    stockItem.quantity -= Number(quantityUsed);
    await stockItem.save();

    res.status(200).json({
      status: 'success',
      message: 'Stock dispensed successfully',
      data: stockItem,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};