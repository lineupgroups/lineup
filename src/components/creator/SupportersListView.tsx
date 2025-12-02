import React, { useState, useEffect } from 'react';
import { Search, Download, Filter, Calendar, DollarSign, MapPin, Mail, User, X } from 'lucide-react';
import { FirestoreSupporter } from '../../types/firestore';
import { getProjectSupporters } from '../../lib/firestore';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

interface SupportersListViewProps {
  projectId: string;
}

export default function SupportersListView({ projectId }: SupportersListViewProps) {
  const [supporters, setSupporters] = useState<FirestoreSupporter[]>([]);
  const [filteredSupporters, setFilteredSupporters] = useState<FirestoreSupporter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [filterCity, setFilterCity] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchSupporters();
  }, [projectId]);

  useEffect(() => {
    filterAndSortSupporters();
  }, [supporters, searchTerm, sortBy, filterCity]);

  const fetchSupporters = async () => {
    try {
      setLoading(true);
      const data = await getProjectSupporters(projectId);
      setSupporters(data);
    } catch (error) {
      console.error('Error fetching supporters:', error);
      toast.error('Failed to load supporters');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortSupporters = () => {
    let filtered = [...supporters];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(supporter =>
        supporter.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supporter.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // City filter
    if (filterCity) {
      filtered = filtered.filter(supporter => supporter.city === filterCity);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'amount') {
        return b.amount - a.amount;
      } else {
        return b.createdAt.seconds - a.createdAt.seconds;
      }
    });

    setFilteredSupporters(filtered);
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Amount', 'Date', 'City', 'State', 'Message', 'Status'];
    const rows = filteredSupporters.map(supporter => [
      supporter.anonymous ? 'Anonymous' : supporter.userName,
      supporter.userEmail || 'N/A',
      supporter.amount,
      supporter.createdAt.toDate().toLocaleDateString('en-IN'),
      supporter.city || 'N/A',
      supporter.state || 'N/A',
      supporter.message || 'N/A',
      supporter.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supporters_${projectId}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Supporters list exported!');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getUniqueCities = () => {
    const cities = supporters
      .filter(s => s.city)
      .map(s => s.city)
      .filter((city, index, self) => self.indexOf(city) === index);
    return cities.sort();
  };

  const totalRaised = supporters.reduce((sum, s) => sum + s.amount, 0);
  const averageDonation = supporters.length > 0 ? totalRaised / supporters.length : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Supporters</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{supporters.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Raised</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalRaised)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Average Donation</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(averageDonation)}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search supporters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
            </select>

            <button
              onClick={exportToCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by City
                </label>
                <select
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">All Cities</option>
                  {getUniqueCities().map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>

            {(filterCity) && (
              <button
                onClick={() => {
                  setFilterCity('');
                }}
                className="mt-4 text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Supporters List */}
      {filteredSupporters.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm || filterCity ? 'No supporters match your filters' : 'No supporters yet'}
          </h3>
          <p className="text-gray-600">
            {searchTerm || filterCity 
              ? 'Try adjusting your search or filters' 
              : 'Share your project to get your first supporters!'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supporter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSupporters.map((supporter) => (
                  <tr key={supporter.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={supporter.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(supporter.userName)}&background=f97316&color=fff`}
                          alt={supporter.userName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {supporter.anonymous ? 'Anonymous Donor' : supporter.userName}
                          </div>
                          {supporter.userEmail && !supporter.anonymous && (
                            <div className="text-sm text-gray-500 flex items-center space-x-1">
                              <Mail className="w-3 h-3" />
                              <span>{supporter.userEmail}</span>
                            </div>
                          )}
                          {supporter.message && (
                            <div className="text-xs text-gray-600 italic mt-1 max-w-xs truncate">
                              "{supporter.message}"
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(supporter.amount)}
                      </div>
                      {supporter.paymentMethod && (
                        <div className="text-xs text-gray-500">
                          via {supporter.paymentMethod}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {supporter.city || supporter.state ? (
                        <div className="flex items-center text-sm text-gray-700">
                          <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                          <span>
                            {supporter.city}
                            {supporter.city && supporter.state && ', '}
                            {supporter.state}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-700">
                        <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                        <span>
                          {supporter.createdAt.toDate().toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        supporter.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : supporter.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {supporter.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Footer */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <div className="text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-900">{filteredSupporters.length}</span> of{' '}
          <span className="font-semibold text-gray-900">{supporters.length}</span> supporters
        </div>
      </div>
    </div>
  );
}
