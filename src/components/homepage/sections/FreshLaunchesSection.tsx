import React from 'react';
import { Rocket, Clock } from 'lucide-react';
import SectionContainer from '../SectionContainer';
import EnhancedProjectCard from '../EnhancedProjectCard';
import { FirestoreProject } from '../../../types/firestore';

interface FreshLaunchesSectionProps {
  projects: FirestoreProject[];
  loading?: boolean;
}

export default function FreshLaunchesSection({ projects, loading }: FreshLaunchesSectionProps) {
  if (loading) {
    return (
      <SectionContainer
        title="Fresh Launches"
        subtitle="Be an early supporter of new projects"
        icon={Rocket}
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
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
        title="Fresh Launches"
        subtitle="Be an early supporter of new projects"
        icon={Rocket}
      >
        <div className="text-center py-16 bg-neutral-900/50 rounded-3xl border border-neutral-800">
          <div className="w-20 h-20 bg-brand-orange/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-brand-orange" />
          </div>
          <h3 className="text-xl font-bold text-brand-white mb-3 tracking-tight">No new launches this week</h3>
          <p className="text-neutral-400 max-w-md mx-auto font-medium leading-relaxed">
            Projects launched in the last 7 days will appear here.
            New ideas are coming soon!
          </p>
        </div>
      </SectionContainer>
    );
  }

  return (
    <SectionContainer
      title="Fresh Launches"
      subtitle="Be an early supporter of new projects"
      icon={Rocket}
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
        {projects.map(project => (
          <EnhancedProjectCard key={project.id} project={project} />
        ))}
      </div>
    </SectionContainer>
  );
}
