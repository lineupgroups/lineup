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
        className="bg-gradient-to-br from-yellow-50 to-orange-50"
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-xl h-96 animate-pulse" />
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
        className="bg-gradient-to-br from-yellow-50 to-orange-50"
      >
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No new launches this week</h3>
          <p className="text-gray-600 max-w-md mx-auto">
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
      className="bg-gradient-to-br from-yellow-50 to-orange-50"
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {projects.map(project => (
          <EnhancedProjectCard key={project.id} project={project} />
        ))}
      </div>
    </SectionContainer>
  );
}



