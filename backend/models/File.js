const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportType: {
    type: String,
    required: true,
    enum: [
      'Blood Test',
      'X-Ray',
      'MRI Scan',
      'CT Scan',
      'Ultrasound',
      'ECG',
      'Prescription',
      'Doctor Consultation',
      'Other'
    ]
  },
  reportDate: {
    type: Date,
    required: true
  },
  doctorName: {
    type: String,
    default: ''
  },
  hospitalName: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  files: [{
    originalName: {
      type: String,
      required: true
    },
    cloudinaryId: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    format: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    }
  }],
  aiAnalysis: [{
    summary: {
      english: String,
      urdu: String
    },
    keyFindings: [{
      parameter: String,
      value: String,
      unit: String,
      normalRange: String,
      status: {
        type: String,
        enum: ['normal', 'abnormal', 'critical', 'borderline']
      },
      explanation: {
        english: String,
        urdu: String
      }
    }],
    abnormalValues: [{
      parameter: String,
      value: String,
      unit: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
      },
      explanation: {
        english: String,
        urdu: String
      },
      recommendation: {
        english: String,
        urdu: String
      }
    }],
    recommendations: {
      lifestyle: [{
        type: {
          type: String,
          enum: ['diet', 'exercise', 'sleep', 'stress', 'hydration', 'other']
        },
        suggestion: {
          english: String,
          urdu: String
        },
        priority: {
          type: String,
          enum: ['low', 'medium', 'high'],
          default: 'medium'
        }
      }],
      medical: [{
        suggestion: {
          english: String,
          urdu: String
        },
        urgency: {
          type: String,
          enum: ['routine', 'soon', 'urgent', 'emergency'],
          default: 'routine'
        }
      }]
    },
    doctorQuestions: [{
      question: {
        english: String,
        urdu: String
      },
      category: {
        type: String,
        enum: ['general', 'medication', 'lifestyle', 'follow_up', 'symptoms']
      },
      priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      }
    }],
    riskFactors: [{
      factor: {
        english: String,
        urdu: String
      },
      level: {
        type: String,
        enum: ['low', 'medium', 'high']
      },
      description: {
        english: String,
        urdu: String
      }
    }],
    followUpSuggestions: [{
      type: {
        type: String,
        enum: ['test', 'consultation', 'medication_review', 'lifestyle_check']
      },
      timeframe: String,
      description: {
        english: String,
        urdu: String
      },
      priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      }
    }],
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 85
    },
    language: {
      type: String,
      enum: ['english', 'urdu', 'both'],
      default: 'both'
    },
    model: {
      type: String,
      default: 'gemini-2.5-flash'
    },
    processingTime: {
      type: Number,
      default: 0
    },
    disclaimers: {
      aiDisclaimer: {
        english: String,
        urdu: String
      },
      medicalDisclaimer: {
        english: String,
        urdu: String
      }
    },
    analysisDate: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['uploaded', 'analyzing', 'analyzed', 'failed'],
    default: 'uploaded'
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  analyzedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
fileSchema.index({ user: 1, uploadedAt: -1 });
fileSchema.index({ user: 1, reportType: 1 });
fileSchema.index({ user: 1, reportDate: -1 });
fileSchema.index({ status: 1 });

// Virtual for formatted file size
fileSchema.virtual('totalSize').get(function() {
  return this.files.reduce((total, file) => total + file.size, 0);
});

// Virtual for formatted upload date
fileSchema.virtual('formattedUploadDate').get(function() {
  return this.uploadedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual for formatted report date
fileSchema.virtual('formattedReportDate').get(function() {
  return this.reportDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Method to get file count by type
fileSchema.statics.getFileCountByType = function(userId) {
  return this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$reportType',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Method to get recent files
fileSchema.statics.getRecentFiles = function(userId, limit = 5) {
  return this.find({ user: userId })
    .sort({ uploadedAt: -1 })
    .limit(limit)
    .select('reportType reportDate doctorName hospitalName status uploadedAt files')
    .populate('user', 'name email');
};

// Method to get files by date range
fileSchema.statics.getFilesByDateRange = function(userId, startDate, endDate) {
  return this.find({
    user: userId,
    reportDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).sort({ reportDate: -1 });
};

// Method to get files requiring attention
fileSchema.statics.getFilesRequiringAttention = function(userId) {
  return this.find({
    user: userId,
    $or: [
      { status: 'failed' },
      { 
        'aiAnalysis.abnormalValues': { $exists: true, $ne: [] },
        status: 'analyzed'
      }
    ]
  }).sort({ uploadedAt: -1 });
};

// Method to update analysis status
fileSchema.methods.updateAnalysisStatus = function(status, analysis = null) {
  this.status = status;
  if (analysis) {
    this.aiAnalysis.push(analysis);
    this.analyzedAt = new Date();
  }
  return this.save();
};

// Method to get formatted file info
fileSchema.methods.getFormattedFileInfo = function() {
  return {
    id: this._id,
    reportType: this.reportType,
    reportDate: this.formattedReportDate,
    doctorName: this.doctorName,
    hospitalName: this.hospitalName,
    notes: this.notes,
    fileCount: this.files.length,
    totalSize: this.totalSize,
    status: this.status,
    uploadedAt: this.formattedUploadDate,
    hasAnalysis: this.aiAnalysis.length > 0,
    analysisCount: this.aiAnalysis.length
  };
};

// Pre-save middleware to validate report date (removed future date restriction)
fileSchema.pre('save', function(next) {
  // Allow future dates for medical reports as they can be scheduled
  next();
});

// Pre-remove middleware to clean up Cloudinary files
fileSchema.pre('remove', async function(next) {
  try {
    const uploadService = require('../services/uploadService');
    
    // Delete files from Cloudinary
    for (const file of this.files) {
      try {
        await uploadService.deleteFile(file.cloudinaryId);
      } catch (error) {
        console.error('Error deleting file from Cloudinary:', error);
        // Continue with other files even if one fails
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('File', fileSchema);