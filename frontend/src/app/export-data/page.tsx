'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { ArrowLeft, Download, FileText, Calendar, Database, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ExportOptions {
  vitals: boolean;
  reports: boolean;
  insights: boolean;
  profile: boolean;
  format: 'json' | 'csv' | 'pdf';
  dateRange: {
    start: string;
    end: string;
  };
}

interface ExportHistory {
  id: string;
  type: string;
  format: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  downloadUrl?: string;
}

export default function ExportDataPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    vitals: true,
    reports: true,
    insights: true,
    profile: true,
    format: 'json',
    dateRange: {
      start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year ago
      end: new Date().toISOString().split('T')[0]
    }
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState<ExportHistory[]>([]);
  const [dataStats, setDataStats] = useState({
    vitals: 0,
    reports: 0,
    insights: 0
  });

  useEffect(() => {
    fetchDataStats();
    fetchExportHistory();
  }, []);

  const fetchDataStats = async () => {
    try {
      const [vitalsRes, reportsRes, insightsRes] = await Promise.all([
        fetch('/api/vitals', { credentials: 'include' }),
        fetch('/api/files', { credentials: 'include' }),
        fetch('/api/insights', { credentials: 'include' })
      ]);

      const vitalsData = vitalsRes.ok ? await vitalsRes.json() : { data: [] };
      const reportsData = reportsRes.ok ? await reportsRes.json() : { data: [] };
      const insightsData = insightsRes.ok ? await insightsRes.json() : { data: [] };

      setDataStats({
        vitals: vitalsData.data?.length || 0,
        reports: reportsData.data?.length || 0,
        insights: insightsData.data?.length || 0
      });
    } catch (error) {
      console.error('Error fetching data stats:', error);
    }
  };

  const fetchExportHistory = async () => {
    try {
      const response = await fetch('/api/export/history', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setExportHistory(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching export history:', error);
    }
  };

  const handleOptionChange = (option: keyof ExportOptions, value: any) => {
    setExportOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    setExportOptions(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: value
      }
    }));
  };

  const validateExportOptions = () => {
    if (!exportOptions.vitals && !exportOptions.reports && !exportOptions.insights && !exportOptions.profile) {
      toast.error('Please select at least one data type to export');
      return false;
    }

    if (new Date(exportOptions.dateRange.start) > new Date(exportOptions.dateRange.end)) {
      toast.error('Start date cannot be after end date');
      return false;
    }

    return true;
  };

  const handleExport = async () => {
    if (!validateExportOptions()) return;

    setIsExporting(true);

    try {
      const response = await fetch('/api/export/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(exportOptions)
      });

      if (!response.ok) {
        throw new Error('Export request failed');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Export request submitted! You will be notified when ready.');
        fetchExportHistory();
      } else {
        throw new Error(result.message || 'Export request failed');
      }

    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.message || 'Failed to request export');
    } finally {
      setIsExporting(false);
    }
  };

  const downloadExport = async (exportId: string) => {
    try {
      const response = await fetch(`/api/export/download/${exportId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `healthmate-export-${exportId}.${exportOptions.format}`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Export downloaded successfully!');
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error(error.message || 'Failed to download export');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
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
              <h1 className="text-2xl font-bold text-gray-900">Export Health Data</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Data Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Health Data Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center p-4 bg-blue-50 rounded-lg">
              <Database className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Vitals Records</p>
                <p className="text-2xl font-bold text-gray-900">{dataStats.vitals}</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-green-50 rounded-lg">
              <FileText className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Medical Reports</p>
                <p className="text-2xl font-bold text-gray-900">{dataStats.reports}</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-purple-50 rounded-lg">
              <Calendar className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">AI Insights</p>
                <p className="text-2xl font-bold text-gray-900">{dataStats.insights}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Export Options */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Options</h2>
            
            <div className="space-y-6">
              {/* Data Types */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Select Data Types</h3>
                <div className="space-y-3">
                  {[
                    { key: 'vitals', label: 'Vitals Records', count: dataStats.vitals },
                    { key: 'reports', label: 'Medical Reports', count: dataStats.reports },
                    { key: 'insights', label: 'AI Insights', count: dataStats.insights },
                    { key: 'profile', label: 'Profile Information', count: 1 }
                  ].map(({ key, label, count }) => (
                    <label key={key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={exportOptions[key as keyof ExportOptions] as boolean}
                          onChange={(e) => handleOptionChange(key as keyof ExportOptions, e.target.checked)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm font-medium text-gray-700">{label}</span>
                      </div>
                      <span className="text-sm text-gray-500">{count} items</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Date Range</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={exportOptions.dateRange.start}
                      onChange={(e) => handleDateRangeChange('start', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">End Date</label>
                    <input
                      type="date"
                      value={exportOptions.dateRange.end}
                      onChange={(e) => handleDateRangeChange('end', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Format */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Export Format</h3>
                <div className="space-y-2">
                  {[
                    { value: 'json', label: 'JSON (Machine readable)', description: 'Best for developers and data analysis' },
                    { value: 'csv', label: 'CSV (Spreadsheet)', description: 'Best for Excel and Google Sheets' },
                    { value: 'pdf', label: 'PDF (Human readable)', description: 'Best for printing and sharing' }
                  ].map(({ value, label, description }) => (
                    <label key={value} className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="format"
                        value={value}
                        checked={exportOptions.format === value}
                        onChange={(e) => handleOptionChange('format', e.target.value)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 mt-0.5"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-700">{label}</div>
                        <div className="text-xs text-gray-500">{description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Export Button */}
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full flex items-center justify-center px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5 mr-2" />
                    Request Export
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Export History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Export History</h2>
            
            {exportHistory.length === 0 ? (
              <div className="text-center py-8">
                <Download className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No exports yet</p>
                <p className="text-sm text-gray-500">Your export history will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {exportHistory.map((exportItem) => (
                  <div key={exportItem.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      {getStatusIcon(exportItem.status)}
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {exportItem.type} ({exportItem.format.toUpperCase()})
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(exportItem.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(exportItem.status)}`}>
                        {exportItem.status}
                      </span>
                      
                      {exportItem.status === 'completed' && exportItem.downloadUrl && (
                        <button
                          onClick={() => downloadExport(exportItem.id)}
                          className="p-1 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-blue-900">Privacy & Security</h3>
              <p className="text-sm text-blue-700 mt-1">
                Your health data is encrypted and securely processed. Exports are generated on-demand and 
                available for download for 7 days. We never share your personal health information with third parties.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
