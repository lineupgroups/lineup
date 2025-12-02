import React from 'react';
import { Rocket } from 'lucide-react';
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
        className="bg-gradient-to-br from-yellow-50 to-orange-50"
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-xl h-96 animate-pulse" />
          ))}
        </div>
      </SectionContainer>
    );
  }

  if (projects.length === 0) {
    return null;
  }

  return (
    <SectionContainer
      title="Fresh Launches"
      subtitle="Be an early supporter of new projects"
      icon={Rocket}
      className="bg-gradient-to-br from-yellow-50 to-orange-50"
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => (
          <EnhancedProjectCard key={project.id} project={project} />
        ))}
      </div>
    </SectionContainer>
  );
}



