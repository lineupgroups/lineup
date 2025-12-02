import { useState, useCallback } from 'react';
import { 
  updateProject, 
  deleteProject, 
  getProject, 
  FirestoreProject, 
  UpdateProjectData 
} from '../lib/firestore';
import { deleteImage, isCloudinaryUrl, getPublicIdFromUrl } from '../lib/cloudinary';
import toast from 'react-hot-toast';

export interface ProjectManagementOptions {
  onProjectUpdate?: (project: FirestoreProject) => void;
  onProjectDelete?: (projectId: string) => void;
  onError?: (error: Error) => void;
}

export interface UseProjectManagementReturn {
  isUpdating: boolean;
  isDeleting: boolean;
  updateProjectStatus: (projectId: string, status: string) => Promise<void>;
  updateProjectGoal: (projectId: string, newGoal: number) => Promise<void>;
  updateProjectEndDate: (projectId: string, endDate: Date) => Promise<void>;
  updateProjectImage: (projectId: string, imageUrl: string, oldImageUrl?: string) => Promise<void>;
  deleteProjectWithCleanup: (projectId: string) => Promise<void>;
  toggleProjectFeatured: (projectId: string, featured: boolean) => Promise<void>;
  updateProjectRewards: (projectId: string, rewards: any[]) => Promise<void>;
  validateProjectUpdate: (updateData: Partial<UpdateProjectData>) => { isValid: boolean; errors: string[] };
}

