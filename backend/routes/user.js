const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/user/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile'
    });
  }
});

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', 
  authenticateToken,
  [
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
      .withMessage('Invalid gender selection'),
    body('preferences.language')
      .optional()
      .isIn(['en', 'ur', 'both'])
      .withMessage('Invalid language preference'),
    body('preferences.notifications')
      .optional()
      .isBoolean()
      .withMessage('Notifications preference must be a boolean'),
    body('preferences.theme')
      .optional()
      .isIn(['light', 'dark', 'auto'])
      .withMessage('Invalid theme preference')
  ],
  async (req, res) => {
    try {
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

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  }
);

// @route   POST /api/user/upload-avatar
// @desc    Upload profile picture
// @access  Private
router.post('/upload-avatar', 
  authenticateToken,
  async (req, res) => {
    try {
      // In a real implementation, you would handle file upload here
      // For now, we'll just return a success message
      
      const { avatarUrl } = req.body;
      
      if (!avatarUrl) {
        return res.status(400).json({
          success: false,
          message: 'Avatar URL is required'
        });
      }

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { profilePicture: avatarUrl },
        { new: true }
      );

      res.json({
        success: true,
        message: 'Profile picture updated successfully',
        data: {
          user: user.getProfile()
        }
      });

    } catch (error) {
      console.error('Upload avatar error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload profile picture'
      });
    }
  }
);

// @route   DELETE /api/user/account
// @desc    Delete user account
// @access  Private
router.delete('/account', 
  authenticateToken,
  [
    body('password')
      .notEmpty()
      .withMessage('Password is required to delete account')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { password } = req.body;

      // Verify password
      const user = await User.findById(req.user._id).select('+password');
      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid password'
        });
      }

      // In a real implementation, you would:
      // 1. Delete all user's files from cloud storage
      // 2. Delete all user's data from database
      // 3. Send confirmation email
      
      // For now, we'll just mark the user as deleted
      await User.findByIdAndUpdate(req.user._id, {
        email: `deleted_${Date.now()}_${req.user.email}`,
        name: 'Deleted User',
        isActive: false
      });

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });

    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete account'
      });
    }
  }
);

// @route   GET /api/user/dashboard
// @desc    Get dashboard data
// @access  Private
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get recent files count
    const File = require('../models/File');
    const recentFiles = await File.countDocuments({
      user: userId,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    });

    // Get total files count
    const totalFiles = await File.countDocuments({ user: userId });

    // Get recent vitals count
    const Vitals = require('../models/Vitals');
    const recentVitals = await Vitals.countDocuments({
      user: userId,
      isActive: true,
      recordedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    });

    // Get critical insights count
    const AiInsight = require('../models/AiInsight');
    const criticalInsights = await AiInsight.countDocuments({
      user: userId,
      'abnormalValues.severity': 'critical'
    });

    // Get latest vitals
    console.log('Getting latest vitals for user:', userId);
    const latestVitals = await Vitals.getLatestVitals(userId);
    console.log('Latest vitals result:', latestVitals);

    // Get recent insights
    const recentInsights = await AiInsight.find({ user: userId })
      .populate('file', 'originalName reportType reportDate')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      success: true,
      data: {
        stats: {
          recentFiles,
          totalFiles,
          recentVitals,
          criticalInsights
        },
        latestVitals,
        recentInsights
      }
    });

  } catch (error) {
    console.error('Get dashboard error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard data'
    });
  }
});

// @route   GET /api/user/activity
// @desc    Get user activity timeline
// @access  Private
router.get('/activity', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user._id;

    // Get recent files
    const File = require('../models/File');
    const recentFiles = await File.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    // Get recent vitals
    const Vitals = require('../models/Vitals');
    const recentVitals = await Vitals.find({ 
      user: userId, 
      isActive: true 
    })
      .sort({ recordedAt: -1 })
      .limit(parseInt(limit))
      .lean();

    // Get recent insights
    const AiInsight = require('../models/AiInsight');
    const recentInsights = await AiInsight.find({ user: userId })
      .populate('file', 'originalName reportType')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    // Combine and sort all activities
    const activities = [
      ...recentFiles.map(file => ({
        type: 'file_upload',
        data: file,
        timestamp: file.createdAt
      })),
      ...recentVitals.map(vital => ({
        type: 'vital_added',
        data: vital,
        timestamp: vital.recordedAt
      })),
      ...recentInsights.map(insight => ({
        type: 'insight_generated',
        data: insight,
        timestamp: insight.createdAt
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      data: {
        activities: activities.slice(0, parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve activity data'
    });
  }
});

// @route   GET /api/user/export-data
// @desc    Export user data
// @access  Private
router.get('/export-data', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all user data
    const File = require('../models/File');
    const Vitals = require('../models/Vitals');
    const AiInsight = require('../models/AiInsight');

    const [user, files, vitals, insights] = await Promise.all([
      User.findById(userId).lean(),
      File.find({ user: userId }).lean(),
      Vitals.find({ user: userId, isActive: true }).lean(),
      AiInsight.find({ user: userId }).populate('file').lean()
    ]);

    const exportData = {
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        preferences: user.preferences,
        createdAt: user.createdAt
      },
      files: files.map(file => ({
        originalName: file.originalName,
        reportType: file.reportType,
        reportDate: file.reportDate,
        hospital: file.hospital,
        tags: file.tags,
        createdAt: file.createdAt
      })),
      vitals: vitals.map(vital => ({
        type: vital.type,
        value: vital.value,
        unit: vital.unit,
        recordedAt: vital.recordedAt,
        notes: vital.notes,
        tags: vital.tags
      })),
      insights: insights.map(insight => ({
        summary: insight.summary,
        keyFindings: insight.keyFindings,
        abnormalValues: insight.abnormalValues,
        doctorQuestions: insight.doctorQuestions,
        recommendations: insight.recommendations,
        createdAt: insight.createdAt
      })),
      exportedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: exportData
    });

  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export data'
    });
  }
});

module.exports = router;
