import { Helmet } from 'react-helmet-async';
import { useProjectContext } from '../../hooks/useProjectContext';

interface PageTitleProps {
    title: string;
    description?: string;
}

/**
 * A component that sets the page title, optionally including the selected project name.
 * When a project is selected, the title format is: "{Page Title} • {Project Name} - Lineup"
 * When no project is selected: "{Page Title} - Lineup"
 */
export default function PageTitle({ title, description }: PageTitleProps) {
    const { selectedProject } = useProjectContext();

    const fullTitle = selectedProject
        ? `${title} • ${selectedProject.title} - Lineup`
        : `${title} - Lineup`;

    const metaDescription = description || `${title} for your Lineup projects`;

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={metaDescription} />
        </Helmet>
    );
}
