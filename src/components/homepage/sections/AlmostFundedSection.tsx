import React from 'react';
import { Target, TrendingUp } from 'lucide-react';
import SectionContainer from '../SectionContainer';
import EnhancedProjectCard from '../EnhancedProjectCard';
import { FirestoreProject } from '../../../types/firestore';

interface AlmostFundedSectionProps {
  projects: FirestoreProject[];
  loading?: boolean;
}

export default function AlmostFundedSection({ projects, loading }: AlmostFundedSectionProps) {
  if (loading) {
    return (
      <SectionContainer
        title="Almost There!"
        subtitle="Help these projects reach their goal"
        icon={Target}
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-neutral-900 rounded-2xl h-[400px] animate-pulse border border-neutral-800" />
          ))}
        </div>
      </SectionContainer>
    );
  }

  // Show empty state with helpful message instead of hiding the section
  if (projects.length === 0) {
    return (
      <SectionContainer
        title="Almost There!"
        subtitle="Help these projects reach their goal"
        icon={Target}
      >
        <div className="text-center py-16 bg-neutral-900/50 rounded-3xl border border-neutral-800">
          <div className="w-20 h-20 bg-brand-orange/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <TrendingUp className="w-10 h-10 text-brand-orange" />
          </div>
          <h3 className="text-xl font-bold text-brand-white mb-3 tracking-tight">No projects at 80-99% yet</h3>
          <p className="text-neutral-400 max-w-md mx-auto font-medium leading-relaxed">
            Projects that are close to reaching their funding goal will appear here.
            Check back soon or explore other sections!
          </p>
        </div>
      </SectionContainer>
    );
  }

  return (
    <SectionContainer
      title="Almost There!"
      subtitle="Help these projects reach their goal"
      icon={Target}
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {projects.map(project => (
          <EnhancedProjectCard key={project.id} project={project} />
        ))}
      </div>
    </SectionContainer>
  );
}
