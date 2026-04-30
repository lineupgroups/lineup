import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ArrowRight, Users, Heart, Activity } from 'lucide-react';
import { usePopularProjects } from '../../hooks/usePopularProjects';
import LoadingSpinner from '../common/LoadingSpinner';

export default function PopularSection() {
  const { projects: popularProjects, loading, error } = usePopularProjects();

  if (loading) {
    return (
      <section className="py-24 bg-brand-black">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/5 h-80 rounded-[2rem] animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || !popularProjects.length) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <section className="py-32 bg-brand-black border-b border-white/5 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-[-10%] w-[40%] h-[40%] bg-brand-orange/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-2xl px-6 py-2.5 rounded-full border border-white/10 mb-8">
              <Star className="w-4 h-4 text-brand-orange" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-400">
                Network <span className="text-brand-orange">Favorites</span>
              </span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-brand-white italic uppercase tracking-tighter leading-none mb-6">
              MOST <span className="text-brand-acid">POPULAR</span>
            </h2>
            <p className="text-lg text-neutral-500 font-medium tracking-tight">
              The high-interaction deployments captured across the community network.
            </p>
          </div>
          
          <Link
            to="/browse?sort=popular"
            className="group flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-brand-orange hover:text-brand-white transition-colors"
          >
            <span>Engage Full Registry</span>
            <div className="w-10 h-10 rounded-full bg-brand-orange/10 flex items-center justify-center group-hover:bg-brand-orange group-hover:text-brand-black transition-all">
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>

        {/* Popular Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {popularProjects.slice(0, 4).map((project, index) => (
            <div 
              key={project.id} 
              className="group relative bg-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 hover:border-brand-orange/30 transition-all duration-500 overflow-hidden flex flex-col h-full"
            >
              {/* Project Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-black/80 via-transparent to-transparent"></div>
                
                {/* Popular Badge */}
                {index === 0 && (
                  <div className="absolute top-4 left-4 z-10">
                    <div className="flex items-center gap-2 px-3 py-1 bg-brand-orange text-brand-black rounded-full text-[8px] font-black uppercase tracking-widest">
                      <Star className="w-3 h-3" />
                      <span>PRIME NODE</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Project Content */}
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-black text-brand-white mb-2 italic uppercase tracking-tight group-hover:text-brand-orange transition-colors line-clamp-2">
                  {project.title}
                </h3>
                <p className="text-[9px] font-bold text-neutral-500 mb-6 line-clamp-2 uppercase tracking-wider leading-relaxed">
                  {project.tagline}
                </p>

                {/* Stats Integration */}
                <div className="mt-auto space-y-4">
                  <div className="flex items-center justify-between py-4 border-y border-white/5">
                    <div className="flex items-center gap-2 group/stat">
                      <Users className="w-3.5 h-3.5 text-neutral-600 group-hover/stat:text-brand-acid transition-colors" />
                      <span className="text-[9px] font-black text-neutral-600 group-hover/stat:text-brand-white transition-colors uppercase tracking-widest">{project.supporters}</span>
                    </div>
                    <div className="flex items-center gap-2 group/stat">
                      <Heart className="w-3.5 h-3.5 text-neutral-600 group-hover/stat:text-brand-orange transition-colors" />
                      <span className="text-[9px] font-black text-neutral-600 group-hover/stat:text-brand-white transition-colors uppercase tracking-widest">{project.likeCount || 0}</span>
                    </div>
                  </div>

                  {/* Capital Metric */}
                  <div className="text-center py-2">
                    <div className="text-2xl font-black text-brand-white italic uppercase tracking-tighter">{formatCurrency(project.raised)}</div>
                    <div className="text-[8px] font-black text-neutral-600 uppercase tracking-[0.2em] mt-1">CAPITAL ACQUIRED</div>
                  </div>

                  {/* Engage Button */}
                  <Link
                    to={`/project/${project.id}`}
                    className="w-full flex items-center justify-center gap-3 py-3.5 bg-white/5 hover:bg-brand-orange text-brand-white hover:text-brand-black border border-white/10 hover:border-brand-orange rounded-2xl text-[9px] font-black italic uppercase tracking-[0.2em] transition-all duration-500"
                  >
                    <span>Analyze</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
