const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { authenticateToken: auth } = require('../middleware/auth');
const Vitals = require('../models/Vitals');

// Record new vitals
router.post('/', auth, async (req, res) => {
  try {
    const {
      bloodPressure,
      heartRate,
      temperature,
      weight,
      height,
      bloodSugar,
      oxygenSaturation,
      recordedAt,
      notes
    } = req.body;

    // Validate required fields
    if (!recordedAt) {
      return res.status(400).json({
        success: false,
        message: 'Recorded date and time are required'
      });
    }

    // Create vitals record
    const vitals = new Vitals({
      user: req.user.id,
      bloodPressure: bloodPressure ? {
        systolic: parseInt(bloodPressure.systolic),
        diastolic: parseInt(bloodPressure.diastolic)
      } : undefined,
      heartRate: heartRate ? parseInt(heartRate) : undefined,
      temperature: temperature ? parseFloat(temperature) : undefined,
      weight: weight ? parseFloat(weight) : undefined,
      height: height ? parseFloat(height) : undefined,
      bloodSugar: bloodSugar ? parseInt(bloodSugar) : undefined,
      oxygenSaturation: oxygenSaturation ? parseInt(oxygenSaturation) : undefined,
      recordedAt: new Date(recordedAt),
      notes: notes || ''
    });

    await vitals.save();

    res.status(201).json({
      success: true,
      message: 'Vitals recorded successfully',
      data: vitals
    });

  } catch (error) {
    console.error('Vitals recording error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record vitals',
      error: error.message
    });
  }
});

// Get user's vitals
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, type, days } = req.query;
    const skip = (page - 1) * limit;

    let vitals;

    if (type && days) {
      // Get specific type of vitals for specified days
      vitals = await Vitals.getVitalsHistory(req.user.id, type, parseInt(days));
    } else {
      // Get all vitals with pagination
      vitals = await Vitals.find({ user: req.user.id })
        .sort({ recordedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
    }

    const total = await Vitals.countDocuments({ user: req.user.id });

    res.json({
      success: true,
      data: vitals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get vitals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vitals',
      error: error.message
    });
  }
});

// Get latest vitals
router.get('/latest', auth, async (req, res) => {
  try {
    const latestVitals = await Vitals.getLatestVitals(req.user.id);

    res.json({
      success: true,
      data: latestVitals
    });

  } catch (error) {
    console.error('Get latest vitals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch latest vitals',
      error: error.message
    });
  }
});

// Get specific vitals record
router.get('/:id', auth, async (req, res) => {
  try {
    const vitals = await Vitals.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!vitals) {
      return res.status(404).json({
        success: false,
        message: 'Vitals record not found'
      });
    }

    res.json({
      success: true,
      data: vitals
    });

  } catch (error) {
    console.error('Get vitals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vitals',
      error: error.message
    });
  }
});

// Update vitals record
router.put('/:id', auth, async (req, res) => {
  try {
    const vitals = await Vitals.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!vitals) {
      return res.status(404).json({
        success: false,
        message: 'Vitals record not found'
      });
    }

    const {
      bloodPressure,
      heartRate,
      temperature,
      weight,
      height,
      bloodSugar,
      oxygenSaturation,
      recordedAt,
      notes
    } = req.body;

    // Update fields if provided
    if (bloodPressure) {
      vitals.bloodPressure = {
        systolic: parseInt(bloodPressure.systolic),
        diastolic: parseInt(bloodPressure.diastolic)
      };
    }
    if (heartRate !== undefined) vitals.heartRate = parseInt(heartRate);
    if (temperature !== undefined) vitals.temperature = parseFloat(temperature);
    if (weight !== undefined) vitals.weight = parseFloat(weight);
    if (height !== undefined) vitals.height = parseFloat(height);
    if (bloodSugar !== undefined) vitals.bloodSugar = parseInt(bloodSugar);
    if (oxygenSaturation !== undefined) vitals.oxygenSaturation = parseInt(oxygenSaturation);
    if (recordedAt) vitals.recordedAt = new Date(recordedAt);
    if (notes !== undefined) vitals.notes = notes;

    await vitals.save();

    res.json({
      success: true,
      message: 'Vitals updated successfully',
      data: vitals
    });

  } catch (error) {
    console.error('Update vitals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vitals',
      error: error.message
    });
  }
});

// Delete vitals record
router.delete('/:id', auth, async (req, res) => {
  try {
    const vitals = await Vitals.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!vitals) {
      return res.status(404).json({
        success: false,
        message: 'Vitals record not found'
      });
    }

    await Vitals.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Vitals deleted successfully'
    });

  } catch (error) {
    console.error('Delete vitals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete vitals',
      error: error.message
    });
  }
});

// Get vitals statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const stats = await Vitals.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user._id) } },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          avgHeartRate: { $avg: '$heartRate' },
          avgTemperature: { $avg: '$temperature' },
          avgWeight: { $avg: '$weight' },
          avgBloodSugar: { $avg: '$bloodSugar' },
          avgOxygenSaturation: { $avg: '$oxygenSaturation' },
          avgSystolicBP: { $avg: '$bloodPressure.systolic' },
          avgDiastolicBP: { $avg: '$bloodPressure.diastolic' },
          lastRecord: { $max: '$recordedAt' },
          firstRecord: { $min: '$recordedAt' }
        }
      }
    ]);

    const monthlyStats = await Vitals.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user._id) } },
      {
        $group: {
          _id: {
            year: { $year: '$recordedAt' },
            month: { $month: '$recordedAt' }
          },
          count: { $sum: 1 },
          avgHeartRate: { $avg: '$heartRate' },
          avgWeight: { $avg: '$weight' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalRecords: 0,
          avgHeartRate: null,
          avgTemperature: null,
          avgWeight: null,
          avgBloodSugar: null,
          avgOxygenSaturation: null,
          avgSystolicBP: null,
          avgDiastolicBP: null,
          lastRecord: null,
          firstRecord: null
        },
        monthlyStats
      }
    });

  } catch (error) {
    console.error('Vitals stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vitals statistics',
      error: error.message
    });
  }
});

// Get vitals trends
router.get('/stats/trends', auth, async (req, res) => {
  try {
    const { type, days = 30 } = req.query;
    
    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Type parameter is required'
      });
    }

    const trends = await Vitals.getVitalsHistory(req.user.id, type, parseInt(days));

    res.json({
      success: true,
      data: trends
    });

  } catch (error) {
    console.error('Vitals trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vitals trends',
      error: error.message
    });
  }
});

module.exports = router;