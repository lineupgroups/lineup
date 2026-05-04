import React from 'react';
import { Sparkles } from 'lucide-react';
import SectionContainer from '../SectionContainer';
import EnhancedProjectCard from '../EnhancedProjectCard';
import { FirestoreProject } from '../../../types/firestore';

interface ForYouSectionProps {
  projects: Array<FirestoreProject & { score: number; reasons: string[] }>;
  loading?: boolean;
}

export default function ForYouSection({ projects, loading }: ForYouSectionProps) {
  if (loading) {
    return (
      <SectionContainer
        title="For You"
        subtitle="Handpicked just for you"
        icon={Sparkles}
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-neutral-900 rounded-2xl h-[400px] animate-pulse border border-neutral-800" />
          ))}
        </div>
      </SectionContainer>
    );
  }

  if (projects.length === 0) {
    return (
      <SectionContainer
        title="For You"
        subtitle="Discovering projects just for you"
        icon={Sparkles}
      >
        <div className="text-center py-16 bg-neutral-900/50 rounded-3xl border border-neutral-800">
          <div className="w-20 h-20 bg-brand-orange/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-brand-orange" />
          </div>
          <h3 className="text-xl font-bold text-brand-white mb-3 tracking-tight">
            We're learning your preferences
          </h3>
          <p className="text-neutral-400 font-medium">
            Explore some projects and we'll personalize your feed!
          </p>
        </div>
      </SectionContainer>
    );
  }

  return (
    <SectionContainer
      title="For You"
      subtitle="Projects we think you'll love"
      icon={Sparkles}
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {projects.map(project => (
          <EnhancedProjectCard key={project.id} project={project} showReasons={true} />
        ))}
      </div>
    </SectionContainer>
  );
}