export const useProjectManagement = (options: ProjectManagementOptions = {}): UseProjectManagementReturn => {
  const { onProjectUpdate, onProjectDelete, onError } = options;
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Validate project update data
  const validateProjectUpdate = useCallback((updateData: Partial<UpdateProjectData>) => {
    const errors: string[] = [];

    // Validate goal
    if (updateData.goal !== undefined) {
      if (updateData.goal < 10000) {
        errors.push('Minimum funding goal is ₹10,000');
      }
      if (updateData.goal > 10000000) {
        errors.push('Maximum funding goal is ₹1,00,00,000');
      }
    }

    // Validate end date
    if (updateData.endDate) {
      const endDate = updateData.endDate instanceof Date ? updateData.endDate : new Date(updateData.endDate);
      const minDate = new Date();
      minDate.setDate(minDate.getDate() + 1); // At least 1 day from now
      
      if (endDate < minDate) {
        errors.push('End date must be at least 1 day in the future');
      }

      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 1); // Maximum 1 year from now
      
      if (endDate > maxDate) {
        errors.push('End date cannot be more than 1 year in the future');
      }
    }

    // Validate title
    if (updateData.title !== undefined) {
      if (!updateData.title || updateData.title.trim().length < 5) {
        errors.push('Title must be at least 5 characters long');
      }
      if (updateData.title.length > 100) {
        errors.push('Title must be less than 100 characters');
      }
    }

    // Validate descriptions
    if (updateData.description !== undefined) {
      if (!updateData.description || updateData.description.trim().length < 50) {
        errors.push('Description must be at least 50 characters long');
      }
    }

    if (updateData.fullDescription !== undefined) {
      if (!updateData.fullDescription || updateData.fullDescription.trim().length < 200) {
        errors.push('Full description must be at least 200 characters long');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  // Update project status
  const updateProjectStatus = useCallback(async (projectId: string, status: string) => {
    try {
      setIsUpdating(true);
      
      await updateProject(projectId, {
        status: status as any,
        updatedAt: new Date() as any
      });

      // Fetch updated project
      const updatedProject = await getProject(projectId);
      if (updatedProject) {
        onProjectUpdate?.(updatedProject);
      }

      toast.success(`Project status updated to ${status}`);
    } catch (error) {
      console.error('Error updating project status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update project status';
      toast.error(errorMessage);
      onError?.(error as Error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [onProjectUpdate, onError]);

  // Update project funding goal
  const updateProjectGoal = useCallback(async (projectId: string, newGoal: number) => {
    const validation = validateProjectUpdate({ goal: newGoal });
    if (!validation.isValid) {
      const errorMessage = validation.errors.join(', ');
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }

    try {
      setIsUpdating(true);
      
      await updateProject(projectId, {
        goal: newGoal,
        updatedAt: new Date() as any
      });

      const updatedProject = await getProject(projectId);
      if (updatedProject) {
        onProjectUpdate?.(updatedProject);
      }

      toast.success('Funding goal updated successfully');
    } catch (error) {
      console.error('Error updating project goal:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update funding goal';
      toast.error(errorMessage);
      onError?.(error as Error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [validateProjectUpdate, onProjectUpdate, onError]);

  // Update project end date
  const updateProjectEndDate = useCallback(async (projectId: string, endDate: Date) => {
    const validation = validateProjectUpdate({ endDate });
    if (!validation.isValid) {
      const errorMessage = validation.errors.join(', ');
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }

    try {
      setIsUpdating(true);
      
      // Calculate new days left
      const daysLeft = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      await updateProject(projectId, {
        endDate,
        daysLeft,
        updatedAt: new Date() as any
      });

      const updatedProject = await getProject(projectId);
      if (updatedProject) {
        onProjectUpdate?.(updatedProject);
      }

      toast.success('Campaign end date updated successfully');
    } catch (error) {
      console.error('Error updating project end date:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update end date';
      toast.error(errorMessage);
      onError?.(error as Error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [validateProjectUpdate, onProjectUpdate, onError]);

  // Update project image
  const updateProjectImage = useCallback(async (projectId: string, imageUrl: string, oldImageUrl?: string) => {
    try {
      setIsUpdating(true);
      
      // Delete old image if it's a Cloudinary URL
      if (oldImageUrl && isCloudinaryUrl(oldImageUrl)) {
        try {
          const publicId = getPublicIdFromUrl(oldImageUrl);
          await deleteImage(publicId);
        } catch (deleteError) {
          console.warn('Failed to delete old image:', deleteError);
          // Don't throw here, continue with update
        }
      }

      await updateProject(projectId, {
        image: imageUrl,
        updatedAt: new Date() as any
      });

      const updatedProject = await getProject(projectId);
      if (updatedProject) {
        onProjectUpdate?.(updatedProject);
      }

      toast.success('Project image updated successfully');
    } catch (error) {
      console.error('Error updating project image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update project image';
      toast.error(errorMessage);
      onError?.(error as Error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [onProjectUpdate, onError]);

  // Delete project with cleanup
  const deleteProjectWithCleanup = useCallback(async (projectId: string) => {
    try {
      setIsDeleting(true);
      console.log('🗑️ Starting project deletion process for:', projectId);
      
      // Get project data first to clean up associated resources
      const project = await getProject(projectId);
      
      if (project) {
        console.log('📋 Project found, cleaning up images...');
        
        // Delete associated images
        if (project.image && isCloudinaryUrl(project.image)) {
          console.log('🖼️ Deleting main project image:', project.image);
          try {
            const publicId = getPublicIdFromUrl(project.image);
            console.log('🔍 Extracted public_id:', publicId);
            const deleteSuccess = await deleteImage(publicId);
            if (deleteSuccess) {
              console.log('✅ Main project image deleted successfully');
            } else {
              console.warn('⚠️ Main project image deletion failed');
            }
          } catch (deleteError) {
            console.warn('❌ Failed to delete project image:', deleteError);
          }
        } else {
          console.log('ℹ️ No main project image to delete');
        }

        // Delete project updates images
        if (project.updates && project.updates.length > 0) {
          console.log(`🔄 Processing ${project.updates.length} project updates...`);
          for (const [index, update] of project.updates.entries()) {
            if (update.image && isCloudinaryUrl(update.image)) {
              console.log(`🖼️ Deleting update image ${index + 1}:`, update.image);
              try {
                const publicId = getPublicIdFromUrl(update.image);
                console.log('🔍 Extracted public_id:', publicId);
                const deleteSuccess = await deleteImage(publicId);
                if (deleteSuccess) {
                  console.log(`✅ Update image ${index + 1} deleted successfully`);
                } else {
                  console.warn(`⚠️ Update image ${index + 1} deletion failed`);
                }
              } catch (deleteError) {
                console.warn(`❌ Failed to delete update image ${index + 1}:`, deleteError);
              }
            }
          }
        } else {
          console.log('ℹ️ No update images to delete');
        }
      } else {
        console.warn('⚠️ Project not found, skipping image cleanup');
      }

      // Delete the project document
      console.log('🗄️ Deleting project document from Firestore...');
      await deleteProject(projectId);
      console.log('✅ Project document deleted successfully');
      
      onProjectDelete?.(projectId);
      toast.success('Project deleted successfully');
      
    } catch (error) {
      console.error('💥 Error deleting project:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete project';
      toast.error(errorMessage);
      onError?.(error as Error);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  }, [onProjectDelete, onError]);

  // Toggle project featured status
  const toggleProjectFeatured = useCallback(async (projectId: string, featured: boolean) => {
    try {
      setIsUpdating(true);
      
      await updateProject(projectId, {
        featured,
        updatedAt: new Date() as any
      });

      const updatedProject = await getProject(projectId);
      if (updatedProject) {
        onProjectUpdate?.(updatedProject);
      }

      toast.success(`Project ${featured ? 'featured' : 'unfeatured'} successfully`);
    } catch (error) {
      console.error('Error toggling project featured status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update featured status';
      toast.error(errorMessage);
      onError?.(error as Error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [onProjectUpdate, onError]);

  // Update project rewards
  const updateProjectRewards = useCallback(async (projectId: string, rewards: any[]) => {
    try {
      setIsUpdating(true);
      
      // Validate rewards
      for (const reward of rewards) {
        if (!reward.title || !reward.description || reward.amount < 100) {
          throw new Error('All rewards must have title, description, and amount ≥ ₹100');
        }
      }

      await updateProject(projectId, {
        rewards,
        updatedAt: new Date() as any
      });

      const updatedProject = await getProject(projectId);
      if (updatedProject) {
        onProjectUpdate?.(updatedProject);
      }

      toast.success('Project rewards updated successfully');
    } catch (error) {
      console.error('Error updating project rewards:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update rewards';
      toast.error(errorMessage);
      onError?.(error as Error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [onProjectUpdate, onError]);

  return {
    isUpdating,
    isDeleting,
    updateProjectStatus,
    updateProjectGoal,
    updateProjectEndDate,
    updateProjectImage,
    deleteProjectWithCleanup,
    toggleProjectFeatured,
    updateProjectRewards,
    validateProjectUpdate
  };
};
