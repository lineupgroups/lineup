import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Eye, AlertCircle } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import PageTitle from '../common/PageTitle';
import toast from 'react-hot-toast';

// P-BUG-02: Project Edit Page - allows editing project details
export default function ProjectEditPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [project, setProject] = useState<any>(null);

    // Editable fields
    const [title, setTitle] = useState('');
    const [tagline, setTagline] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState('');

    useEffect(() => {
        const fetchProject = async () => {
            if (!projectId || !user) {
                setError('Project not found');
                setLoading(false);
                return;
            }

            try {
                const projectRef = doc(db, 'projects', projectId);
                const projectSnap = await getDoc(projectRef);

                if (!projectSnap.exists()) {
                    setError('Project not found');
                    setLoading(false);
                    return;
                }

                const projectData = { id: projectSnap.id, ...projectSnap.data() as Record<string, any> };

                // Verify ownership
                if (projectData.creatorId !== user.uid) {
                    setError('You do not have permission to edit this project');
                    setLoading(false);
                    return;
                }

                setProject(projectData);
                setTitle(projectData.title || '');
                setTagline(projectData.tagline || '');
                setDescription(projectData.description || '');
                setTags(projectData.tags || []);
            } catch (err) {
                console.error('Error fetching project:', err);
                setError('Failed to load project');
            } finally {
                setLoading(false);
            }
        };

        fetchProject();
    }, [projectId, user]);

    const handleAddTag = () => {
        if (newTag.trim() && tags.length < 5 && !tags.includes(newTag.trim())) {
            setTags([...tags, newTag.trim()]);
            setNewTag('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handleSave = async () => {
        if (!projectId || !title.trim()) {
            toast.error('Title is required');
            return;
        }

        try {
            setSaving(true);
            const projectRef = doc(db, 'projects', projectId);

            await updateDoc(projectRef, {
                title: title.trim(),
                tagline: tagline.trim(),
                description: description.trim(),
                tags,
                updatedAt: new Date()
            });

            toast.success('Project updated successfully!');
            navigate('/dashboard/projects');
        } catch (err) {
            console.error('Error updating project:', err);
            toast.error('Failed to update project');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-brand-black flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-brand-black flex items-center justify-center">
                <div className="text-center max-w-md mx-auto px-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-brand-white mb-4">{error}</h2>
                    <button
                        onClick={() => navigate('/dashboard/projects')}
                        className="px-6 py-3 bg-gradient-to-r from-brand-orange/100 to-red-500/100 text-white rounded-2xl font-medium hover:from-orange-600 hover:to-red-600 transition-all"
                    >
                        Back to Projects
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-black">
            <PageTitle title={`Edit: ${project?.title}`} description="Edit your project details" />

            {/* Header */}
            <div className="bg-[#111] border-b border-neutral-800">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/dashboard/projects')}
                                className="p-2 hover:bg-neutral-900 rounded-2xl transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-brand-white">Edit Project</h1>
                                <p className="text-sm text-neutral-400 mt-1">Update your project details</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate(`/project/${projectId}`)}
                                className="flex items-center gap-2 px-4 py-2 border border-neutral-700 text-neutral-300 rounded-2xl hover:bg-brand-black transition-colors"
                            >
                                <Eye className="w-4 h-4" />
                                <span>Preview</span>
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-brand-orange/100 to-red-500/100 text-white rounded-2xl font-medium hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50"
                            >
                                {saving ? (
                                    <LoadingSpinner size="sm" color="text-white" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-6">
                    {/* Notice */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-medium text-blue-300">Editing Limitations</h3>
                            <p className="text-sm text-blue-400 mt-1">
                                Funding goal, end date, and rewards cannot be changed after project creation to protect supporter trust.
                                Contact support if you need to make changes to these fields.
                            </p>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="bg-[#111] rounded-3xl border border-neutral-800 p-6">
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Project Title *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={100}
                            className="w-full px-4 py-3 border border-neutral-700 rounded-2xl focus:ring-2 focus:ring-brand-acid focus:border-brand-acid transition-colors"
                            placeholder="Enter your project title"
                        />
                        <p className="text-xs text-neutral-500 mt-2">{title.length}/100 characters</p>
                    </div>

                    {/* Tagline */}
                    <div className="bg-[#111] rounded-3xl border border-neutral-800 p-6">
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Tagline
                        </label>
                        <input
                            type="text"
                            value={tagline}
                            onChange={(e) => setTagline(e.target.value)}
                            maxLength={150}
                            className="w-full px-4 py-3 border border-neutral-700 rounded-2xl focus:ring-2 focus:ring-brand-acid focus:border-brand-acid transition-colors"
                            placeholder="A brief description of your project"
                        />
                        <p className="text-xs text-neutral-500 mt-2">{tagline.length}/150 characters</p>
                    </div>

                    {/* Description */}
                    <div className="bg-[#111] rounded-3xl border border-neutral-800 p-6">
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={8}
                            maxLength={5000}
                            className="w-full px-4 py-3 border border-neutral-700 rounded-2xl focus:ring-2 focus:ring-brand-acid focus:border-brand-acid transition-colors resize-none"
                            placeholder="Describe your project in detail..."
                        />
                        <p className="text-xs text-neutral-500 mt-2">{description.length}/5000 characters</p>
                    </div>

                    {/* Tags */}
                    <div className="bg-[#111] rounded-3xl border border-neutral-800 p-6">
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Tags ({tags.length}/5)
                        </label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-brand-orange/20 text-brand-orange rounded-full text-sm"
                                >
                                    {tag}
                                    <button
                                        onClick={() => handleRemoveTag(tag)}
                                        className="w-4 h-4 rounded-full bg-orange-200 hover:bg-orange-300 flex items-center justify-center text-brand-orange"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                        {tags.length < 5 && (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                    maxLength={20}
                                    className="flex-1 px-4 py-2 border border-neutral-700 rounded-2xl focus:ring-2 focus:ring-brand-acid focus:border-brand-acid transition-colors"
                                    placeholder="Add a tag"
                                />
                                <button
                                    onClick={handleAddTag}
                                    className="px-4 py-2 bg-neutral-900 text-neutral-300 rounded-2xl hover:bg-neutral-800 transition-colors"
                                >
                                    Add
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Read-only fields */}
                    <div className="bg-brand-black rounded-3xl border border-neutral-800 p-6">
                        <h3 className="font-medium text-brand-white mb-4">Read-Only Fields</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-neutral-500 mb-1">Funding Goal</label>
                                <p className="text-lg font-semibold text-neutral-300">
                                    ₹{(project?.goal || project?.fundingGoal || 0).toLocaleString('en-IN')}
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs text-neutral-500 mb-1">Amount Raised</label>
                                <p className="text-lg font-semibold text-green-400">
                                    ₹{(project?.raised || 0).toLocaleString('en-IN')}
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs text-neutral-500 mb-1">Category</label>
                                <p className="text-lg font-semibold text-neutral-300 capitalize">
                                    {project?.category || 'Not set'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs text-neutral-500 mb-1">End Date</label>
                                <p className="text-lg font-semibold text-neutral-300">
                                    {project?.endDate?.toDate().toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                    }) || 'Not set'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
