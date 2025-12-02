import React from 'react';
import { Star, Quote, MapPin, Award } from 'lucide-react';
import { useTestimonials } from '../../hooks/useLandingPage';

export default function TestimonialsSection() {
  const { testimonials, loading } = useTestimonials(true); // Get featured testimonials

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl">
                <div className="h-20 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Star className="w-4 h-4 fill-current" />
            TESTIMONIALS
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Loved by Creators & Supporters
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Hear from the amazing people who are part of our community
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-purple-200"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 text-purple-200 group-hover:text-purple-300 transition-colors">
                <Quote className="w-12 h-12" />
              </div>

              {/* Rating */}
              {testimonial.rating && (
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < testimonial.rating!
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Quote Text */}
              <blockquote className="text-gray-700 mb-6 leading-relaxed relative z-10">
                "{testimonial.quote}"
              </blockquote>

              {/* Author Info */}
              <div className="flex items-start gap-4 pt-6 border-t border-gray-100">
                {/* Avatar */}
                {testimonial.photo ? (
                  <img
                    src={testimonial.photo}
                    alt={testimonial.name}
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-purple-100"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center ring-2 ring-purple-100">
                    <span className="text-white font-bold text-xl">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                )}

                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-1">
                    {testimonial.name}
                  </div>
                  
                  {/* Role/Project */}
                  {testimonial.role && (
                    <div className="text-sm text-gray-600 mb-2">
                      {testimonial.role}
                    </div>
                  )}
                  
                  {testimonial.projectTitle && (
                    <div className="text-sm text-purple-600 font-medium mb-2">
                      {testimonial.projectTitle}
                    </div>
                  )}

                  {/* Location */}
                  {testimonial.location && (
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="w-3 h-3 mr-1" />
                      {testimonial.location.city}, {testimonial.location.state}
                    </div>
                  )}

                  {/* Amount Info */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {testimonial.type === 'creator' && testimonial.amountRaised && (
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                        <Award className="w-3 h-3" />
                        Raised {formatCurrency(testimonial.amountRaised)}
                      </span>
                    )}
                    {testimonial.type === 'supporter' && testimonial.amountSupported && (
                      <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                        Supported {formatCurrency(testimonial.amountSupported)}
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      testimonial.type === 'creator'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {testimonial.type === 'creator' ? 'Creator' : 'Supporter'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Hover effect gradient */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/5 group-hover:to-pink-500/5 transition-all pointer-events-none"></div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Want to share your success story?
          </p>
          <button className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 py-3 rounded-lg transition-all transform hover:scale-105">
            <Star className="w-5 h-5" />
            Share Your Story
          </button>
        </div>
      </div>
    </section>
  );
}

