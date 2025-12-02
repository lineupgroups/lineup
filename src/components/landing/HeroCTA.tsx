import React from 'react';
import { Rocket, ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function HeroCTA() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStartProject = () => {
    if (user) {
      navigate('/dashboard/projects/create');
    } else {
      // Navigate to home and trigger auth modal
      navigate('/?action=signup');
    }
  };

  const handleDiscover = () => {
    navigate('/discover');
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 py-24">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-white rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold mb-6 animate-bounce">
            <Sparkles className="w-4 h-4" />
            Launch Your Dream Project Today
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Turn Your Ideas Into
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-orange-200">
              Reality
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed">
            Join India's fastest-growing crowdfunding platform. Get funded by supporters who believe in your vision.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <button
              onClick={handleStartProject}
              className="group relative px-8 py-4 bg-white text-orange-600 font-bold text-lg rounded-xl hover:bg-gray-50 transition-all transform hover:scale-105 shadow-2xl hover:shadow-3xl flex items-center gap-3"
            >
              <Rocket className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              Start Your Campaign
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={handleDiscover}
              className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold text-lg rounded-xl hover:bg-white/20 transition-all border-2 border-white/30 flex items-center gap-2"
            >
              <TrendingUp className="w-5 h-5" />
              Discover Projects
            </button>
          </div>

          {/* Social Proof */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-white/80 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>1000+ Active Projects</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>₹10Cr+ Raised</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>95% Success Rate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          className="w-full h-16 text-white"
          preserveAspectRatio="none"
          viewBox="0 0 1440 54"
          fill="currentColor"
        >
          <path d="M0 22L60 16.7C120 11 240 1.00001 360 0.700012C480 1.00001 600 11 720 16.7C840 22 960 22 1080 20.3C1200 19 1320 16 1380 14.7L1440 13V54H1380C1320 54 1200 54 1080 54C960 54 840 54 720 54C600 54 480 54 360 54C240 54 120 54 60 54H0V22Z" />
        </svg>
      </div>
    </section>
  );
}

