'use client';

import { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Upload, 
  FileText, 
  Activity, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  Plus,
  Eye,
  Download,
  Users,
  UserPlus,
  X
} from 'lucide-react';
import { User } from '@/types';
import { apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface DashboardClientProps {
  user: User;
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'recent' | 'insights' | 'family'>('overview');
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ 
    name: '', 
    relation: '', 
    age: '', 
    problem: '', 
    doctorName: '', 
    treatmentSince: '', 
    hasReports: false 
  });

  // Load family members from localStorage
  useEffect(() => {
    const savedMembers = localStorage.getItem('familyMembers');
    if (savedMembers) {
      setFamilyMembers(JSON.parse(savedMembers));
    }
  }, []);

  // Save family members to localStorage
  const saveFamilyMembers = (members: any[]) => {
    localStorage.setItem('familyMembers', JSON.stringify(members));
    setFamilyMembers(members);
  };

  // Add new family member
  const addFamilyMember = () => {
    if (newMember.name && newMember.relation) {
      const member = {
        id: Date.now(),
        ...newMember,
        addedAt: new Date().toISOString()
      };
      const updatedMembers = [...familyMembers, member];
      saveFamilyMembers(updatedMembers);
      setNewMember({ name: '', relation: '', age: '', problem: '', doctorName: '', treatmentSince: '', hasReports: false });
      setShowAddMember(false);
    }
  };

  // Remove family member
  const removeFamilyMember = (id: number) => {
    const updatedMembers = familyMembers.filter(member => member.id !== id);
    saveFamilyMembers(updatedMembers);
  };

  // Fetch dashboard data
  const { data: dashboardData, isLoading, error } = useQuery(
    'dashboard',
    () => apiClient.getDashboard(),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Fetch recent files
  const { data: recentFiles } = useQuery(
    'recent-files',
    () => apiClient.getFiles({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
    {
      enabled: activeTab === 'recent',
    }
  );

  // Fetch recent insights
  const { data: recentInsights } = useQuery(
    'recent-insights',
    () => apiClient.getInsights({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
    {
      enabled: activeTab === 'insights',
    }
  );

  if (error) {
    toast.error('Failed to load dashboard data');
  }

  const stats = dashboardData?.data?.stats || {
    recentFiles: 0,
    totalFiles: 0,
    recentVitals: 0,
    criticalInsights: 0,
  };

  const latestVitals = dashboardData?.data?.latestVitals || [];
  const recentInsightsData = dashboardData?.data?.recentInsights || [];

  const quickActions = [
    {
      title: 'Upload Report',
      description: 'Add a new medical report',
      icon: Upload,
      href: '/upload-report',
      color: 'bg-primary-600 hover:bg-primary-700',
    },
    {
      title: 'Add Vitals',
      description: 'Record your vital signs',
      icon: Activity,
      href: '/add-vitals',
      color: 'bg-success-600 hover:bg-success-700',
    },
    {
      title: 'View Timeline',
      description: 'See your health history',
      icon: Calendar,
      href: '/view-timeline',
      color: 'bg-warning-600 hover:bg-warning-700',
    },
    {
      title: 'Export Data',
      description: 'Download your health data',
      icon: Download,
      href: '/export-data',
      color: 'bg-secondary-600 hover:bg-secondary-700',
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container-custom">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Heart className="h-8 w-8 text-primary-600" />
                <span className="text-xl font-bold text-gray-900">HealthMate</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-600">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container-custom py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {getGreeting()}, {user.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-600">
            Here's your health overview for today
          </p>
          <p className="text-gray-500 text-urdu">
            Aaj ke liye aapka health overview yahan hai
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalFiles}</p>
              </div>
              <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-success-600 mr-1" />
              <span className="text-success-600 font-medium">+{stats.recentFiles} this month</span>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Vitals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recentVitals}</p>
              </div>
              <div className="h-12 w-12 bg-success-100 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-success-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Calendar className="h-4 w-4 text-gray-400 mr-1" />
              <span className="text-gray-500">Last 7 days</span>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">AI Insights</p>
                <p className="text-2xl font-bold text-gray-900">{recentInsightsData.length}</p>
              </div>
              <div className="h-12 w-12 bg-warning-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-warning-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-500">Generated this month</span>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Findings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.criticalInsights}</p>
              </div>
              <div className="h-12 w-12 bg-error-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-error-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-error-600 font-medium">Requires attention</span>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className="card-hover p-6 text-center group"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg text-white mb-4 ${action.color}`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-6"
        >
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', count: null },
                { id: 'recent', label: 'Recent Files', count: recentFiles?.data?.files?.length || 0 },
                { id: 'insights', label: 'AI Insights', count: recentInsights?.data?.insights?.length || 0 },
                { id: 'family', label: 'Family', count: familyMembers.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count !== null && (
                    <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Latest Vitals */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Latest Vitals</h3>
                {latestVitals.length > 0 ? (
                  <div className="space-y-4">
                    {latestVitals.slice(0, 5).map((vital: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 capitalize">
                            {vital.type.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-gray-600">
                            {vital.formattedValue}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {new Date(vital.recordedAt).toLocaleDateString()}
                          </p>
                          <span className={`badge ${
                            vital.status === 'normal' ? 'badge-success' :
                            vital.status === 'abnormal' ? 'badge-warning' :
                            'badge-error'
                          }`}>
                            {vital.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No vitals recorded yet</p>
                    <Link href="/add-vitals" className="btn-primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Vital
                    </Link>
                  </div>
                )}
              </div>

              {/* Recent Insights */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent AI Insights</h3>
                {recentInsightsData.length > 0 ? (
                  <div className="space-y-4">
                    {recentInsightsData.slice(0, 3).map((insight: any, index: number) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900">
                            {insight.file?.originalName || 'Report Analysis'}
                          </h4>
                          <span className="badge badge-primary">
                            {insight.confidence}% confidence
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {insight.summary.english.substring(0, 100)}...
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {new Date(insight.createdAt).toLocaleDateString()}
                          </span>
                          <Link 
                            href={`/insights/${insight._id}`}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            <Eye className="h-4 w-4 inline mr-1" />
                            View Details
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No AI insights yet</p>
                    <Link href="/upload-report" className="btn-primary">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload First Report
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'recent' && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Files</h3>
              {recentFiles?.data?.files?.length > 0 ? (
                <div className="space-y-4">
                  {recentFiles.data.files.map((file: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{file.originalName}</h4>
                          <p className="text-sm text-gray-600 capitalize">
                            {file.reportType.replace('_', ' ')} • {new Date(file.reportDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`badge ${
                          file.processingStatus === 'completed' ? 'badge-success' :
                          file.processingStatus === 'processing' ? 'badge-warning' :
                          file.processingStatus === 'failed' ? 'badge-error' :
                          'badge-gray'
                        }`}>
                          {file.processingStatus}
                        </span>
                        <Link 
                          href={`/files/${file._id}`}
                          className="btn-ghost text-sm"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No files uploaded yet</p>
                  <Link href="/upload-report" className="btn-primary">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload First Report
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent AI Insights</h3>
              {recentInsights?.data?.insights?.length > 0 ? (
                <div className="space-y-6">
                  {recentInsights.data.insights.map((insight: any, index: number) => (
                    <div key={index} className="p-6 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">
                            {insight.file?.originalName || 'Report Analysis'}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {insight.file?.reportType?.replace('_', ' ')} • {new Date(insight.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="badge badge-primary">
                          {insight.confidence}% confidence
                        </span>
                      </div>
                      
                      <div className="mb-4">
                        <h5 className="font-medium text-gray-900 mb-2">Summary (English)</h5>
                        <p className="text-sm text-gray-700 mb-3">
                          {insight.summary.english}
                        </p>
                        <h5 className="font-medium text-gray-900 mb-2">Summary (Roman Urdu)</h5>
                        <p className="text-sm text-gray-700 text-urdu">
                          {insight.summary.urdu}
                        </p>
                      </div>

                      {insight.abnormalValues.length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-medium text-gray-900 mb-2">Abnormal Values</h5>
                          <div className="space-y-2">
                            {insight.abnormalValues.slice(0, 3).map((value: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-white rounded">
                                <span className="text-sm font-medium">{value.parameter}</span>
                                <span className={`badge ${
                                  value.severity === 'critical' ? 'badge-error' :
                                  value.severity === 'high' ? 'badge-warning' :
                                  'badge-gray'
                                }`}>
                                  {value.severity}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {insight.keyFindings.length > 0 && (
                            <span className="text-sm text-gray-600">
                              {insight.keyFindings.length} findings
                            </span>
                          )}
                          {insight.doctorQuestions.length > 0 && (
                            <span className="text-sm text-gray-600">
                              {insight.doctorQuestions.length} questions
                            </span>
                          )}
                        </div>
                        <Link 
                          href={`/insights/${insight._id}`}
                          className="btn-primary text-sm"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Full Analysis
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No AI insights generated yet</p>
                  <Link href="/upload" className="btn-primary">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Report for Analysis
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Family Tab */}
          {activeTab === 'family' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Family Members</h2>
                <button
                  onClick={() => setShowAddMember(true)}
                  className="btn-primary"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Family Member
                </button>
              </div>

              {/* Add Family Member Form */}
              {showAddMember && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Family Member</h3>
                  
                  {/* Basic Information */}
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                        <input
                          type="text"
                          value={newMember.name}
                          onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                          className="input"
                          placeholder="Enter name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Relation *</label>
                        <select
                          value={newMember.relation}
                          onChange={(e) => setNewMember({...newMember, relation: e.target.value})}
                          className="input"
                        >
                          <option value="">Select relation</option>
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                          <option value="Brother">Brother</option>
                          <option value="Sister">Sister</option>
                          <option value="Son">Son</option>
                          <option value="Daughter">Daughter</option>
                          <option value="Spouse">Spouse</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Age (Optional)</label>
                        <input
                          type="number"
                          value={newMember.age}
                          onChange={(e) => setNewMember({...newMember, age: e.target.value})}
                          className="input"
                          placeholder="Enter age"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Medical Information */}
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Medical Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Problem/Issue (Optional)</label>
                        <textarea
                          value={newMember.problem}
                          onChange={(e) => setNewMember({...newMember, problem: e.target.value})}
                          className="input"
                          rows={3}
                          placeholder="Describe any current health issues or problems..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Doctor Name (Optional)</label>
                        <input
                          type="text"
                          value={newMember.doctorName}
                          onChange={(e) => setNewMember({...newMember, doctorName: e.target.value})}
                          className="input"
                          placeholder="Enter doctor's name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Treatment Since (Optional)</label>
                        <input
                          type="date"
                          value={newMember.treatmentSince}
                          onChange={(e) => setNewMember({...newMember, treatmentSince: e.target.value})}
                          className="input"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Reports Section */}
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Medical Reports</h4>
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="hasReports"
                        checked={newMember.hasReports}
                        onChange={(e) => setNewMember({...newMember, hasReports: e.target.checked})}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="hasReports" className="text-sm text-gray-700">
                        This family member has medical reports to submit
                      </label>
                    </div>
                    {newMember.hasReports && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Note:</strong> You can upload old and new medical reports for this family member through the "Upload Report" section.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-3 mt-6">
                    <button onClick={addFamilyMember} className="btn-primary">
                      Add Family Member
                    </button>
                    <button onClick={() => setShowAddMember(false)} className="btn-secondary">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Family Members List */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {familyMembers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {familyMembers.map((member) => (
                      <div key={member.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">{member.name}</h4>
                          <button
                            onClick={() => removeFamilyMember(member.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Relation:</span> {member.relation}
                          </p>
                          {member.age && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Age:</span> {member.age} years
                            </p>
                          )}
                          {member.doctorName && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Doctor:</span> {member.doctorName}
                            </p>
                          )}
                          {member.treatmentSince && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Treatment Since:</span> {new Date(member.treatmentSince).toLocaleDateString()}
                            </p>
                          )}
                          {member.problem && (
                            <div className="mt-2">
                              <p className="text-sm font-medium text-gray-700 mb-1">Current Issue:</p>
                              <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded text-xs">
                                {member.problem}
                              </p>
                            </div>
                          )}
                          {member.hasReports && (
                            <div className="mt-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <FileText className="h-3 w-3 mr-1" />
                                Has Reports
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-100">
                          Added: {new Date(member.addedAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No family members added yet</p>
                    <button
                      onClick={() => setShowAddMember(true)}
                      className="btn-primary"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add First Family Member
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
