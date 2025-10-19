const { body, validationResult } = require('express-validator');
const User = require('../../models/User');
const { authenticateToken } = require('../../middleware/auth');
const connectDB = require('../db');

module.exports = async (req, res) => {
  // Connect to database
  await connectDB();

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Authenticate token
    await authenticateToken(req, res, () => {});

    if (req.method === 'GET') {
      // Get user profile
      res.json({
        success: true,
        data: {
          user: req.user
        }
      });
    } else if (req.method === 'PUT') {
      // Update user profile
      const updateValidation = [
        body('name')
          .optional()
          .trim()
          .isLength({ min: 2, max: 50 })
          .withMessage('Name must be between 2 and 50 characters'),
        body('phone')
          .optional()
          .isMobilePhone()
          .withMessage('Please provide a valid phone number'),
        body('dateOfBirth')
          .optional()
          .isISO8601()
          .withMessage('Please provide a valid date of birth'),
        body('gender')
          .optional()
          .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
          .withMessage('Invalid gender selection')
      ];

      // Run validation
      await Promise.all(updateValidation.map(validation => validation.run(req)));
      const errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        name,
        phone,
        dateOfBirth,
        gender,
        preferences
      } = req.body;

      const updateData = {};
      if (name) updateData.name = name;
      if (phone) updateData.phone = phone;
      if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);
      if (gender) updateData.gender = gender;
      if (preferences) {
        updateData.preferences = {
          ...req.user.preferences,
          ...preferences
        };
      }

      const user = await User.findByIdAndUpdate(
        req.user._id,
        updateData,
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: user.getProfile()
        }
      });
    } else {
      res.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
    }

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process profile request'
    });
  }
};
