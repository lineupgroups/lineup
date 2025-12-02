import React from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb, Users, Rocket, ArrowRight } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      icon: Lightbulb,
      title: "Share Your Idea",
      description: "Create a compelling project page with your vision, goals, and timeline. Show the world what you're building.",
      color: "from-yellow-400 to-orange-400"
    },
    {
      icon: Users,
      title: "Build Community",
      description: "Connect with supporters who believe in your vision. Build a community around your project and engage with backers.",
      color: "from-blue-400 to-purple-400"
    },
    {
      icon: Rocket,
      title: "Launch & Deliver",
      description: "Reach your funding goal and bring your idea to life. Keep supporters updated and deliver on your promises.",
      color: "from-green-400 to-emerald-400"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">How It Works</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From idea to reality in three simple steps. Join thousands of creators who have successfully funded their projects.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-16 relative">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="text-center group">
                {/* Step Number */}
                <div className="relative mb-6">
                  <div className={`w-20 h-20 mx-auto bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                </div>

                {/* Step Content */}
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>

                {/* Arrow for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-full transform -translate-x-3">
                    <ArrowRight className="w-6 h-6 text-gray-300" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-12 text-center">
          <h3 className="text-3xl font-bold text-white mb-6">Ready to Turn Your Idea Into Reality?</h3>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Join our community of innovators and creators. Whether you're looking to fund your next big idea 
            or support groundbreaking projects, Lineup is where ideas become reality.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/dashboard"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-200 transform hover:scale-105"
            >
              <Rocket className="w-5 h-5" />
              <span>Start Your Project</span>
            </Link>
            <Link
              to="/browse"
              className="inline-flex items-center space-x-2 px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition-colors"
            >
              <Users className="w-5 h-5" />
              <span>Explore Projects</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
