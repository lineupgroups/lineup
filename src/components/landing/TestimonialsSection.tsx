import React from 'react';
import { Star, Quote, MapPin, Award, Activity, Heart } from 'lucide-react';
import { useTestimonials } from '../../hooks/useLandingPage';

export default function TestimonialsSection() {
  const { testimonials, loading } = useTestimonials(true); // Get featured testimonials

  if (loading) {
    return (
      <section className="py-24 bg-brand-black">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white/5 h-80 rounded-[2rem] animate-pulse"></div>
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
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <section className="py-32 bg-brand-black border-b border-white/5 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,rgba(204,255,0,0.02)_0%,transparent_50%)] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-24">
          <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-2xl px-6 py-2.5 rounded-full border border-white/10 mb-8">
            <Heart className="w-4 h-4 text-brand-orange fill-current" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-400">
              SOCIAL <span className="text-brand-orange">CONSENSUS</span>
            </span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-brand-white italic uppercase tracking-tighter mb-8 leading-none">
            VOICES OF THE <span className="text-brand-acid">NATION</span>
          </h2>
          <p className="text-xl text-neutral-500 max-w-2xl mx-auto font-medium tracking-tight">
            Validating the impact of the ecosystem through the lived experiences of its prime nodes.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="group relative bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-10 border border-white/10 hover:border-brand-acid/30 transition-all duration-500 overflow-hidden flex flex-col"
            >
              {/* Quote Icon Background */}
              <div className="absolute top-10 right-10 text-white/[0.03] group-hover:text-brand-acid/[0.05] transition-all">
                <Quote className="w-24 h-24" />
              </div>

              {/* Rating Telemetry */}
              {testimonial.rating && (
                <div className="flex gap-1.5 mb-8 relative z-10">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < testimonial.rating!
                          ? 'text-brand-acid fill-current'
                          : 'text-neutral-800'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Narrative Quote */}
              <blockquote className="text-lg text-neutral-300 font-medium italic leading-relaxed tracking-tight mb-10 relative z-10 flex-1">
                "{testimonial.quote}"
              </blockquote>

              {/* Identity Protocol */}
              <div className="flex items-start gap-5 pt-8 border-t border-white/5 relative z-10">
                {testimonial.photo ? (
                  <img
                    src={testimonial.photo}
                    alt={testimonial.name}
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/5 group-hover:ring-brand-acid/30 transition-all"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-brand-black border border-white/10 flex items-center justify-center">
                    <span className="text-brand-acid font-black text-xl italic">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="font-black text-brand-white uppercase tracking-widest mb-1 truncate">
                    {testimonial.name}
                  </div>
                  
                  {testimonial.role && (
                    <div className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-2 truncate">
                      {testimonial.role.toUpperCase()}
                    </div>
                  )}
                  
                  {testimonial.projectTitle && (
                    <div className="text-[9px] font-black text-brand-orange uppercase tracking-[0.2em] mb-2 truncate">
                      {testimonial.projectTitle.toUpperCase()}
                    </div>
                  )}

                  {/* Impact Badges */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {testimonial.type === 'creator' && testimonial.amountRaised && (
                      <div className="inline-flex items-center gap-1.5 bg-brand-acid/10 text-brand-acid border border-brand-acid/20 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
                        <Award className="w-2.5 h-2.5" />
                        ACQUIRED {formatCurrency(testimonial.amountRaised)}
                      </div>
                    )}
                    {testimonial.type === 'supporter' && testimonial.amountSupported && (
                      <div className="inline-flex items-center gap-1.5 bg-brand-orange/10 text-brand-orange border border-brand-orange/20 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
                        <Activity className="w-2.5 h-2.5" />
                        DEPLOYED {formatCurrency(testimonial.amountSupported)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Global Action */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-2xl px-8 py-3 rounded-full border border-white/10 mb-8">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">
              SHARE YOUR OWN <span className="text-brand-acid">NARRATIVE</span>
            </span>
          </div>
          <br />
          <button className="group relative inline-flex items-center gap-4 bg-brand-acid text-brand-black font-black italic uppercase tracking-[0.2em] text-xs px-12 py-5 rounded-2xl shadow-2xl shadow-brand-acid/20 hover:scale-105 active:scale-95 transition-all">
            <Star className="w-5 h-5 fill-current" />
            Initialize Story Protocol
          </button>
        </div>
      </div>
    </section>
  );
}
