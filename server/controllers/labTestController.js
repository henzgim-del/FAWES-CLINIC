const LabTest = require('../models/LabTest');

// @desc    Get all active lab tests (supports filtering by category or subcategory)
// @route   GET /api/v1/lab-tests
// @access  Private (Doctor, Nurse, Lab Tech, Admin)
exports.getLabTests = async (req, res, next) => {
  try {
    const { category, subcategory } = req.query;
    let query = { isActive: true };

    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;

    const labTests = await LabTest.find(query).sort({ category: 1, subcategory: 1, name: 1 });

    res.status(200).json({
      status: 'success',
      results: labTests.length,
      data: labTests
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Add a new lab test catalog item
// @route   POST /api/v1/lab-tests
// @access  Private (Admin)
exports.addLabTest = async (req, res, next) => {
  try {
    const labTest = await LabTest.create(req.body);

    res.status(201).json({
      status: 'success',
      message: 'Lab test added successfully',
      data: labTest
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};