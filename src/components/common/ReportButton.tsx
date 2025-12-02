import React, { useState } from 'react';
import { Flag, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { reportProject, reportUser } from '../../lib/reports';
import { FirestoreReport } from '../../types/firestore';
import toast from 'react-hot-toast';

interface ReportButtonProps {
  targetType: 'project' | 'user';
  targetId: string;
  targetName: string;
}

export default function ReportButton({ targetType, targetId, targetName }: ReportButtonProps) {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState<FirestoreReport['category']>('spam');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !description.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      if (targetType === 'project') {
        await reportProject(
          targetId,
          user.uid,
          user.displayName || 'Anonymous',
          user.email || '',
          category,
          description
        );
      } else {
        await reportUser(
          targetId,
          user.uid,
          user.displayName || 'Anonymous',
          user.email || '',
          category,
          description
        );
      }

      toast.success('Report submitted successfully');
      setShowModal(false);
      setDescription('');
      setCategory('spam');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-colors"
        title={`Report ${targetType}`}
      >
        <Flag className="w-4 h-4" />
        <span className="text-sm">Report</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Report {targetType === 'project' ? 'Project' : 'User'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Reporting: <strong>{targetName}</strong>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FirestoreReport['category'])}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="spam">Spam</option>
                  <option value="fraud">Fraud</option>
                  <option value="inappropriate_content">Inappropriate Content</option>
                  <option value="harassment">Harassment</option>
                  <option value="misinformation">Misinformation</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe the issue..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Please provide specific details about why you're reporting this {targetType}.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !description.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Flag className="w-4 h-4" />
                <span>{submitting ? 'Submitting...' : 'Submit Report'}</span>
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              False reports may result in account suspension. All reports are reviewed by our moderation team.
            </p>
          </div>
        </div>
      )}
    </>
  );
}


