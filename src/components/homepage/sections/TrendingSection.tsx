import { Flame, Sparkles } from 'lucide-react';
import SectionContainer from '../SectionContainer';
import EnhancedProjectCard from '../EnhancedProjectCard';
import { FirestoreProject } from '../../../types/firestore';

interface TrendingSectionProps {
    projects: FirestoreProject[];
    loading?: boolean;
}

export default function TrendingSection({ projects, loading }: TrendingSectionProps) {
    if (loading) {
        return (
            <SectionContainer
                title="Trending Now"
                subtitle="Projects making waves on Lineup"
                icon={Flame}
                className="bg-gradient-to-br from-red-50 to-orange-50"
            >
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-gray-200 rounded-xl h-96 animate-pulse" />
                    ))}
                </div>
            </SectionContainer>
        );
    }

    // Show empty state with helpful message
    if (projects.length === 0) {
        return (
            <SectionContainer
                title="Trending Now"
                subtitle="Projects making waves on Lineup"
                icon={Flame}
                className="bg-gradient-to-br from-red-50 to-orange-50"
            >
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Trending projects coming soon</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                        The most popular and engaging projects will appear here.
                        Keep exploring and supporting creators!
                    </p>
                </div>
            </SectionContainer>
        );
    }

    return (
        <SectionContainer
            title="Trending Now"
            subtitle="Projects making waves on Lineup"
            icon={Flame}
            className="bg-gradient-to-br from-red-50 to-orange-50"
            viewAllLink="/explore?sort=trending"
        >
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {projects.map(project => (
                    <EnhancedProjectCard key={project.id} project={project} />
                ))}
            </div>
        </SectionContainer>
    );
}
