'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { ArrowLeft, FileText, Calendar, User, Building, Brain, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/api';

interface AiInsight {
  _id: string;
  type: string;
  title: string;
  summary: {
    english: string;
    urdu: string;
  };
  keyFindings: Array<{
    parameter: string;
    value: string;
    unit?: string;
    normalRange?: string;
    status: 'normal' | 'abnormal' | 'critical' | 'borderline';
    explanation: {
      english?: string;
      urdu?: string;
    };
  }>;
  abnormalValues: Array<{
    parameter: string;
    value: string;
    unit?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    explanation: {
      english?: string;
      urdu?: string;
    };
    recommendation: {
      english?: string;
      urdu?: string;
    };
  }>;
  doctorQuestions: Array<{
    question: {
      english?: string;
      urdu?: string;
    };
    category: 'general' | 'medication' | 'lifestyle' | 'follow_up' | 'symptoms';
    priority: 'low' | 'medium' | 'high';
  }>;
  recommendations: {
    lifestyle: Array<{
      type: 'diet' | 'exercise' | 'sleep' | 'stress' | 'hydration' | 'other';
      suggestion: {
        english?: string;
        urdu?: string;
      };
      priority: 'low' | 'medium' | 'high';
    }>;
    medical: Array<{
      suggestion: {
        english?: string;
        urdu?: string;
      };
      urgency: 'routine' | 'soon' | 'urgent' | 'emergency';
    }>;
  };
  riskFactors: Array<{
    factor: {
      english?: string;
      urdu?: string;
    };
    level: 'low' | 'medium' | 'high';
    description: {
      english?: string;
      urdu?: string;
    };
  }>;
  followUpSuggestions: Array<{
    type: 'test' | 'consultation' | 'medication_review' | 'lifestyle_check';
    timeframe: string;
    description: {
      english?: string;
      urdu?: string;
    };
    priority: 'low' | 'medium' | 'high';
  }>;
  confidence: number;
  language: string;
  isRead: boolean;
  createdAt: string;
  file?: {
    _id: string;
    reportType: string;
    reportDate: string;
    doctorName?: string;
    hospitalName?: string;
  };
  disclaimers?: {
    aiDisclaimer: {
      english?: string;
      urdu?: string;
    };
    medicalDisclaimer: {
      english?: string;
      urdu?: string;
    };
  };
}

