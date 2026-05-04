import React from 'react';
import { Compass } from 'lucide-react';
import SectionContainer from '../SectionContainer';
import EnhancedProjectCard from '../EnhancedProjectCard';
import { FirestoreProject } from '../../../types/firestore';

interface DiscoverySectionProps {
  projects: FirestoreProject[];
  loading?: boolean;
}

export default function DiscoverySection({ projects, loading }: DiscoverySectionProps) {
  if (loading || projects.length === 0) {
    return null;
  }

  return (
    <SectionContainer
      title="Discover Something New"
      subtitle="Explore projects outside your usual interests"
      icon={Compass}
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
        {projects.map(project => (
          <EnhancedProjectCard key={project.id} project={project} />
        ))}
      </div>
    </SectionContainer>
  );
}
