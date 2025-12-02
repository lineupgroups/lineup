import React, { useState } from 'react';
import { 
  Shield, 
  ShieldOff, 
  Ban, 
  UserCheck, 
  Search,
  Calendar,
  Activity,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import { FirestoreUser } from '../../types/firestore';
import { useAdminActions } from '../../hooks/useAdminActions';
import { useUserSearch } from '../../hooks/useUserAnalytics';
import { useUserDetails } from '../../hooks/useUserAnalytics';

interface UserManagementProps {
  users: FirestoreUser[];
  adminId: string;
  adminEmail: string;
  onRefresh: () => void;
}

export default function UserManagement({ users, adminId, adminEmail, onRefresh }: UserManagementProps) {
  const {
    suspendUser,
    banUser,
    unbanUser,
    verifyCreator,
    unverifyCreator,
    fetchUserActivityLogs
  } = useAdminActions(adminId, adminEmail);

  const { search } = useUserSearch();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'creator' | 'supporter' | 'verified'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'banned'>('all');
  const [selectedUser, setSelectedUser] = useState<FirestoreUser | null>(null);
  const [showActionModal, setShowActionModal] = useState<'suspend' | 'ban' | 'details' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  // Filter users
  const filteredUsers = users.filter(user => {
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        user.displayName?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term);
      if (!matchesSearch) return false;
    }

    // Role filter
    if (roleFilter === 'creator' && !(user.stats?.projectsCreated || 0 > 0)) return false;
    if (roleFilter === 'supporter' && !(user.stats?.projectsSupported || 0 > 0)) return false;
    if (roleFilter === 'verified' && !user.isVerifiedCreator) return false;

    // Status filter
    if (statusFilter === 'suspended' && !user.isSuspended) return false;
    if (statusFilter === 'banned' && !user.isBanned) return false;
    if (statusFilter === 'active' && (user.isSuspended || user.isBanned)) return false;

    return true;
  });

  const handleSuspend = async () => {
    if (!selectedUser || !actionReason.trim()) return;
    const success = await suspendUser(selectedUser.uid, actionReason);
    if (success) {
      setShowActionModal(null);
      setActionReason('');
      setSelectedUser(null);
      onRefresh();
    }
  };

  const handleBan = async () => {
    if (!selectedUser || !actionReason.trim()) return;
    const success = await banUser(selectedUser.uid, actionReason);
    if (success) {
      setShowActionModal(null);
      setActionReason('');
      setSelectedUser(null);
      onRefresh();
    }
  };

  const handleUnban = async (userId: string) => {
    const success = await unbanUser(userId);
    if (success) onRefresh();
  };

  const handleToggleVerification = async (user: FirestoreUser) => {
    if (user.isVerifiedCreator) {
      const success = await unverifyCreator(user.uid);
      if (success) onRefresh();
    } else {
      const success = await verifyCreator(user.uid);
      if (success) onRefresh();
    }
  };

  const handleViewDetails = async (user: FirestoreUser) => {
    setSelectedUser(user);
    setShowActionModal('details');
    const logs = await fetchUserActivityLogs(user.uid);
    setActivityLogs(logs);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUserBadge = (user: FirestoreUser) => {
    if (user.isBanned) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Banned</span>;
    }
    if (user.isSuspended) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Suspended</span>;
    }
    if (user.isVerifiedCreator) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Verified</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>;
  };

  return (
    <div>
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Users
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="creator">Creators</option>
              <option value="supporter">Supporters</option>
              <option value="verified">Verified Only</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.uid} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-medium text-gray-900">
                            {user.displayName || 'Unnamed User'}
                          </div>
                          {user.isVerifiedCreator && (
                            <CheckCircle className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getUserBadge(user)}
                    {user.reportCount && user.reportCount > 0 && (
                      <div className="mt-1">
                        <span className="text-xs text-red-600">
                          {user.reportCount} reports
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>Projects: {user.stats?.projectsCreated || 0}</div>
                    <div className="text-gray-500">Supported: {user.stats?.projectsSupported || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {/* View Details */}
                      <button
                        onClick={() => handleViewDetails(user)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Activity className="w-4 h-4" />
                      </button>

                      {/* Verify/Unverify */}
                      {(user.stats?.projectsCreated || 0) > 0 && (
                        <button
                          onClick={() => handleToggleVerification(user)}
                          className={user.isVerifiedCreator ? 'text-gray-600 hover:text-gray-900' : 'text-green-600 hover:text-green-900'}
                          title={user.isVerifiedCreator ? 'Remove Verification' : 'Verify Creator'}
                        >
                          {user.isVerifiedCreator ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                        </button>
                      )}

                      {/* Suspend */}
                      {!user.isBanned && !user.isSuspended && (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowActionModal('suspend');
                          }}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Suspend User"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                      )}

                      {/* Ban */}
                      {!user.isBanned && (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowActionModal('ban');
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Ban User"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}

                      {/* Unban */}
                      {user.isBanned && (
                        <button
                          onClick={() => handleUnban(user.uid)}
                          className="text-green-600 hover:text-green-900"
                          title="Unban User"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No users found matching your filters
            </div>
          )}
        </div>
      </div>

      {/* Action Modals */}
      {(showActionModal === 'suspend' || showActionModal === 'ban') && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {showActionModal === 'suspend' ? 'Suspend User' : 'Ban User'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              User: <strong>{selectedUser.displayName}</strong>
            </p>
            <textarea
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Reason..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              rows={4}
            />
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowActionModal(null);
                  setActionReason('');
                  setSelectedUser(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={showActionModal === 'suspend' ? handleSuspend : handleBan}
                disabled={!actionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {showActionModal === 'suspend' ? 'Suspend' : 'Ban'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showActionModal === 'details' && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                User Details
              </h3>
              <button
                onClick={() => {
                  setShowActionModal(null);
                  setSelectedUser(null);
                  setActivityLogs([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{selectedUser.displayName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{selectedUser.email}</p>
              </div>
              {selectedUser.location && (
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-medium">{selectedUser.location}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Stats</p>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600">Projects Created</p>
                    <p className="text-lg font-semibold">{selectedUser.stats?.projectsCreated || 0}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600">Projects Supported</p>
                    <p className="text-lg font-semibold">{selectedUser.stats?.projectsSupported || 0}</p>
                  </div>
                </div>
              </div>

              {/* Activity Logs */}
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Recent Activity</p>
                {activityLogs.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {activityLogs.slice(0, 10).map((log) => (
                      <div key={log.id} className="text-sm bg-gray-50 p-2 rounded">
                        <p className="text-gray-900">{log.description}</p>
                        <p className="text-xs text-gray-500">{formatDate(log.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No activity logs found</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


