const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Stock item name is required'],
      trim: true,
      unique: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Medication', 'Consumable', 'Equipment', 'Laboratory'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      default: 0,
      min: [0, 'Quantity cannot be negative'],
    },
    unit: {
      type: String,
      required: [true, 'Unit of measurement is required (e.g., tablets, ml, pieces)'],
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      default: 0,
    },
    minStockLevel: {
      type: Number,
      default: 10, // Alert threshold for low inventory
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Stock', stockSchema);