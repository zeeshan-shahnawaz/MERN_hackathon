'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Heart, Activity, Thermometer, Weight, ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface VitalsData {
  bloodPressure: {
    systolic: string;
    diastolic: string;
  };
  heartRate: string;
  temperature: string;
  weight: string;
  height: string;
  bloodSugar: string;
  oxygenSaturation: string;
  date: string;
  time: string;
  notes: string;
}

export default function AddVitalsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vitalsData, setVitalsData] = useState<VitalsData>({
    bloodPressure: {
      systolic: '',
      diastolic: ''
    },
    heartRate: '',
    temperature: '',
    weight: '',
    height: '',
    bloodSugar: '',
    oxygenSaturation: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    notes: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'systolic' || name === 'diastolic') {
      setVitalsData(prev => ({
        ...prev,
        bloodPressure: {
          ...prev.bloodPressure,
          [name]: value
        }
      }));
    } else {
      setVitalsData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateVitals = () => {
    const errors: string[] = [];

    // Blood Pressure validation
    if (vitalsData.bloodPressure.systolic && vitalsData.bloodPressure.diastolic) {
      const systolic = parseInt(vitalsData.bloodPressure.systolic);
      const diastolic = parseInt(vitalsData.bloodPressure.diastolic);
      
      if (systolic < 70 || systolic > 250) {
        errors.push('Systolic blood pressure should be between 70-250 mmHg');
      }
      if (diastolic < 40 || diastolic > 150) {
        errors.push('Diastolic blood pressure should be between 40-150 mmHg');
      }
      if (systolic <= diastolic) {
        errors.push('Systolic pressure should be higher than diastolic pressure');
      }
    }

    // Heart Rate validation
    if (vitalsData.heartRate) {
      const hr = parseInt(vitalsData.heartRate);
      if (hr < 30 || hr > 220) {
        errors.push('Heart rate should be between 30-220 bpm');
      }
    }

    // Temperature validation
    if (vitalsData.temperature) {
      const temp = parseFloat(vitalsData.temperature);
      if (temp < 95 || temp > 110) {
        errors.push('Temperature should be between 95-110°F');
      }
    }

    // Weight validation
    if (vitalsData.weight) {
      const weight = parseFloat(vitalsData.weight);
      if (weight < 20 || weight > 1000) {
        errors.push('Weight should be between 20-1000 lbs');
      }
    }

    // Blood Sugar validation
    if (vitalsData.bloodSugar) {
      const sugar = parseInt(vitalsData.bloodSugar);
      if (sugar < 50 || sugar > 600) {
        errors.push('Blood sugar should be between 50-600 mg/dL');
      }
    }

    // Oxygen Saturation validation
    if (vitalsData.oxygenSaturation) {
      const oxygen = parseInt(vitalsData.oxygenSaturation);
      if (oxygen < 70 || oxygen > 100) {
        errors.push('Oxygen saturation should be between 70-100%');
      }
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateVitals();
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/vitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...vitalsData,
          recordedAt: new Date(`${vitalsData.date}T${vitalsData.time}`).toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save vitals');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Vitals recorded successfully!');
        router.push('/dashboard');
      } else {
        throw new Error(result.message || 'Failed to save vitals');
      }

    } catch (error: any) {
      console.error('Vitals submission error:', error);
      toast.error(error.message || 'Failed to save vitals');
    } finally {
      setIsSubmitting(false);
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
              <h1 className="text-2xl font-bold text-gray-900">Record Vitals</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={vitalsData.date}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={vitalsData.time}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Blood Pressure */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <Heart className="h-6 w-6 text-red-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Blood Pressure</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Systolic (mmHg)
                    </label>
                    <input
                      type="number"
                      name="systolic"
                      value={vitalsData.bloodPressure.systolic}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      placeholder="120"
                      min="70"
                      max="250"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Diastolic (mmHg)
                    </label>
                    <input
                      type="number"
                      name="diastolic"
                      value={vitalsData.bloodPressure.diastolic}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      placeholder="80"
                      min="40"
                      max="150"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Heart Rate */}
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <Activity className="h-6 w-6 text-pink-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Heart Rate</h3>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Heart Rate (bpm)
                  </label>
                  <input
                    type="number"
                    name="heartRate"
                    value={vitalsData.heartRate}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    placeholder="72"
                    min="30"
                    max="220"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Temperature */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <Thermometer className="h-6 w-6 text-orange-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Temperature</h3>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperature (°F)
                  </label>
                  <input
                    type="number"
                    name="temperature"
                    value={vitalsData.temperature}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    placeholder="98.6"
                    min="95"
                    max="110"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Weight and Height */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <Weight className="h-6 w-6 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Weight & Height</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weight (lbs)
                    </label>
                    <input
                      type="number"
                      name="weight"
                      value={vitalsData.weight}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      placeholder="150"
                      min="20"
                      max="1000"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Height (inches)
                    </label>
                    <input
                      type="number"
                      name="height"
                      value={vitalsData.height}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      placeholder="68"
                      min="24"
                      max="96"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Blood Sugar and Oxygen */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Blood Sugar</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Blood Sugar (mg/dL)
                    </label>
                    <input
                      type="number"
                      name="bloodSugar"
                      value={vitalsData.bloodSugar}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      placeholder="100"
                      min="50"
                      max="600"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Oxygen Saturation</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SpO2 (%)
                    </label>
                    <input
                      type="number"
                      name="oxygenSaturation"
                      value={vitalsData.oxygenSaturation}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      placeholder="98"
                      min="70"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={vitalsData.notes}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Any additional notes about your vitals..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Vitals
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