export default function InsightDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [insight, setInsight] = useState<AiInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<'english' | 'urdu' | 'both'>('both');
  const [showRawAnalysis, setShowRawAnalysis] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchInsight();
    }
  }, [params.id]);

  const fetchInsight = async () => {
    try {
      const response = await apiClient.get(`/insights/${params.id}`);
      setInsight(response.data);
      
      // Mark as read
      if (!response.data.isRead) {
        await apiClient.patch(`/insights/${params.id}/read`);
      }
    } catch (error: any) {
      console.error('Error fetching insight:', error);
      toast.error('Failed to load insight details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'High Confidence';
    if (confidence >= 0.6) return 'Medium Confidence';
    return 'Low Confidence';
  };

  // Helper function to get text based on language preference
  const getText = (textObj: { english?: string; urdu?: string }) => {
    if (!textObj) return '';
    
    if (language === 'english') {
      return textObj.english || textObj.urdu || '';
    } else if (language === 'urdu') {
      return textObj.urdu || textObj.english || '';
    } else {
      // Both languages
      if (textObj.english && textObj.urdu) {
        return `${textObj.english}\n\n${textObj.urdu}`;
      }
      return textObj.english || textObj.urdu || '';
    }
  };

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-600 bg-green-100';
      case 'abnormal': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      case 'borderline': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Helper function to get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading insight...</p>
        </div>
      </div>
    );
  }

  if (!insight) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Insight Not Found</h2>
          <p className="text-gray-600 mb-4">The requested insight could not be found.</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">AI Health Insight</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Language Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setLanguage('english')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    language === 'english' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage('urdu')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    language === 'urdu' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Urdu
                </button>
                <button
                  onClick={() => setLanguage('both')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    language === 'both' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Both
                </button>
              </div>
              
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getConfidenceColor(insight.confidence)}`}>
                {getConfidenceText(insight.confidence)}
              </span>
              <span className="text-sm text-gray-500">
                {formatDate(insight.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <Brain className="h-6 w-6 text-purple-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">AI Analysis Summary</h2>
              </div>
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                {getText(insight.summary)}
              </div>
            </div>

            {/* Key Findings */}
            {insight.keyFindings && insight.keyFindings.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900">Key Findings</h2>
                </div>
                <div className="space-y-4">
                  {insight.keyFindings.map((finding, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{finding.parameter}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(finding.status)}`}>
                          {finding.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <span className="text-sm text-gray-600">Value: </span>
                          <span className="font-medium">{finding.value} {finding.unit}</span>
                        </div>
                        {finding.normalRange && (
                          <div>
                            <span className="text-sm text-gray-600">Normal Range: </span>
                            <span className="text-sm">{finding.normalRange}</span>
                          </div>
                        )}
                      </div>
                      {finding.explanation && (
                        <div className="text-gray-700 text-sm whitespace-pre-line">
                          {getText(finding.explanation)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Abnormal Values */}
            {insight.abnormalValues && insight.abnormalValues.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900">Abnormal Values</h2>
                </div>
                <div className="space-y-4">
                  {insight.abnormalValues.map((value, index) => (
                    <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{value.parameter}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(value.severity)}`}>
                          {value.severity.toUpperCase()}
                        </span>
                      </div>
                      <div className="mb-3">
                        <span className="text-sm text-gray-600">Value: </span>
                        <span className="font-medium text-red-600">{value.value} {value.unit}</span>
                      </div>
                      {value.explanation && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Explanation:</h4>
                          <div className="text-gray-700 text-sm whitespace-pre-line">
                            {getText(value.explanation)}
                          </div>
                        </div>
                      )}
                      {value.recommendation && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Recommendation:</h4>
                          <div className="text-gray-700 text-sm whitespace-pre-line">
                            {getText(value.recommendation)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {(insight.recommendations?.lifestyle?.length > 0 || insight.recommendations?.medical?.length > 0) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <CheckCircle className="h-6 w-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900">Recommendations</h2>
                </div>
                
                {/* Lifestyle Recommendations */}
                {insight.recommendations?.lifestyle?.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Lifestyle Recommendations</h3>
                    <div className="space-y-3">
                      {insight.recommendations.lifestyle.map((rec, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900 capitalize">{rec.type}</h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              rec.priority === 'high' ? 'bg-red-100 text-red-600' :
                              rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-green-100 text-green-600'
                            }`}>
                              {rec.priority.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-gray-700 text-sm whitespace-pre-line">
                            {getText(rec.suggestion)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Medical Recommendations */}
                {insight.recommendations?.medical?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Medical Recommendations</h3>
                    <div className="space-y-3">
                      {insight.recommendations.medical.map((rec, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">Medical Suggestion</h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              rec.urgency === 'emergency' ? 'bg-red-100 text-red-600' :
                              rec.urgency === 'urgent' ? 'bg-orange-100 text-orange-600' :
                              rec.urgency === 'soon' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-green-100 text-green-600'
                            }`}>
                              {rec.urgency.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-gray-700 text-sm whitespace-pre-line">
                            {getText(rec.suggestion)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Doctor Questions */}
            {insight.doctorQuestions && insight.doctorQuestions.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <User className="h-6 w-6 text-purple-600 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900">Questions for Your Doctor</h2>
                </div>
                <div className="space-y-4">
                  {insight.doctorQuestions.map((question, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600 capitalize">{question.category}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          question.priority === 'high' ? 'bg-red-100 text-red-600' :
                          question.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          {question.priority.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-gray-700 whitespace-pre-line">
                        {getText(question.question)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risk Factors */}
            {insight.riskFactors && insight.riskFactors.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <AlertCircle className="h-6 w-6 text-orange-600 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900">Risk Factors</h2>
                </div>
                <div className="space-y-4">
                  {insight.riskFactors.map((risk, index) => (
                    <div key={index} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{getText(risk.factor)}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          risk.level === 'high' ? 'bg-red-100 text-red-600' :
                          risk.level === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          {risk.level.toUpperCase()}
                        </span>
                      </div>
                      {risk.description && (
                        <div className="text-gray-700 text-sm whitespace-pre-line">
                          {getText(risk.description)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Follow-up Suggestions */}
            {insight.followUpSuggestions && insight.followUpSuggestions.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <Clock className="h-6 w-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900">Follow-up Suggestions</h2>
                </div>
                <div className="space-y-4">
                  {insight.followUpSuggestions.map((suggestion, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 capitalize">{suggestion.type.replace('_', ' ')}</h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">{suggestion.timeframe}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            suggestion.priority === 'high' ? 'bg-red-100 text-red-600' :
                            suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-green-100 text-green-600'
                          }`}>
                            {suggestion.priority.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      {suggestion.description && (
                        <div className="text-gray-700 text-sm whitespace-pre-line">
                          {getText(suggestion.description)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimers */}
            {insight.disclaimers && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <AlertCircle className="h-6 w-6 text-yellow-600 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900">Important Disclaimers</h2>
                </div>
                <div className="space-y-4">
                  {insight.disclaimers.aiDisclaimer && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">AI Analysis Disclaimer</h3>
                      <div className="text-gray-700 text-sm whitespace-pre-line">
                        {getText(insight.disclaimers.aiDisclaimer)}
                      </div>
                    </div>
                  )}
                  {insight.disclaimers.medicalDisclaimer && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Medical Disclaimer</h3>
                      <div className="text-gray-700 text-sm whitespace-pre-line">
                        {getText(insight.disclaimers.medicalDisclaimer)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Report Information */}
            {insight.file && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-600">Type:</span>
                    <span className="text-sm font-medium text-gray-900 ml-2">{insight.file.reportType}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-600">Date:</span>
                    <span className="text-sm font-medium text-gray-900 ml-2">
                      {new Date(insight.file.reportDate).toLocaleDateString()}
                    </span>
                  </div>
                  {insight.file.doctorName && (
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-sm text-gray-600">Doctor:</span>
                      <span className="text-sm font-medium text-gray-900 ml-2">{insight.file.doctorName}</span>
                    </div>
                  )}
                  {insight.file.hospitalName && (
                    <div className="flex items-center">
                      <Building className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-sm text-gray-600">Hospital:</span>
                      <span className="text-sm font-medium text-gray-900 ml-2">{insight.file.hospitalName}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Analysis Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Details</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-600">Generated:</span>
                  <span className="text-sm font-medium text-gray-900 ml-2">
                    {formatDate(insight.createdAt)}
                  </span>
                </div>
                <div className="flex items-center">
                  <Brain className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-600">Language:</span>
                  <span className="text-sm font-medium text-gray-900 ml-2 capitalize">
                    {insight.language}
                  </span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-600">Confidence:</span>
                  <span className="text-sm font-medium text-gray-900 ml-2">
                    {Math.round(insight.confidence * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Raw AI Analysis Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Brain className="h-6 w-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900">Raw AI Analysis</h2>
                </div>
                <button
                  onClick={() => setShowRawAnalysis(!showRawAnalysis)}
                  className="btn-secondary text-sm"
                >
                  {showRawAnalysis ? 'Hide' : 'Show'} Raw Data
                </button>
              </div>
              
              {showRawAnalysis && (
                <div className="mt-4">
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-96">
                    <pre>{JSON.stringify(insight, null, 2)}</pre>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    This is the complete AI analysis data as received from the backend.
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/view-timeline')}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  View All Insights
                </button>
                <button
                  onClick={() => router.push('/upload-report')}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Upload Another Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
