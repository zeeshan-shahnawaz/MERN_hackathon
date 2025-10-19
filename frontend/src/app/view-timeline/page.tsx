'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { ArrowLeft, Calendar, FileText, Activity, Heart, Filter, Download, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api';

interface TimelineItem {
  id: string;
  type: 'vitals' | 'report' | 'insight';
  title: string;
  date: string;
  description: string;
  data?: any;
  status?: string;
}

export default function ViewTimelinePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'vitals' | 'reports' | 'insights'>('all');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year' | 'all'>('month');

  useEffect(() => {
    fetchTimelineData();
  }, [filter, dateRange]);

  const fetchTimelineData = async () => {
    setLoading(true);
    try {
      // Fetch vitals data
      const vitalsData = await apiClient.getVitals();

      // Fetch reports data
      const reportsData = await apiClient.getFiles();

      // Fetch insights data
      const insightsData = await apiClient.getInsights();

      // Combine and format timeline items
      const items: TimelineItem[] = [];

      // Add vitals
      if (vitalsData.success && vitalsData.data && Array.isArray(vitalsData.data)) {
        vitalsData.data.forEach((vital: any) => {
          items.push({
            id: vital._id,
            type: 'vitals',
            title: 'Vitals Recorded',
            date: vital.recordedAt || vital.createdAt,
            description: `BP: ${vital.bloodPressure?.systolic || 'N/A'}/${vital.bloodPressure?.diastolic || 'N/A'} mmHg, HR: ${vital.heartRate || 'N/A'} bpm`,
            data: vital
          });
        });
      }

      // Add reports
      if (reportsData.success && reportsData.data && Array.isArray(reportsData.data)) {
        reportsData.data.forEach((report: any) => {
          items.push({
            id: report._id,
            type: 'report',
            title: report.reportType || 'Medical Report',
            date: report.reportDate || report.createdAt,
            description: report.notes || 'Medical report uploaded',
            data: report,
            status: report.status || 'uploaded'
          });
        });
      }

      // Add insights
      if (insightsData.success && insightsData.data && Array.isArray(insightsData.data)) {
        insightsData.data.forEach((insight: any) => {
          items.push({
            id: insight._id,
            type: 'insight',
            title: 'AI Health Insight',
            date: insight.createdAt,
            description: insight.summary || 'AI-generated health insight',
            data: insight
          });
        });
      }

      // Sort by date (newest first)
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Apply filters
      let filteredItems = items;
      
      if (filter !== 'all') {
        const typeMap = {
          'vitals': 'vitals',
          'reports': 'report',
          'insights': 'insight'
        };
        filteredItems = items.filter(item => item.type === typeMap[filter]);
      }

      // Apply date range filter
      if (dateRange !== 'all') {
        const now = new Date();
        const cutoffDate = new Date();
        
        switch (dateRange) {
          case 'week':
            cutoffDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            cutoffDate.setMonth(now.getMonth() - 1);
            break;
          case 'year':
            cutoffDate.setFullYear(now.getFullYear() - 1);
            break;
        }
        
        filteredItems = filteredItems.filter(item => 
          new Date(item.date) >= cutoffDate
        );
      }

      setTimelineItems(filteredItems);
    } catch (error) {
      console.error('Error fetching timeline data:', error);
      toast.error('Failed to load timeline data');
    } finally {
      setLoading(false);
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'vitals':
        return <Activity className="h-5 w-5 text-blue-600" />;
      case 'report':
        return <FileText className="h-5 w-5 text-green-600" />;
      case 'insight':
        return <Heart className="h-5 w-5 text-purple-600" />;
      default:
        return <Calendar className="h-5 w-5 text-gray-600" />;
    }
  };

  const getItemColor = (type: string) => {
    switch (type) {
      case 'vitals':
        return 'border-blue-200 bg-blue-50';
      case 'report':
        return 'border-green-200 bg-green-50';
      case 'insight':
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportTimeline = () => {
    const csvContent = [
      ['Type', 'Title', 'Date', 'Description'].join(','),
      ...timelineItems.map(item => [
        item.type,
        `"${item.title}"`,
        `"${formatDate(item.date)}"`,
        `"${item.description}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-timeline-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Timeline exported successfully!');
  };

  if (!user) {
    return null;
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
              <h1 className="text-2xl font-bold text-gray-900">Health Timeline</h1>
            </div>
            <button
              onClick={exportTimeline}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <Filter className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700 mr-3">Filter:</span>
            </div>
            
            {(['all', 'vitals', 'reports', 'insights'] as const).map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === filterType
                    ? 'bg-primary-100 text-primary-700 border border-primary-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </button>
            ))}

            <div className="flex items-center ml-6">
              <span className="text-sm font-medium text-gray-700 mr-3">Period:</span>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="year">Last Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading timeline...</p>
            </div>
          ) : timelineItems.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No timeline data</h3>
              <p className="text-gray-600 mb-4">
                {filter === 'all' 
                  ? "Start by recording your vitals or uploading medical reports."
                  : `No ${filter} found for the selected period.`
                }
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => router.push('/add-vitals')}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Record Vitals
                </button>
                <button
                  onClick={() => router.push('/upload-report')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Upload Report
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {timelineItems.map((item, index) => (
                <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full border-2 ${getItemColor(item.type)} flex items-center justify-center`}>
                      {getItemIcon(item.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                        <span className="text-sm text-gray-500">{formatDate(item.date)}</span>
                      </div>
                      
                      <p className="text-gray-600 mt-1">{item.description}</p>
                      
                      {item.data && (
                        <div className="mt-3 flex space-x-2">
                          <button
                            onClick={() => {
                              if (item.type === 'insight') {
                                router.push(`/insights/${item.id}`);
                              } else {
                                toast('View details functionality coming soon!');
                              }
                            }}
                            className="flex items-center px-3 py-1 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </button>
                          
                          {item.type === 'report' && (
                            <button
                              onClick={() => {
                                // TODO: Implement download functionality
                                toast('Download functionality coming soon!');
                              }}
                              className="flex items-center px-3 py-1 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {timelineItems.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Vitals Records</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {timelineItems.filter(item => item.type === 'vitals').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Medical Reports</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {timelineItems.filter(item => item.type === 'report').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center">
                <Heart className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">AI Insights</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {timelineItems.filter(item => item.type === 'insight').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
