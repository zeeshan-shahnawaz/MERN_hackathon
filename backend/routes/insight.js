const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { authenticateToken: auth } = require('../middleware/auth');
const AiInsight = require('../models/AiInsight');

// Get user's AI insights
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, type, language } = req.query;
    const skip = (page - 1) * limit;

    const query = { user: req.user.id };
    if (type) {
      query.type = type;
    }
    if (language) {
      query.language = language;
    }

    const insights = await AiInsight.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('file', 'reportType reportDate')
      .populate('user', 'name email');

    const total = await AiInsight.countDocuments(query);

    res.json({
      success: true,
      data: insights,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch insights',
      error: error.message
    });
  }
});

// Get specific insight
router.get('/:id', auth, async (req, res) => {
  try {
    const insight = await AiInsight.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('file', 'reportType reportDate doctorName hospitalName')
      .populate('user', 'name email');

    if (!insight) {
      return res.status(404).json({
        success: false,
        message: 'Insight not found'
      });
    }

    res.json({
      success: true,
      data: insight
    });

  } catch (error) {
    console.error('Get insight error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch insight',
      error: error.message
    });
  }
});

// Create new insight (for manual creation)
router.post('/', auth, async (req, res) => {
  try {
    const {
      type,
      title,
      summary,
      details,
      confidence,
      language,
      file
    } = req.body;

    if (!type || !title || !summary) {
      return res.status(400).json({
        success: false,
        message: 'Type, title, and summary are required'
      });
    }

    const insight = new AiInsight({
      user: req.user.id,
      type,
      title,
      summary,
      details: details || {},
      confidence: confidence || 0.8,
      language: language || 'both',
      file: file || null
    });

    await insight.save();

    res.status(201).json({
      success: true,
      message: 'Insight created successfully',
      data: insight
    });

  } catch (error) {
    console.error('Create insight error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create insight',
      error: error.message
    });
  }
});

// Update insight
router.put('/:id', auth, async (req, res) => {
  try {
    const insight = await AiInsight.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!insight) {
      return res.status(404).json({
        success: false,
        message: 'Insight not found'
      });
    }

    const {
      title,
      summary,
      details,
      confidence,
      language,
      isRead
    } = req.body;

    if (title !== undefined) insight.title = title;
    if (summary !== undefined) insight.summary = summary;
    if (details !== undefined) insight.details = details;
    if (confidence !== undefined) insight.confidence = confidence;
    if (language !== undefined) insight.language = language;
    if (isRead !== undefined) insight.isRead = isRead;

    await insight.save();

    res.json({
      success: true,
      message: 'Insight updated successfully',
      data: insight
    });

  } catch (error) {
    console.error('Update insight error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update insight',
      error: error.message
    });
  }
});

// Delete insight
router.delete('/:id', auth, async (req, res) => {
  try {
    const insight = await AiInsight.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!insight) {
      return res.status(404).json({
        success: false,
        message: 'Insight not found'
      });
    }

    await AiInsight.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Insight deleted successfully'
    });

  } catch (error) {
    console.error('Delete insight error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete insight',
      error: error.message
    });
  }
});

// Mark insight as read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const insight = await AiInsight.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!insight) {
      return res.status(404).json({
        success: false,
        message: 'Insight not found'
      });
    }

    res.json({
      success: true,
      message: 'Insight marked as read',
      data: insight
    });

  } catch (error) {
    console.error('Mark insight as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark insight as read',
      error: error.message
    });
  }
});

// Get insights statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const stats = await AiInsight.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user._id) } },
      {
        $group: {
          _id: null,
          totalInsights: { $sum: 1 },
          unreadInsights: { $sum: { $cond: ['$isRead', 0, 1] } },
          avgConfidence: { $avg: '$confidence' },
          lastInsight: { $max: '$createdAt' },
          insightsByType: {
            $push: {
              type: '$type',
              confidence: '$confidence'
            }
          }
        }
      }
    ]);

    const typeStats = await AiInsight.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user._id) } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$confidence' },
          unread: { $sum: { $cond: ['$isRead', 0, 1] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const monthlyStats = await AiInsight.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user._id) } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          avgConfidence: { $avg: '$confidence' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalInsights: 0,
          unreadInsights: 0,
          avgConfidence: 0,
          lastInsight: null,
          insightsByType: []
        },
        typeStats,
        monthlyStats
      }
    });

  } catch (error) {
    console.error('Insights stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch insights statistics',
      error: error.message
    });
  }
});

// Get recent insights
router.get('/recent/list', auth, async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const insights = await AiInsight.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('title summary type confidence isRead createdAt')
      .populate('file', 'reportType reportDate');

    res.json({
      success: true,
      data: insights
    });

  } catch (error) {
    console.error('Get recent insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent insights',
      error: error.message
    });
  }
});

// Generate health tips (AI-powered)
router.post('/generate-tips', auth, async (req, res) => {
  try {
    const geminiService = require('../services/geminiService');
    
    // Get user's recent vitals and reports for context
    const Vitals = require('../models/Vitals');
    const File = require('../models/File');
    
    const recentVitals = await Vitals.find({ user: req.user.id })
      .sort({ recordedAt: -1 })
      .limit(5);
    
    const recentReports = await File.find({ user: req.user.id })
      .sort({ uploadedAt: -1 })
      .limit(3);

    // Generate personalized health tips
    const tips = await geminiService.generateHealthTips({
      vitals: recentVitals,
      reports: recentReports,
      userProfile: {
        name: req.user.name,
        age: req.user.age,
        gender: req.user.gender
      }
    });

    // Save the generated tips as an insight
    const insight = new AiInsight({
      user: req.user.id,
      type: 'health_tips',
      title: 'Personalized Health Tips',
      summary: tips.summary,
      details: tips,
      confidence: 0.8,
      language: 'both'
    });

    await insight.save();

    res.json({
      success: true,
      message: 'Health tips generated successfully',
      data: insight
    });

  } catch (error) {
    console.error('Generate health tips error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate health tips',
      error: error.message
    });
  }
});

module.exports = router;