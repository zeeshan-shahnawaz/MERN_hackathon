// User types
export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  profilePicture?: string;
  isEmailVerified: boolean;
  lastLogin: string;
  preferences: {
    language: 'en' | 'ur' | 'both';
    notifications: boolean;
    theme: 'light' | 'dark' | 'auto';
  };
  subscription: {
    type: 'free' | 'premium';
    expiresAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// File types
export interface File {
  _id: string;
  user: string;
  originalName: string;
  fileName: string;
  filePath: string;
  fileUrl: string;
  fileType: 'pdf' | 'jpg' | 'jpeg' | 'png' | 'image' | 'document';
  mimeType: string;
  fileSize: number;
  reportType: 'blood_test' | 'urine_test' | 'x_ray' | 'ct_scan' | 'mri' | 'ultrasound' | 'ecg' | 'prescription' | 'discharge_summary' | 'consultation' | 'other';
  reportDate: string;
  hospital?: {
    name?: string;
    address?: string;
    doctor?: {
      name?: string;
      specialization?: string;
    };
  };
  tags: string[];
  isProcessed: boolean;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  processingError?: string;
  metadata?: {
    width?: number;
    height?: number;
    pages?: number;
    extractedText?: string;
  };
  isPublic: boolean;
  sharedWith: Array<{
    user: string;
    permission: 'view' | 'download';
    sharedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

// AI Insight types
export interface KeyFinding {
  parameter: string;
  value: string;
  unit?: string;
  normalRange?: string;
  status: 'normal' | 'abnormal' | 'critical' | 'borderline';
  explanation: {
    english: string;
    urdu: string;
  };
}

export interface AbnormalValue {
  parameter: string;
  value: string;
  unit?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  explanation: {
    english: string;
    urdu: string;
  };
  recommendation: {
    english: string;
    urdu: string;
  };
}

export interface DoctorQuestion {
  question: {
    english: string;
    urdu: string;
  };
  category: 'general' | 'medication' | 'lifestyle' | 'follow_up' | 'symptoms';
  priority: 'low' | 'medium' | 'high';
}

export interface LifestyleRecommendation {
  type: 'diet' | 'exercise' | 'sleep' | 'stress' | 'hydration' | 'other';
  suggestion: {
    english: string;
    urdu: string;
  };
  priority: 'low' | 'medium' | 'high';
}

export interface MedicalRecommendation {
  suggestion: {
    english: string;
    urdu: string;
  };
  urgency: 'routine' | 'soon' | 'urgent' | 'emergency';
}

export interface RiskFactor {
  factor: {
    english: string;
    urdu: string;
  };
  level: 'low' | 'medium' | 'high';
  description: {
    english: string;
    urdu: string;
  };
}

export interface FollowUpSuggestion {
  type: 'test' | 'consultation' | 'medication_review' | 'lifestyle_check';
  timeframe: string;
  description: {
    english: string;
    urdu: string;
  };
  priority: 'low' | 'medium' | 'high';
}

export interface UserFeedback {
  helpful?: boolean;
  accurate?: boolean;
  comments?: string;
  rating?: number;
  reviewedAt?: string;
}

export interface Disclaimers {
  aiDisclaimer: {
    english: string;
    urdu: string;
  };
  medicalDisclaimer: {
    english: string;
    urdu: string;
  };
}

export interface AiInsight {
  _id: string;
  user: string;
  file: string;
  summary: {
    english: string;
    urdu: string;
  };
  keyFindings: KeyFinding[];
  abnormalValues: AbnormalValue[];
  doctorQuestions: DoctorQuestion[];
  recommendations: {
    lifestyle: LifestyleRecommendation[];
    medical: MedicalRecommendation[];
  };
  riskFactors: RiskFactor[];
  followUpSuggestions: FollowUpSuggestion[];
  confidence: number;
  model: string;
  processingTime: number;
  version: string;
  isReviewed: boolean;
  userFeedback?: UserFeedback;
  disclaimers: Disclaimers;
  createdAt: string;
  updatedAt: string;
}

// Vitals types
export interface VitalValue {
  numeric?: number;
  text?: string;
  systolic?: number;
  diastolic?: number;
}

export interface VitalConditions {
  fasting?: boolean;
  medication?: boolean;
  exercise?: boolean;
  stress?: 'low' | 'medium' | 'high';
  sleep?: {
    hours?: number;
    quality?: 'poor' | 'fair' | 'good' | 'excellent';
  };
}

export interface VitalDevice {
  name?: string;
  model?: string;
  serialNumber?: string;
}

export interface VitalReminders {
  enabled: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'custom';
  time?: string;
  days?: string[];
}

export interface Vitals {
  _id: string;
  user: string;
  type: 'blood_pressure' | 'heart_rate' | 'temperature' | 'weight' | 'height' | 'blood_sugar' | 'oxygen_saturation' | 'respiratory_rate' | 'bmi' | 'waist_circumference' | 'body_fat_percentage' | 'sleep_hours' | 'steps' | 'calories_burned' | 'water_intake' | 'mood' | 'energy_level' | 'pain_level' | 'stress_level' | 'other';
  value: VitalValue;
  unit: 'mmHg' | 'bpm' | '°C' | '°F' | 'kg' | 'lbs' | 'cm' | 'ft' | 'in' | 'mg/dL' | 'mmol/L' | '%' | 'hours' | 'steps' | 'calories' | 'liters' | 'ml' | 'cups' | 'scale_1_10' | 'scale_1_5' | 'text';
  recordedAt: string;
  notes?: string;
  source: 'manual' | 'device' | 'imported' | 'calculated';
  device?: VitalDevice;
  location: 'home' | 'hospital' | 'clinic' | 'pharmacy' | 'other';
  conditions?: VitalConditions;
  status: 'normal' | 'elevated' | 'high' | 'low' | 'critical' | 'unknown';
  tags: string[];
  isActive: boolean;
  reminders?: VitalReminders;
  createdAt: string;
  updatedAt: string;
}

// Dashboard types
export interface DashboardStats {
  recentFiles: number;
  totalFiles: number;
  recentVitals: number;
  criticalInsights: number;
}

export interface ActivityItem {
  type: 'file_upload' | 'vital_added' | 'insight_generated';
  data: File | Vitals | AiInsight;
  timestamp: string;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
}

export interface FileUploadForm {
  file: File;
  reportType: File['reportType'];
  reportDate: string;
  hospital?: File['hospital'];
  tags: string[];
}

export interface VitalForm {
  type: Vitals['type'];
  value: VitalValue;
  unit: Vitals['unit'];
  recordedAt: string;
  notes?: string;
  tags: string[];
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: any[];
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: {
    [key: string]: T[];
    pagination: {
      current: number;
      pages: number;
      total: number;
      limit: number;
    };
  };
}

// Chart types
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface TrendData {
  type: string;
  period: string;
  stats: {
    count: number;
    average: number;
    min: number;
    max: number;
    latest: string;
  } | null;
  trends: Array<{
    _id: {
      year: number;
      month: number;
      day: number;
    };
    count: number;
    avgValue: number;
    minValue: number;
    maxValue: number;
  }>;
}

// Filter types
export interface FileFilters {
  reportType?: File['reportType'];
  startDate?: string;
  endDate?: string;
  tags?: string[];
  sortBy?: 'createdAt' | 'reportDate' | 'originalName';
  sortOrder?: 'asc' | 'desc';
}

export interface VitalFilters {
  type?: Vitals['type'];
  startDate?: string;
  endDate?: string;
  tags?: string[];
  sortBy?: 'recordedAt' | 'type';
  sortOrder?: 'asc' | 'desc';
}

export interface InsightFilters {
  fileId?: string;
  startDate?: string;
  endDate?: string;
  hasCriticalFindings?: boolean;
  sortBy?: 'createdAt' | 'confidence';
  sortOrder?: 'asc' | 'desc';
}
