import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useProject } from '../hooks/useProjects';
import SupportFlow from './SupportFlow';
import LoadingSpinner from './common/LoadingSpinner';
import NotFound from './NotFound';

export default function SupportFlowPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  
  const { project, loading, error } = useProject(projectId || '');

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Error state or project not found
  if (error || !project) {
    return <NotFound />;
  }

  const handleBack = () => {
    navigate(`/project/${project.id}`);
  };

  const handleSuccess = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Support {project.title} - Lineup</title>
        <meta name="description" content={`Support ${project.title} and help bring this amazing project to life.`} />
      </Helmet>

      <SupportFlow
        project={project}
        onBack={handleBack}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
