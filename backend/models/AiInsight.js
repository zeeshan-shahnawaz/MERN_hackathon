const mongoose = require('mongoose');

const aiInsightSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  file: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: [true, 'File reference is required']
  },
  summary: {
    english: {
      type: String,
      required: [true, 'English summary is required']
    },
    urdu: {
      type: String,
      required: [true, 'Urdu summary is required']
    }
  },
  keyFindings: [{
    parameter: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    },
    unit: String,
    normalRange: String,
    status: {
      type: String,
      enum: ['normal', 'abnormal', 'critical', 'borderline'],
      required: true
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
  riskFactors: [{
    factor: {
      english: String,
      urdu: String
    },
    level: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true
    },
    description: {
      english: String,
      urdu: String
    }
  }],
  followUpSuggestions: [{
    type: {
      type: String,
      enum: ['test', 'consultation', 'medication_review', 'lifestyle_check'],
      required: true
    },
    timeframe: {
      type: String,
      required: true
    },
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
  model: {
    type: String,
    default: 'gemini-1.5-pro'
  },
  processingTime: {
    type: Number, // in milliseconds
    default: 0
  },
  version: {
    type: String,
    default: '1.0'
  },
  isReviewed: {
    type: Boolean,
    default: false
  },
  userFeedback: {
    helpful: Boolean,
    accurate: Boolean,
    comments: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    }
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
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
aiInsightSchema.index({ user: 1, createdAt: -1 });
aiInsightSchema.index({ file: 1 });
aiInsightSchema.index({ 'keyFindings.status': 1 });
aiInsightSchema.index({ confidence: -1 });

// Virtual for insight age
aiInsightSchema.virtual('age').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for critical findings count
aiInsightSchema.virtual('criticalFindingsCount').get(function() {
  return this.abnormalValues.filter(finding => finding.severity === 'critical').length;
});

// Virtual for high priority recommendations count
aiInsightSchema.virtual('highPriorityRecommendationsCount').get(function() {
  const highPriorityLifestyle = this.recommendations.lifestyle.filter(rec => rec.priority === 'high').length;
  const urgentMedical = this.recommendations.medical.filter(rec => rec.urgency === 'urgent' || rec.urgency === 'emergency').length;
  return highPriorityLifestyle + urgentMedical;
});

// Method to get summary in preferred language
aiInsightSchema.methods.getSummary = function(language = 'both') {
  if (language === 'english') {
    return this.summary.english;
  } else if (language === 'urdu') {
    return this.summary.urdu;
  } else {
    return {
      english: this.summary.english,
      urdu: this.summary.urdu
    };
  }
};

// Method to get critical findings
aiInsightSchema.methods.getCriticalFindings = function() {
  return this.abnormalValues.filter(finding => finding.severity === 'critical');
};

// Method to get high priority questions
aiInsightSchema.methods.getHighPriorityQuestions = function() {
  return this.doctorQuestions.filter(question => question.priority === 'high');
};

// Method to update user feedback
aiInsightSchema.methods.updateFeedback = function(feedback) {
  this.userFeedback = {
    ...this.userFeedback,
    ...feedback,
    reviewedAt: new Date()
  };
  this.isReviewed = true;
  return this.save();
};

// Static method to get insights by user and date range
aiInsightSchema.statics.getInsightsByDateRange = function(userId, startDate, endDate) {
  return this.find({
    user: userId,
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  }).populate('file').sort({ createdAt: -1 });
};

// Static method to get insights with critical findings
aiInsightSchema.statics.getCriticalInsights = function(userId) {
  return this.find({
    user: userId,
    'abnormalValues.severity': 'critical'
  }).populate('file').sort({ createdAt: -1 });
};

// Pre-save middleware to set default disclaimers
aiInsightSchema.pre('save', function(next) {
  if (!this.disclaimers.aiDisclaimer) {
    this.disclaimers.aiDisclaimer = {
      english: "This analysis is generated by AI and is for informational purposes only. Always consult with a qualified healthcare professional for medical advice.",
      urdu: "Yeh analysis AI ke zariye generate hui hai aur sirf information ke liye hai. Medical advice ke liye hamesha qualified doctor se consult karein."
    };
  }
  
  if (!this.disclaimers.medicalDisclaimer) {
    this.disclaimers.medicalDisclaimer = {
      english: "This information should not replace professional medical advice, diagnosis, or treatment. Seek immediate medical attention for emergencies.",
      urdu: "Yeh information professional medical advice, diagnosis ya treatment ka replacement nahi hai. Emergency cases mein immediately doctor se contact karein."
    };
  }
  
  next();
});

module.exports = mongoose.model('AiInsight', aiInsightSchema);
