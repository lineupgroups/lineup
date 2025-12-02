import React from 'react';
import { Target } from 'lucide-react';
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
        className="bg-gradient-to-br from-green-50 to-emerald-50"
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
      title="Almost There!"
      subtitle="Help these projects reach their goal"
      icon={Target}
      className="bg-gradient-to-br from-green-50 to-emerald-50"
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => (
          <EnhancedProjectCard key={project.id} project={project} />
        ))}
      </div>
    </SectionContainer>
  );
}



