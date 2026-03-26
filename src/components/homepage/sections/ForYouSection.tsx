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
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-xl h-96 animate-pulse" />
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
        className="bg-gradient-to-br from-orange-50 to-pink-50"
      >
        <div className="text-center py-12">
          <Sparkles className="w-16 h-16 mx-auto text-orange-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            We're learning your preferences
          </h3>
          <p className="text-gray-600">
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
      className="bg-gradient-to-br from-orange-50 to-pink-50"
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {projects.map(project => (
          <EnhancedProjectCard key={project.id} project={project} showReasons={true} />
        ))}
      </div>
    </SectionContainer>
  );
}


