const mongoose = require('mongoose');

const vitalsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  type: {
    type: String,
    required: [true, 'Vital type is required'],
    enum: [
      'blood_pressure',
      'heart_rate',
      'temperature',
      'weight',
      'height',
      'blood_sugar',
      'oxygen_saturation',
      'respiratory_rate',
      'bmi',
      'waist_circumference',
      'body_fat_percentage',
      'sleep_hours',
      'steps',
      'calories_burned',
      'water_intake',
      'mood',
      'energy_level',
      'pain_level',
      'stress_level',
      'other'
    ]
  },
  value: {
    numeric: {
      type: Number,
      required: function() {
        return this.type !== 'mood' && this.type !== 'energy_level' && this.type !== 'pain_level' && this.type !== 'stress_level';
      }
    },
    text: {
      type: String,
      required: function() {
        return this.type === 'mood' || this.type === 'energy_level' || this.type === 'pain_level' || this.type === 'stress_level';
      }
    },
    systolic: {
      type: Number,
      required: function() {
        return this.type === 'blood_pressure';
      }
    },
    diastolic: {
      type: Number,
      required: function() {
        return this.type === 'blood_pressure';
      }
    }
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: [
      'mmHg', 'bpm', '°C', '°F', 'kg', 'lbs', 'cm', 'ft', 'in', 
      'mg/dL', 'mmol/L', '%', 'hours', 'steps', 'calories', 
      'liters', 'ml', 'cups', 'scale_1_10', 'scale_1_5', 'text'
    ]
  },
  recordedAt: {
    type: Date,
    required: [true, 'Recording date is required'],
    default: Date.now
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  source: {
    type: String,
    enum: ['manual', 'device', 'imported', 'calculated'],
    default: 'manual'
  },
  device: {
    name: String,
    model: String,
    serialNumber: String
  },
  location: {
    type: String,
    enum: ['home', 'hospital', 'clinic', 'pharmacy', 'other'],
    default: 'home'
  },
  conditions: {
    fasting: {
      type: Boolean,
      default: false
    },
    medication: {
      type: Boolean,
      default: false
    },
    exercise: {
      type: Boolean,
      default: false
    },
    stress: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low'
    },
    sleep: {
      hours: Number,
      quality: {
        type: String,
        enum: ['poor', 'fair', 'good', 'excellent']
      }
    }
  },
  status: {
    type: String,
    enum: ['normal', 'elevated', 'high', 'low', 'critical', 'unknown'],
    default: 'unknown'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  reminders: {
    enabled: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'custom']
    },
    time: String, // HH:MM format
    days: [String] // for weekly reminders
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
vitalsSchema.index({ user: 1, type: 1, recordedAt: -1 });
vitalsSchema.index({ user: 1, recordedAt: -1 });
vitalsSchema.index({ type: 1, status: 1 });
vitalsSchema.index({ tags: 1 });

// Virtual for formatted value
vitalsSchema.virtual('formattedValue').get(function() {
  if (this.type === 'blood_pressure') {
    return `${this.value.systolic}/${this.value.diastolic} ${this.unit}`;
  } else if (this.value.numeric !== undefined) {
    return `${this.value.numeric} ${this.unit}`;
  } else if (this.value.text) {
    return this.value.text;
  }
  return 'N/A';
});

// Virtual for age of reading
vitalsSchema.virtual('age').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.recordedAt);
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
  
  if (diffHours < 24) {
    return `${diffHours} hours ago`;
  } else {
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days ago`;
  }
});

// Method to check if vital is within normal range
vitalsSchema.methods.isNormal = function() {
  return this.status === 'normal';
};

// Method to check if vital is critical
vitalsSchema.methods.isCritical = function() {
  return this.status === 'critical';
};

// Method to get trend direction (requires multiple readings)
vitalsSchema.methods.getTrend = async function() {
  const Vitals = this.constructor;
  const previousReadings = await Vitals.find({
    user: this.user,
    type: this.type,
    recordedAt: { $lt: this.recordedAt }
  }).sort({ recordedAt: -1 }).limit(5);
  
  if (previousReadings.length === 0) return 'no_data';
  
  const currentValue = this.value.numeric || this.value.systolic;
  const previousValue = previousReadings[0].value.numeric || previousReadings[0].value.systolic;
  
  if (currentValue > previousValue) return 'increasing';
  if (currentValue < previousValue) return 'decreasing';
  return 'stable';
};

// Static method to get vitals by type and date range
vitalsSchema.statics.getVitalsByType = function(userId, type, startDate, endDate) {
  return this.find({
    user: userId,
    type: type,
    recordedAt: {
      $gte: startDate,
      $lte: endDate
    },
    isActive: true
  }).sort({ recordedAt: -1 });
};

// Static method to get latest vitals for each type
vitalsSchema.statics.getLatestVitals = function(userId) {
  return this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId), isActive: true } },
    { $sort: { recordedAt: -1 } },
    {
      $group: {
        _id: '$type',
        latest: { $first: '$$ROOT' }
      }
    },
    { $replaceRoot: { newRoot: '$latest' } },
    { $sort: { recordedAt: -1 } }
  ]);
};

// Static method to get vitals statistics
vitalsSchema.statics.getVitalsStats = function(userId, type, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        type: type,
        recordedAt: { $gte: startDate },
        isActive: true
      }
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        average: { $avg: '$value.numeric' },
        min: { $min: '$value.numeric' },
        max: { $max: '$value.numeric' },
        latest: { $max: '$recordedAt' }
      }
    }
  ]);
};

// Pre-save middleware to calculate BMI if weight and height are provided
vitalsSchema.pre('save', async function(next) {
  if (this.type === 'weight') {
    // Check if we have height data to calculate BMI
    const Vitals = this.constructor;
    const heightVital = await Vitals.findOne({
      user: this.user,
      type: 'height',
      isActive: true
    }).sort({ recordedAt: -1 });
    
    if (heightVital && this.value.numeric) {
      const heightInMeters = heightVital.value.numeric / 100; // assuming height is in cm
      const bmi = this.value.numeric / (heightInMeters * heightInMeters);
      
      // Create or update BMI record
      await Vitals.findOneAndUpdate(
        {
          user: this.user,
          type: 'bmi',
          recordedAt: {
            $gte: new Date(this.recordedAt.getTime() - 24 * 60 * 60 * 1000), // within 24 hours
            $lte: new Date(this.recordedAt.getTime() + 24 * 60 * 60 * 1000)
          }
        },
        {
          user: this.user,
          type: 'bmi',
          value: { numeric: Math.round(bmi * 10) / 10 },
          unit: 'kg/m²',
          recordedAt: this.recordedAt,
          source: 'calculated',
          notes: 'Auto-calculated from weight and height'
        },
        { upsert: true, new: true }
      );
    }
  }
  
  next();
});

module.exports = mongoose.model('Vitals', vitalsSchema);
