'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Heart, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { toast } from 'react-hot-toast';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  agreeToTerms: boolean;
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>();

  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const { confirmPassword, agreeToTerms, ...userData } = data;
      await registerUser(userData);
      toast.success('Account created successfully!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    'AI-powered medical report analysis',
    'Bilingual explanations (English + Roman Urdu)',
    'Secure cloud storage for your reports',
    'Health timeline and tracking',
    'Doctor questions and recommendations'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Features */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="hidden lg:block"
          >
            <Link href="/" className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 mb-8">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>

            <div className="flex items-center space-x-2 mb-8">
              <Heart className="h-10 w-10 text-primary-600" />
              <span className="text-3xl font-bold text-gray-900">HealthMate</span>
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Join HealthMate Today
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Start your journey to better health understanding with AI-powered insights.
            </p>
            <p className="text-lg text-gray-500 mb-8 text-urdu">
              AI-powered insights ke saath better health understanding ka journey start karein.
            </p>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                What you'll get:
              </h3>
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="flex items-center space-x-3"
                >
                  <CheckCircle className="h-5 w-5 text-success-600 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Side - Registration Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-lg shadow-soft p-8"
          >
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-8">
              <Link href="/" className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 mb-6">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Home</span>
              </Link>
              
              <div className="flex items-center justify-center space-x-2 mb-6">
                <Heart className="h-8 w-8 text-primary-600" />
                <span className="text-2xl font-bold text-gray-900">HealthMate</span>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Create Your Account
              </h2>
              <p className="text-gray-600">
                Join thousands of users managing their health better
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  {...register('name', {
                    required: 'Name is required',
                    minLength: {
                      value: 2,
                      message: 'Name must be at least 2 characters',
                    },
                  })}
                  type="text"
                  className={`input ${errors.name ? 'input-error' : ''}`}
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-error-600">{errors.name.message}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  type="email"
                  className={`input ${errors.email ? 'input-error' : ''}`}
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-error-600">{errors.email.message}</p>
                )}
              </div>

              {/* Phone Field */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number (Optional)
                </label>
                <input
                  {...register('phone', {
                    pattern: {
                      value: /^[\+]?[1-9][\d]{0,15}$/,
                      message: 'Invalid phone number',
                    },
                  })}
                  type="tel"
                  className={`input ${errors.phone ? 'input-error' : ''}`}
                  placeholder="Enter your phone number"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-error-600">{errors.phone.message}</p>
                )}
              </div>

              {/* Date of Birth and Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth (Optional)
                  </label>
                  <input
                    {...register('dateOfBirth')}
                    type="date"
                    className={`input ${errors.dateOfBirth ? 'input-error' : ''}`}
                  />
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-sm text-error-600">{errors.dateOfBirth.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                    Gender (Optional)
                  </label>
                  <select
                    {...register('gender')}
                    className={`input ${errors.gender ? 'input-error' : ''}`}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-sm text-error-600">{errors.gender.message}</p>
                  )}
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters',
                      },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                        message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
                      },
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-error-600">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) =>
                        value === password || 'Passwords do not match',
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`input pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-error-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start">
                <input
                  {...register('agreeToTerms', {
                    required: 'You must agree to the terms and conditions',
                  })}
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                />
                <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-700">
                  I agree to the{' '}
                  <Link href="/terms" className="text-primary-600 hover:text-primary-500">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-primary-600 hover:text-primary-500">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              {errors.agreeToTerms && (
                <p className="text-sm text-error-600">{errors.agreeToTerms.message}</p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-3 text-base"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            {/* Sign In Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-primary-600 hover:text-primary-500 font-medium">
                  Sign in here
                </Link>
              </p>
            </div>

            {/* Medical Disclaimer */}
            <div className="mt-6 text-center text-xs text-gray-500">
              <p>
                AI analysis is for informational purposes only and should not replace professional medical advice.
                Always consult healthcare professionals for medical decisions.
              </p>
              <p className="mt-1 text-urdu">
                AI analysis sirf information ke liye hai aur professional medical advice ka replacement nahi hai.
                Medical decisions ke liye hamesha healthcare professionals se consult karein.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
