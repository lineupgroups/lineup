import React, { useState } from 'react';
import { Edit3, Trash2, Pin, MessageSquare, ThumbsUp, Calendar, MoreVertical } from 'lucide-react';
import { FirestoreProjectUpdate } from '../../types/firestore';
import { convertTimestamp } from '../../lib/firestore';
import LoadingSpinner from '../common/LoadingSpinner';

interface ProjectUpdatesListProps {
  updates: FirestoreProjectUpdate[];
  loading: boolean;
  onEdit: (update: FirestoreProjectUpdate) => void;
  onDelete: (updateId: string) => void;
  onPin: (updateId: string, isPinned: boolean) => void;
  isCreator?: boolean;
}

export default function ProjectUpdatesList({
  updates,
  loading,
  onEdit,
  onDelete,
  onPin,
  isCreator = false
}: ProjectUpdatesListProps) {
  const [expandedUpdateId, setExpandedUpdateId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (updates.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-xl">
        <div className="text-6xl mb-4">📢</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Updates Yet</h3>
        <p className="text-gray-600">
          {isCreator
            ? 'Post your first update to keep your supporters informed!'
            : 'The creator hasn\'t posted any updates yet.'}
        </p>
      </div>
    );
  }

  const toggleContent = (updateId: string) => {
    setExpandedUpdateId(expandedUpdateId === updateId ? null : updateId);
  };

  const toggleMenu = (updateId: string) => {
    setMenuOpen(menuOpen === updateId ? null : updateId);
  };

  return (
    <div className="space-y-6">
      {updates.map((update) => {
        const isExpanded = expandedUpdateId === update.id;
        const isMenuOpen = menuOpen === update.id;

        return (
          <div
            key={update.id}
            className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all ${
              update.isPinned ? 'border-2 border-orange-500' : 'border border-gray-200'
            }`}
          >
            {/* Pinned Badge */}
            {update.isPinned && (
              <div className="bg-orange-50 border-b border-orange-200 px-4 py-2">
                <div className="flex items-center space-x-2 text-orange-700 text-sm font-medium">
                  <Pin className="w-4 h-4" />
                  <span>Pinned Update</span>
                </div>
              </div>
            )}

            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {update.title}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{convertTimestamp(update.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</span>
                    </div>
                    {update.updatedAt && (
                      <span className="text-xs">(edited)</span>
                    )}
                  </div>
                </div>

                {/* Actions Menu */}
                {isCreator && (
                  <div className="relative">
                    <button
                      onClick={() => toggleMenu(update.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>

                    {isMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setMenuOpen(null)}
                        />
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                          <button
                            onClick={() => {
                              onEdit(update);
                              setMenuOpen(null);
                            }}
                            className="w-full flex items-center space-x-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                            <span>Edit Update</span>
                          </button>
                          <button
                            onClick={() => {
                              onPin(update.id, !update.isPinned);
                              setMenuOpen(null);
                            }}
                            className="w-full flex items-center space-x-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Pin className="w-4 h-4" />
                            <span>{update.isPinned ? 'Unpin' : 'Pin'} Update</span>
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this update?')) {
                                onDelete(update.id);
                              }
                              setMenuOpen(null);
                            }}
                            className="w-full flex items-center space-x-2 px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete Update</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Image */}
              {update.image && (
                <img
                  src={update.image}
                  alt={update.title}
                  className="w-full h-64 object-cover rounded-lg mb-4"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              )}

              {/* Content */}
              <div className="prose max-w-none">
                <p className={`text-gray-700 leading-relaxed whitespace-pre-wrap ${
                  !isExpanded && update.content.length > 300 ? 'line-clamp-4' : ''
                }`}>
                  {update.content}
                </p>
                {update.content.length > 300 && (
                  <button
                    onClick={() => toggleContent(update.id)}
                    className="text-orange-600 hover:text-orange-700 font-medium text-sm mt-2"
                  >
                    {isExpanded ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>

              {/* Engagement Stats */}
              <div className="flex items-center space-x-6 mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-2 text-gray-600">
                  <ThumbsUp className="w-5 h-5" />
                  <span className="text-sm font-medium">{update.likes || 0} likes</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <MessageSquare className="w-5 h-5" />
                  <span className="text-sm font-medium">{update.commentCount || 0} comments</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
