'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Shield, 
  Brain, 
  Globe, 
  ArrowRight, 
  CheckCircle,
  Star,
  Users,
  FileText,
  Activity,
  UserPlus
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function LandingPage() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [isCreatingTestAccount, setIsCreatingTestAccount] = useState(false);

  // Function to test login with a known account
  const testLogin = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test1760808909907@healthmate.com',
          password: 'Test123456'
        }),
      });

      const result = await response.json();
      console.log('Test login result:', result);
      
      if (result.success) {
        toast.success('Test login successful!');
        // Store token and redirect
        if (result.data.token) {
          document.cookie = `healthmate_token=${result.data.token}; path=/; max-age=${7 * 24 * 60 * 60}`;
          window.location.href = '/dashboard';
        }
      } else {
        toast.error(result.message || 'Test login failed');
      }
    } catch (error) {
      console.error('Test login error:', error);
      toast.error('Test login failed. Make sure the backend is running.');
    }
  };

  // Function to create a test account
  const createTestAccount = async () => {
    setIsCreatingTestAccount(true);
    try {
      const testUserData = {
        name: 'Test User',
        email: `test${Date.now()}@healthmate.com`,
        password: 'Test123456'
        // Removed optional fields to avoid validation issues
      };

      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testUserData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Test account created! Email: ${testUserData.email}`);
        // Redirect to login page
        window.location.href = '/auth/login';
      } else {
        // Show detailed error message
        let errorMessage = result.message || 'Failed to create test account';
        if (result.errors && result.errors.length > 0) {
          errorMessage = result.errors.map(err => err.msg).join(', ');
        }
        toast.error(errorMessage);
        console.error('Registration error:', result);
      }
    } catch (error) {
      console.error('Error creating test account:', error);
      toast.error('Failed to create test account. Make sure the backend is running.');
    } finally {
      setIsCreatingTestAccount(false);
    }
  };

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      description: 'Get instant, bilingual explanations of your medical reports using advanced AI technology.',
      urdu: 'AI ke zariye apne medical reports ki instant, bilingual explanation paayein.'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your health data is encrypted and stored securely with enterprise-grade security.',
      urdu: 'Aapka health data encrypted aur secure hai enterprise-grade security ke saath.'
    },
    {
      icon: Globe,
      title: 'Bilingual Support',
      description: 'Get explanations in both English and Roman Urdu for better understanding.',
      urdu: 'English aur Roman Urdu dono languages mein explanations paayein better understanding ke liye.'
    },
    {
      icon: FileText,
      title: 'Complete Health Timeline',
      description: 'Track your health journey with organized reports and vital readings over time.',
      urdu: 'Organized reports aur vital readings ke saath apna health journey track karein.'
    }
  ];

  const stats = [
    { icon: Users, value: '10K+', label: 'Happy Users' },
    { icon: FileText, value: '50K+', label: 'Reports Analyzed' },
    { icon: Activity, value: '99.9%', label: 'Uptime' },
    { icon: Star, value: '4.8/5', label: 'User Rating' }
  ];

  const testimonials = [
    {
      name: 'Ahmad Khan',
      location: 'Karachi, Pakistan',
      text: 'HealthMate has made understanding my medical reports so much easier. The Urdu explanations are incredibly helpful!',
      urdu: 'HealthMate ne mere medical reports samajhna bohot aasan kar diya. Urdu explanations bilkul helpful hain!'
    },
    {
      name: 'Fatima Ali',
      location: 'Lahore, Pakistan',
      text: 'The AI analysis is spot-on and the bilingual feature is exactly what I needed for my family.',
      urdu: 'AI analysis bilkul accurate hai aur bilingual feature exactly wahi hai jo mere family ke liye chahiye tha.'
    },
    {
      name: 'Muhammad Hassan',
      location: 'Islamabad, Pakistan',
      text: 'Finally, a health app that speaks my language! The interface is clean and easy to use.',
      urdu: 'Aakhir mein ek health app jo meri language mein baat karta hai! Interface clean aur easy to use hai.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container-custom">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">HealthMate</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login" className="btn-ghost">
                Sign In
              </Link>
              <Link href="/auth/register" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="container-custom">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                Your Smart Health
                <span className="text-primary-600"> Companion</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Store, understand, and track your medical reports with AI-powered insights in English and Roman Urdu.
              </p>
              <p className="text-lg text-gray-500 mb-12 text-urdu">
                AI ke zariye apne medical reports ko store, understand aur track karein English aur Roman Urdu mein.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link href="/auth/register" className="btn-primary text-lg px-8 py-3">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <button 
                onClick={createTestAccount}
                disabled={isCreatingTestAccount}
                className="btn bg-success-600 hover:bg-success-700 text-white text-lg px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingTestAccount ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="ml-2 h-5 w-5" />
                    Create Account
                  </>
                )}
              </button>
              <Link href="#features" className="btn-outline text-lg px-8 py-3">
                Learn More
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mb-4">
                  <stat.icon className="h-6 w-6 text-primary-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Why Choose HealthMate?
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features designed to make healthcare accessible and understandable
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`p-6 rounded-lg cursor-pointer transition-all ${
                    activeFeature === index
                      ? 'bg-primary-50 border-2 border-primary-200'
                      : 'bg-white border border-gray-200 hover:border-primary-200'
                  }`}
                  onClick={() => setActiveFeature(index)}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${
                      activeFeature === index ? 'bg-primary-600' : 'bg-gray-100'
                    }`}>
                      <feature.icon className={`h-6 w-6 ${
                        activeFeature === index ? 'text-white' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 mb-2">{feature.description}</p>
                      <p className="text-gray-500 text-sm text-urdu">{feature.urdu}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="lg:pl-8">
              <motion.div
                key={activeFeature}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-8 text-white"
              >
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6">
                    {React.createElement(features[activeFeature].icon, {
                      className: "h-8 w-8 text-white"
                    })}
                  </div>
                  <h3 className="text-2xl font-bold mb-4">
                    {features[activeFeature].title}
                  </h3>
                  <p className="text-primary-100 mb-4">
                    {features[activeFeature].description}
                  </p>
                  <p className="text-primary-200 text-sm text-urdu">
                    {features[activeFeature].urdu}
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600">
              Real feedback from real users across Pakistan
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-lg p-6 shadow-soft"
              >
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">"{testimonial.text}"</p>
                <p className="text-gray-500 text-sm text-urdu mb-4">"{testimonial.urdu}"</p>
                <div className="border-t pt-4">
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.location}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Ready to Take Control of Your Health?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join thousands of users who trust HealthMate with their health data
            </p>
            <p className="text-lg text-primary-200 mb-12 text-urdu">
              HealthMate ke saath apne health data ka control lein - thousands of users ka trust
            </p>
            <Link href="/auth/register" className="btn bg-white text-primary-600 hover:bg-gray-50 text-lg px-8 py-3">
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container-custom">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Heart className="h-6 w-6 text-primary-400" />
                <span className="text-lg font-bold">HealthMate</span>
              </div>
              <p className="text-gray-400">
                Your smart health companion for storing and understanding medical reports.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/security" className="hover:text-white">Security</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/disclaimer" className="hover:text-white">Medical Disclaimer</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 HealthMate. All rights reserved.</p>
            <p className="mt-2 text-sm">
              AI is for informational purposes only. Always consult healthcare professionals for medical advice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
