import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';

const API_BASE_URL = '/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = Cookies.get('healthmate_token');
        console.log('API Request - Token found:', !!token);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('API Request - Authorization header set');
        } else {
          console.log('API Request - No token found');
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          Cookies.remove('healthmate_token');
          window.location.href = '/auth/login';
          return Promise.reject(error);
        }

        // Show error toast for client errors
        if (error.response?.status >= 400 && error.response?.status < 500) {
          const message = error.response?.data?.message || 'Something went wrong';
          toast.error(message);
        } else if (error.response?.status >= 500) {
          toast.error('Server error. Please try again later.');
        } else if (error.code === 'NETWORK_ERROR') {
          toast.error('Network error. Please check your connection.');
        }

        return Promise.reject(error);
      }
    );
  }

  // Generic request methods
  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.client.get(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete(url);
    return response.data;
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.patch(url, data);
    return response.data;
  }

  async upload<T>(url: string, formData: FormData, onProgress?: (progress: number) => void): Promise<T> {
    const response = await this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  }

  // Auth methods
  async login(email: string, password: string) {
    const response = await this.post('/auth/login', { email, password }) as any;
    if (response.success && response.data.token) {
      Cookies.set('healthmate_token', response.data.token, { expires: 7 });
    }
    return response;
  }

  async register(userData: any) {
    const response = await this.post('/auth/register', userData) as any;
    if (response.success && response.data.token) {
      Cookies.set('healthmate_token', response.data.token, { expires: 7 });
    }
    return response;
  }

  async logout() {
    try {
      await this.post('/auth/logout');
    } finally {
      Cookies.remove('healthmate_token');
    }
  }

  async refreshToken() {
    const refreshToken = Cookies.get('healthmate_refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await this.post('/auth/refresh', { refreshToken }) as any;
    if (response.success && response.data.token) {
      Cookies.set('healthmate_token', response.data.token, { expires: 7 });
      if (response.data.refreshToken) {
        Cookies.set('healthmate_refresh_token', response.data.refreshToken, { expires: 30 });
      }
    }
    return response;
  }

  // User methods
  async getProfile() {
    return this.get('/user/profile');
  }

  async updateProfile(data: any) {
    return this.put('/user/profile', data);
  }

  async getDashboard() {
    return this.get('/user/dashboard');
  }

  async getActivity() {
    return this.get('/user/activity');
  }

  async exportData() {
    return this.get('/user/export-data');
  }

  // File methods
  async uploadFile(file: File, metadata: any, onProgress?: (progress: number) => void) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('reportType', metadata.reportType);
    formData.append('reportDate', metadata.reportDate);
    if (metadata.hospital) {
      formData.append('hospital', JSON.stringify(metadata.hospital));
    }
    if (metadata.tags) {
      formData.append('tags', JSON.stringify(metadata.tags));
    }

    return this.upload('/files/upload', formData, onProgress);
  }

  async getFiles(params?: any) {
    return this.get('/files', params);
  }

  async getFile(id: string) {
    return this.get(`/files/${id}`);
  }

  async updateFile(id: string, data: any) {
    return this.put(`/files/${id}`, data);
  }

  async deleteFile(id: string) {
    return this.delete(`/files/${id}`);
  }

  async getFileDownloadUrl(id: string) {
    return this.get(`/files/${id}/download`);
  }

  async reprocessFile(id: string) {
    return this.post(`/files/${id}/reprocess`);
  }

  async getFileStats() {
    return this.get('/files/stats/overview');
  }

  // Insights methods
  async getInsights(params?: any) {
    return this.get('/insights', params);
  }

  async getInsight(id: string) {
    return this.get(`/insights/${id}`);
  }

  async markInsightAsRead(id: string) {
    return this.patch(`/insights/${id}/read`);
  }

  async updateInsightFeedback(id: string, feedback: any) {
    return this.put(`/insights/${id}/feedback`, feedback);
  }

  async getInsightStats() {
    return this.get('/insights/stats/overview');
  }

  async getCriticalInsights() {
    return this.get('/insights/critical');
  }

  async getInsightTrends() {
    return this.get('/insights/trends');
  }

  async exportInsight(id: string, format: string, language: string) {
    return this.post(`/insights/${id}/export`, { format, language });
  }

  // Vitals methods
  async addVital(data: any) {
    return this.post('/vitals', data);
  }

  async getVitals(params?: any) {
    return this.get('/vitals', params);
  }

  async getLatestVitals() {
    return this.get('/vitals/latest');
  }

  async getVital(id: string) {
    return this.get(`/vitals/${id}`);
  }

  async updateVital(id: string, data: any) {
    return this.put(`/vitals/${id}`, data);
  }

  async deleteVital(id: string) {
    return this.delete(`/vitals/${id}`);
  }

  async getVitalStats() {
    return this.get('/vitals/stats/overview');
  }

  async getVitalTrends(type: string, days?: number) {
    return this.get(`/vitals/trends/${type}`, { days });
  }

  async getVitalRange(type: string, startDate: string, endDate: string) {
    return this.get(`/vitals/range/${type}`, { startDate, endDate });
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

// Export types
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
    items: T[];
    pagination: {
      current: number;
      pages: number;
      total: number;
      limit: number;
    };
  };
}

export default apiClient;
