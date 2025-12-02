import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { CheckCircle, XCircle, Clock, Eye, Search, Filter, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Project {
  id: string;
  title: string;
  tagline: string;
  category: string;
  goal: number;
  creatorId: string;
  creatorName: string;
  image: string;
  status: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  identityVerified: boolean;
  kycDocumentId?: string;
  createdAt: any;
  rejectionReason?: string;
}

export default function AdminProjectReview() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [filter]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      let q = query(
        collection(db, 'projects'),
        where('status', '==', 'pending_review'),
        orderBy('createdAt', 'desc')
      );

      if (filter !== 'all' && filter !== 'pending') {
        q = query(
          collection(db, 'projects'),
          where('approvalStatus', '==', filter),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];

      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (projectId: string) => {
    if (!user) return;
    
    try {
      setProcessing(true);
      const projectRef = doc(db, 'projects', projectId);
      
      await updateDoc(projectRef, {
        approvalStatus: 'approved',
        status: 'active',
        approvedAt: Timestamp.now(),
        approvedBy: user.uid,
        updatedAt: Timestamp.now()
      });

      toast.success('Project approved successfully!');
      fetchProjects();
      setShowModal(false);
    } catch (error) {
      console.error('Error approving project:', error);
      toast.error('Failed to approve project');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (projectId: string) => {
    if (!user || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setProcessing(true);
      const projectRef = doc(db, 'projects', projectId);
      
      await updateDoc(projectRef, {
        approvalStatus: 'rejected',
        status: 'rejected',
        rejectedAt: Timestamp.now(),
        rejectedBy: user.uid,
        rejectionReason: rejectionReason,
        updatedAt: Timestamp.now()
      });

      toast.success('Project rejected');
      fetchProjects();
      setShowModal(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting project:', error);
      toast.error('Failed to reject project');
    } finally {
      setProcessing(false);
    }
  };

  const filteredProjects = projects.filter(project =>
    searchTerm === '' ||
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.creatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending Review' },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Rejected' },
    };
    const badge = badges[status as keyof typeof badges] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Project Review Dashboard</h2>
        <p className="text-gray-600">Review and approve creator project submissions</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, creator, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['pending', 'approved', 'rejected'].map(status => {
          const count = projects.filter(p => p.approvalStatus === status).length;
          return (
            <div key={status} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 capitalize">{status === 'pending' ? 'Pending Review' : status}</p>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                </div>
                {getStatusBadge(status)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-lg">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading projects...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-lg">
          <p className="text-gray-600">No projects found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Project Image */}
              <div className="h-48 bg-gray-100 relative overflow-hidden">
                {project.image ? (
                  <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  {getStatusBadge(project.approvalStatus)}
                </div>
              </div>

              {/* Project Info */}
              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{project.title}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.tagline}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Goal:</span>
                    <span className="font-semibold text-gray-900">₹{project.goal.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-semibold text-gray-900">{project.category}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Creator:</span>
                    <span className="font-semibold text-gray-900">{project.creatorName}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Identity:</span>
                    <span className={`font-semibold ${project.identityVerified ? 'text-green-600' : 'text-red-600'}`}>
                      {project.identityVerified ? '✓ Verified' : '✗ Not Verified'}
                    </span>
                  </div>
                </div>

                {project.approvalStatus === 'pending' ? (
                  <button
                    onClick={() => {
                      setSelectedProject(project);
                      setShowModal(true);
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Review Project
                  </button>
                ) : (
                  <div className="text-center text-sm text-gray-500">
                    Reviewed on {project.createdAt?.toDate().toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {showModal && selectedProject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{selectedProject.title}</h3>
                  <p className="text-gray-600">{selectedProject.tagline}</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Project Details */}
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Funding Goal</p>
                  <p className="text-2xl font-bold text-gray-900">₹{selectedProject.goal.toLocaleString()}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="font-semibold text-gray-900">{selectedProject.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Creator</p>
                    <p className="font-semibold text-gray-900">{selectedProject.creatorName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`/projects/${selectedProject.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Full Project
                  </a>
                </div>

                {selectedProject.kycDocumentId && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800">
                      ✓ Creator has completed KYC verification
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      KYC ID: {selectedProject.kycDocumentId.slice(0, 8)}...
                    </p>
                  </div>
                )}
              </div>

              {/* Rejection Form */}
              {rejectionReason !== '' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a clear reason for rejection..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                {rejectionReason === '' ? (
                  <>
                    <button
                      onClick={() => handleApprove(selectedProject.id)}
                      disabled={processing}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      {processing ? 'Approving...' : 'Approve & Publish'}
                    </button>
                    <button
                      onClick={() => setRejectionReason(' ')}
                      disabled={processing}
                      className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-5 h-5" />
                      Reject Project
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleReject(selectedProject.id)}
                      disabled={processing || !rejectionReason.trim()}
                      className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {processing ? 'Rejecting...' : 'Confirm Rejection'}
                    </button>
                    <button
                      onClick={() => setRejectionReason('')}
                      disabled={processing}
                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
