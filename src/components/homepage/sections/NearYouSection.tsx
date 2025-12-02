import React from 'react';
import { MapPin } from 'lucide-react';
import SectionContainer from '../SectionContainer';
import EnhancedProjectCard from '../EnhancedProjectCard';
import { FirestoreProject } from '../../../types/firestore';

interface NearYouSectionProps {
  projects: FirestoreProject[];
  loading?: boolean;
}

export default function NearYouSection({ projects, loading }: NearYouSectionProps) {
  if (loading) {
    return (
      <SectionContainer
        title="Near You"
        subtitle="Projects from your area"
        icon={MapPin}
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
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
      title="Near You"
      subtitle="Support local creators and projects"
      icon={MapPin}
      viewAllLink="/?filter=nearme"
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {projects.map(project => (
          <EnhancedProjectCard key={project.id} project={project} />
        ))}
      </div>
    </SectionContainer>
  );
}


