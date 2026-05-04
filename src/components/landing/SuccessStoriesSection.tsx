import React, { useState } from 'react';
import { TrendingUp, Users, MapPin, ChevronLeft, ChevronRight, ExternalLink, Activity, Sparkles } from 'lucide-react';
import { useSuccessStories } from '../../hooks/useLandingPage';
import { useNavigate } from 'react-router-dom';

export default function SuccessStoriesSection() {
  const { stories, loading } = useSuccessStories(true); // Get featured stories
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  if (loading) {
    return (
      <section className="py-24 bg-brand-black">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/5 h-[600px] rounded-[3rem] animate-pulse"></div>
        </div>
      </section>
    );
  }

  if (!stories || stories.length === 0) {
    return null;
  }

  const currentStory = stories[currentIndex];
  const progress = ((currentStory.amountRaised / currentStory.goal) * 100).toFixed(0);

  const nextStory = () => {
    setCurrentIndex((prev) => (prev + 1) % stories.length);
  };

  const prevStory = () => {
    setCurrentIndex((prev) => (prev - 1 + stories.length) % stories.length);
  };

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

  const handleViewProject = () => {
    if (currentStory.projectId) {
      navigate(`/project/${currentStory.projectId}`);
    }
  };

  return (
    <section className="py-32 bg-brand-black relative overflow-hidden border-b border-white/5">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02)_0%,transparent_70%)] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-24">
          <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-2xl px-6 py-2.5 rounded-full border border-white/10 mb-8">
            <Sparkles className="w-4 h-4 text-brand-acid" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-400">
              ELITE <span className="text-brand-acid">ACHIEVEMENTS</span>
            </span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-brand-white italic uppercase tracking-tighter mb-6 leading-none">
            LEGENDS OF THE <span className="text-brand-orange">NATION</span>
          </h2>
          <p className="text-xl text-neutral-500 max-w-2xl mx-auto font-medium tracking-tight">
            Cinematic chronicles of creators who transcended expectations and redefined reality.
          </p>
        </div>

        {/* Cinematic Showcase Card */}
        <div className="relative group">
          <div className="bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
            <div className="grid lg:grid-cols-2 gap-0">
              {/* Image Side - Cinematic Framing */}
              <div className="relative h-[400px] lg:h-auto overflow-hidden">
                <img
                  src={currentStory.image}
                  alt={currentStory.projectTitle}
                  className="w-full h-full object-cover transition-opacity duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-brand-black/60 via-transparent to-transparent"></div>
                
                {/* Impact Badge */}
                <div className="absolute top-8 left-8 flex flex-col gap-2">
                  <div className="px-5 py-2 bg-brand-acid text-brand-black rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                    {progress}% FUNDED
                  </div>
                  <div className="px-5 py-2 bg-brand-black/80 backdrop-blur-md text-brand-white border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {formatCurrency(currentStory.amountRaised)} RAISED
                  </div>
                </div>
              </div>

              {/* Content Side - Editorial Layout */}
              <div className="p-10 md:p-16 flex flex-col justify-center bg-brand-black/40 backdrop-blur-sm">
                {/* Meta Info */}
                <div className="flex items-center gap-6 mb-8">
                  <span className="text-[10px] font-black text-brand-acid uppercase tracking-[0.3em] border-b border-brand-acid/30 pb-1">
                    {currentStory.category}
                  </span>
                  <div className="flex items-center text-neutral-500 text-[10px] font-black uppercase tracking-[0.2em]">
                    <MapPin className="w-3 h-3 mr-2 text-brand-orange" />
                    {currentStory.location.city}, {currentStory.location.state}
                  </div>
                </div>

                {/* Narrative Title */}
                <h3 className="text-4xl md:text-5xl font-black text-brand-white italic uppercase tracking-tighter mb-4 leading-none">
                  {currentStory.title}
                </h3>
                
                {currentStory.subtitle && (
                  <p className="text-lg text-brand-orange font-black italic uppercase tracking-tight mb-8">
                    {currentStory.subtitle}
                  </p>
                )}

                {/* Quote/Excerpt */}
                <div className="relative mb-12">
                  <div className="absolute -left-6 top-0 text-4xl font-black text-brand-acid/20 leading-none">"</div>
                  <p className="text-xl text-neutral-300 font-medium italic leading-relaxed tracking-tight">
                    {currentStory.excerpt}
                  </p>
                </div>

                {/* Creator Protocol */}
                <div className="flex items-center gap-6 mb-12 pb-12 border-b border-white/5">
                  {currentStory.creatorPhoto ? (
                    <img
                      src={currentStory.creatorPhoto}
                      alt={currentStory.creatorName}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/10"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-brand-black border border-white/10 flex items-center justify-center">
                      <span className="text-brand-acid font-black text-xl italic">
                        {currentStory.creatorName.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-black text-brand-white uppercase tracking-widest">{currentStory.creatorName}</p>
                    <p className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.3em]">ORIGINATOR PROTOCOL</p>
                  </div>
                </div>

                {/* Performance Analytics */}
                <div className="grid grid-cols-2 gap-8 mb-12">
                  <div className="group/stat">
                    <div className="text-3xl font-black text-brand-white italic uppercase tracking-tighter mb-1 group-hover/stat:text-brand-acid transition-colors">
                      {formatCurrency(currentStory.amountRaised)}
                    </div>
                    <div className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.2em]">CAPITAL ACQUISITION</div>
                  </div>
                  <div className="group/stat">
                    <div className="text-3xl font-black text-brand-white italic uppercase tracking-tighter mb-1 group-hover/stat:text-brand-orange transition-colors flex items-center gap-2">
                      <Users className="w-6 h-6 opacity-30" />
                      {currentStory.supportersCount}
                    </div>
                    <div className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.2em]">ACTIVE NODES</div>
                  </div>
                </div>

                {/* Engagement Action */}
                {currentStory.projectId && (
                  <button
                    onClick={handleViewProject}
                    className="group w-full flex items-center justify-between gap-4 bg-white/5 hover:bg-brand-acid text-brand-white hover:text-brand-black font-black italic uppercase tracking-[0.2em] text-xs py-5 px-8 rounded-2xl border border-white/10 hover:border-brand-acid transition-all duration-500 shadow-2xl"
                  >
                    <span>Analyze Full Deployment</span>
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-brand-black/20 transition-all">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Precision Navigation Arrows */}
          {stories.length > 1 && (
            <>
              <button
                onClick={prevStory}
                className="absolute left-[-30px] lg:left-[-60px] top-1/2 -translate-y-1/2 bg-brand-black border border-white/10 hover:border-brand-acid/50 text-neutral-500 hover:text-brand-acid w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all z-20 group"
                aria-label="Previous story"
              >
                <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
              </button>
              <button
                onClick={nextStory}
                className="absolute right-[-30px] lg:right-[-60px] top-1/2 -translate-y-1/2 bg-brand-black border border-white/10 hover:border-brand-orange/50 text-neutral-500 hover:text-brand-orange w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all z-20 group"
                aria-label="Next story"
              >
                <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
            </>
          )}
        </div>

        {/* Index Tracking */}
        {stories.length > 1 && (
          <div className="flex justify-center gap-4 mt-16">
            {stories.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-1 rounded-full transition-all duration-500 ${
                  index === currentIndex
                    ? 'w-16 bg-brand-acid shadow-[0_0_15px_rgba(204,255,0,0.5)]'
                    : 'w-4 bg-white/10 hover:bg-white/20'
                }`}
                aria-label={`Go to story ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Surveillance Tags */}
        {currentStory.tags && currentStory.tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-6 mt-16">
            {currentStory.tags.map((tag, index) => (
              <span
                key={index}
                className="text-[9px] font-black text-neutral-600 hover:text-brand-acid uppercase tracking-[0.3em] cursor-default transition-colors"
              >
                #{tag.toUpperCase()}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
