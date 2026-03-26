import React, { useState } from 'react';
import { Lightbulb, FileText, Rocket, Heart, TrendingUp, Users, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type UserType = 'creator' | 'supporter';

export default function HowItWorksSection() {
  const [activeType, setActiveType] = useState<UserType>('supporter');
  const navigate = useNavigate();

  const creatorSteps = [
    {
      number: 1,
      icon: Lightbulb,
      title: 'Share Your Idea',
      description: 'Create your project with compelling story, images, and funding goal. No fees to start!',
      color: 'from-yellow-400 to-orange-500',
      features: ['Free to start', 'Easy project wizard', 'Add images & videos']
    },
    {
      number: 2,
      icon: FileText,
      title: 'Get Approved',
      description: 'Our team reviews your project within 24-48 hours to ensure quality and authenticity.',
      color: 'from-blue-400 to-indigo-500',
      features: ['Quick review', 'Expert feedback', 'KYC verification']
    },
    {
      number: 3,
      icon: Rocket,
      title: 'Launch & Promote',
      description: 'Go live and share with your network. Use our tools to reach supporters across India.',
      color: 'from-green-400 to-emerald-500',
      features: ['Social sharing', 'Email updates', 'Analytics dashboard']
    },
    {
      number: 4,
      icon: TrendingUp,
      title: 'Receive Funds',
      description: 'Get funded by supporters and bring your project to life. Withdraw funds via UPI or bank transfer.',
      color: 'from-purple-400 to-pink-500',
      features: ['Instant notifications', 'Easy withdrawals', 'Track progress']
    }
  ];

  const supporterSteps = [
    {
      number: 1,
      icon: Users,
      title: 'Discover Projects',
      description: 'Browse innovative projects from creators across India. Filter by location, category, or trending.',
      color: 'from-blue-400 to-cyan-500',
      features: ['Verified creators', 'Local projects', 'Categories']
    },
    {
      number: 2,
      icon: Heart,
      title: 'Choose & Support',
      description: 'Select projects you love and make a donation. Every rupee counts and makes a difference!',
      color: 'from-pink-400 to-rose-500',
      features: ['Secure payments', 'Any amount', 'Tax receipts']
    },
    {
      number: 3,
      icon: CheckCircle,
      title: 'Track Progress',
      description: 'Stay updated with exclusive updates, milestones, and behind-the-scenes content from creators.',
      color: 'from-green-400 to-teal-500',
      features: ['Exclusive updates', 'Direct messaging', 'Milestone alerts']
    },
    {
      number: 4,
      icon: TrendingUp,
      title: 'See Impact',
      description: 'Watch your supported projects come to life and be part of their success story!',
      color: 'from-orange-400 to-amber-500',
      features: ['Success stories', 'Creator thanks', 'Community badge']
    }
  ];

  const steps = activeType === 'creator' ? creatorSteps : supporterSteps;

  return (
    <section className="py-20 bg-white">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Rocket className="w-4 h-4" />
            HOW IT WORKS
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent, Effective
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Whether you're creating or supporting, we've made it incredibly easy
          </p>

          {/* Toggle Buttons */}
          <div className="inline-flex bg-gray-100 rounded-full p-1.5 gap-1">
            <button
              onClick={() => setActiveType('supporter')}
              className={`px-8 py-3 rounded-full font-semibold transition-all ${
                activeType === 'supporter'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              For Supporters
            </button>
            <button
              onClick={() => setActiveType('creator')}
              className={`px-8 py-3 rounded-full font-semibold transition-all ${
                activeType === 'creator'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              For Creators
            </button>
          </div>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line (Desktop) */}
          <div className="hidden lg:block absolute top-20 left-0 right-0 h-1 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 z-0"></div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 relative z-10">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-transparent hover:-translate-y-2"
                >
                  {/* Step Number Badge */}
                  <div className={`absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white font-bold text-xl shadow-lg ring-4 ring-white`}>
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${step.color} mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-2">
                    {step.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Arrow for flow (Desktop) */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute -right-6 top-1/2 -translate-y-1/2 text-gray-300 z-20">
                      <ArrowRight className="w-8 h-8" />
                    </div>
                  )}

                  {/* Hover gradient overlay */}
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none`}></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col sm:flex-row gap-4">
            {activeType === 'supporter' ? (
              <>
                <button
                  onClick={() => navigate('/discover')}
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  Discover Projects
                </button>
                <button
                  onClick={() => navigate('/trending')}
                  className="px-8 py-4 bg-white hover:bg-gray-50 text-gray-800 font-semibold rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-all"
                >
                  View Trending
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/dashboard/projects/create')}
                  className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  Start Your Project Now
                </button>
                <button
                  onClick={() => navigate('/discover')}
                  className="px-8 py-4 bg-white hover:bg-gray-50 text-gray-800 font-semibold rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-all"
                >
                  See Example Projects
                </button>
              </>
            )}
          </div>
          
          <p className="mt-6 text-gray-500 text-sm">
            {activeType === 'supporter' 
              ? 'Join the community of supporters making dreams come true'
              : 'Join 1000+ creators who have successfully funded their projects'
            }
          </p>
        </div>
      </div>
    </section>
  );
}

