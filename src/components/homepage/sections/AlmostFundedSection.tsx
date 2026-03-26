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
        className="bg-gradient-to-br from-green-50 to-emerald-50"
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
        title="Almost There!"
        subtitle="Help these projects reach their goal"
        icon={Target}
        className="bg-gradient-to-br from-green-50 to-emerald-50"
      >
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects at 80-99% yet</h3>
          <p className="text-gray-600 max-w-md mx-auto">
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
      className="bg-gradient-to-br from-green-50 to-emerald-50"
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {projects.map(project => (
          <EnhancedProjectCard key={project.id} project={project} />
        ))}
      </div>
    </SectionContainer>
  );
}



