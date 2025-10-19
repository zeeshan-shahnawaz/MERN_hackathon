'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Upload, FileText, Image, File, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/api';

interface UploadFormData {
  reportType: string;
  reportDate: string;
  doctorName: string;
  hospitalName: string;
  notes: string;
}

export default function UploadReportPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState<UploadFormData>({
    reportType: '',
    reportDate: '',
    doctorName: '',
    hospitalName: '',
    notes: ''
  });

  const reportTypes = [
    'Blood Test',
    'X-Ray',
    'MRI Scan',
    'CT Scan',
    'Ultrasound',
    'ECG',
    'Prescription',
    'Doctor Consultation',
    'Other'
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      
      if (!isValidType) {
        toast.error(`${file.name} is not a supported file type. Please upload images or PDFs.`);
        return false;
      }
      
      if (!isValidSize) {
        toast.error(`${file.name} is too large. Please upload files smaller than 10MB.`);
        return false;
      }
      
      return true;
    });

    setUploadedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (uploadedFiles.length === 0) {
      toast.error('Please select at least one file to upload');
      return;
    }

    if (!formData.reportType || !formData.reportDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formDataToSend = new FormData();
      
      // Add form data
      formDataToSend.append('reportType', formData.reportType);
      formDataToSend.append('reportDate', formData.reportDate);
      formDataToSend.append('doctorName', formData.doctorName);
      formDataToSend.append('hospitalName', formData.hospitalName);
      formDataToSend.append('notes', formData.notes);

      // Add files
      uploadedFiles.forEach((file, index) => {
        formDataToSend.append(`files`, file);
      });

      const response = await apiClient.upload('/files/upload', formDataToSend, (progress) => {
        setUploadProgress(progress);
      });

      const result = response;
      
      if (result.success) {
        toast.success('Report uploaded successfully! AI analysis will be available shortly.');
        router.push('/dashboard');
      } else {
        throw new Error(result.message || 'Upload failed');
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to upload report');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
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
              <h1 className="text-2xl font-bold text-gray-900">Upload Medical Report</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Upload Files <span className="text-red-500">*</span>
                </label>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                    disabled={isUploading}
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-gray-500">
                      PNG, JPG, PDF up to 10MB each
                    </p>
                  </label>
                </div>

                {/* Uploaded Files */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          {file.type.startsWith('image/') ? (
                            <Image className="h-5 w-5 text-blue-500 mr-3" />
                          ) : (
                            <FileText className="h-5 w-5 text-red-500 mr-3" />
                          )}
                          <span className="text-sm font-medium text-gray-900">{file.name}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                          disabled={isUploading}
                        >
                          <File className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="reportType"
                    value={formData.reportType}
                    onChange={handleInputChange}
                    required
                    disabled={isUploading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select report type</option>
                    {reportTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="reportDate"
                    value={formData.reportDate}
                    onChange={handleInputChange}
                    required
                    disabled={isUploading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Doctor Name
                  </label>
                  <input
                    type="text"
                    name="doctorName"
                    value={formData.doctorName}
                    onChange={handleInputChange}
                    disabled={isUploading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Dr. John Smith"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hospital/Clinic Name
                  </label>
                  <input
                    type="text"
                    name="hospitalName"
                    value={formData.hospitalName}
                    onChange={handleInputChange}
                    disabled={isUploading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="City Hospital"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  disabled={isUploading}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Any additional information about this report..."
                />
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    <span className="text-sm font-medium text-blue-900">Uploading and analyzing...</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">{uploadProgress}% complete</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={isUploading}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || uploadedFiles.length === 0}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Report
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
