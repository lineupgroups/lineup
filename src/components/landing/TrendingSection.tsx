import { Link } from 'react-router-dom';
import { TrendingUp, ArrowRight, Heart, Users, Activity, Play } from 'lucide-react';
import { useTrendingProjects } from '../../hooks/useTrendingProjects';
import LoadingSpinner from '../common/LoadingSpinner';

export default function TrendingSection() {
  const { projects: trendingProjects, loading, error } = useTrendingProjects();

  if (loading) {
    return (
      <section className="py-24 bg-brand-black border-b border-white/5">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white/5 h-96 rounded-[2.5rem] animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || !trendingProjects.length) {
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

  const getProgressPercentage = (raised: number, goal: number) => {
    return Math.min((raised / goal) * 100, 100);
  };

  return (
    <section className="py-32 bg-brand-black border-b border-white/5 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-brand-acid/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-2xl px-6 py-2.5 rounded-full border border-white/10 mb-8">
              <Activity className="w-4 h-4 text-brand-acid animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-400">
                Velocity <span className="text-brand-acid">High</span>
              </span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-brand-white italic uppercase tracking-tighter leading-none mb-6">
              TRENDING <span className="text-brand-orange">DEPLOYMENTS</span>
            </h2>
            <p className="text-lg text-neutral-500 font-medium tracking-tight">
              Analyzing the highest interaction nodes across the Idea Nation this week.
            </p>
          </div>
          
          <Link
            to="/browse?sort=trending"
            className="group flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-brand-acid hover:text-brand-white transition-colors"
          >
            <span>Analyze Full Registry</span>
            <div className="w-10 h-10 rounded-full bg-brand-acid/10 flex items-center justify-center group-hover:bg-brand-acid group-hover:text-brand-black transition-all">
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>

        {/* Trending Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {trendingProjects.slice(0, 6).map((project, index) => {
            const progress = getProgressPercentage(project.raised, project.goal);
            return (
              <div 
                key={project.id} 
                className="group relative bg-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 hover:border-brand-acid/30 transition-all duration-500 overflow-hidden flex flex-col h-full"
              >
                {/* Visual Header */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-black/80 via-transparent to-transparent"></div>
                  
                  {/* Status Badges */}
                  <div className="absolute top-6 left-6 flex flex-col gap-2">
                    {index < 3 && (
                      <div className="px-4 py-1.5 bg-brand-acid text-brand-black rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
                        <TrendingUp className="w-3 h-3" />
                        NODE #{index + 1}
                      </div>
                    )}
                    <div className="px-4 py-1.5 bg-brand-black/60 backdrop-blur-md text-brand-white border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest">
                      {project.category.toUpperCase()}
                    </div>
                  </div>
                  
                  {/* Interaction Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-brand-black/20 backdrop-blur-[2px]">
                    <div className="w-16 h-16 rounded-full bg-brand-acid text-brand-black flex items-center justify-center transform scale-50 group-hover:scale-100 transition-transform duration-500">
                      <Play className="w-6 h-6 fill-current" />
                    </div>
                  </div>
                </div>

                {/* Content Logic */}
                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="text-2xl font-black text-brand-white mb-3 italic uppercase tracking-tight group-hover:text-brand-acid transition-colors line-clamp-2">
                    {project.title}
                  </h3>
                  <p className="text-[10px] font-bold text-neutral-500 mb-8 line-clamp-2 uppercase tracking-wider leading-relaxed">
                    {project.tagline}
                  </p>

                  {/* Progress Integration */}
                  <div className="mt-auto space-y-4">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <div className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">CAPITAL ACQUIRED</div>
                        <div className="text-xl font-black text-brand-white italic uppercase tracking-tighter">
                          {formatCurrency(project.raised)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">MAGNITUDE</div>
                        <div className={`text-xl font-black italic uppercase tracking-tighter ${progress >= 100 ? 'text-brand-acid' : 'text-brand-orange'}`}>
                          {progress.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                    
                    {/* Precision Progress Bar */}
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div
                        className={`h-full transition-all duration-1000 ${progress >= 100 ? 'bg-brand-acid shadow-[0_0_15px_rgba(204,255,0,0.5)]' : 'bg-brand-orange shadow-[0_0_15px_rgba(255,91,0,0.5)]'}`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>

                    {/* Network Stats */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2 group/stat">
                        <Users className="w-4 h-4 text-neutral-600 group-hover/stat:text-brand-acid transition-colors" />
                        <span className="text-[9px] font-black text-neutral-600 group-hover/stat:text-brand-white transition-colors">{project.supporters} NODES</span>
                      </div>
                      <div className="flex items-center gap-2 group/stat">
                        <Heart className="w-4 h-4 text-neutral-600 group-hover/stat:text-brand-orange transition-colors" />
                        <span className="text-[9px] font-black text-neutral-600 group-hover/stat:text-brand-white transition-colors">{project.likeCount || 0} PULSE</span>
                      </div>
                    </div>

                    {/* Engagement Protocol */}
                    <Link
                      to={`/project/${project.id}`}
                      className="w-full flex items-center justify-center gap-4 py-4 bg-white/5 hover:bg-brand-acid text-brand-white hover:text-brand-black border border-white/10 hover:border-brand-acid rounded-2xl text-[10px] font-black italic uppercase tracking-[0.2em] transition-all duration-500"
                    >
                      Initialize Intel
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
