import { useState, useEffect, useMemo } from 'react';
import {
  DollarSign, Clock, CheckCircle,
  AlertCircle, Wallet, FileText, Building2,
  Download, Shield, Smartphone
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProjectsByCreator } from '../../hooks/useProjects';
import { useEarnings } from '../../hooks/useEarnings';
import { useProjectContext } from '../../hooks/useProjectContext';
import { getProjectDonations, DonationData } from '../../lib/donationService';
import BankDetailsForm from '../earnings/BankDetailsForm';
import PayoutRequestForm from '../earnings/PayoutRequestForm';
import LoadingSpinner from '../common/LoadingSpinner';
import PageTitle from '../common/PageTitle';
import { convertTimestamp } from '../../lib/firestore';
import toast from 'react-hot-toast';

export default function CreatorEarningsPage() {
  const { user } = useAuth();
  const { projects, loading: projectsLoading } = useProjectsByCreator(user?.uid || '');
  const {
    summary,
    payouts,
    loading: earningsLoading,
    updateBankDetails,
    withdrawFunds,
    processingPayout
  } = useEarnings(user?.uid);

  // Use project context for filtering
  const { selectedProjectId, selectedProject } = useProjectContext();

  const [allDonations, setAllDonations] = useState<(DonationData & { projectTitle: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBankForm, setShowBankForm] = useState(false);
  const [showPayoutForm, setShowPayoutForm] = useState(false);

  // Mock Bank Details
  const mockBankDetails: {
    hasBankAccount: boolean;
    bankName: string;
    accountNumber: string;
    ifsc: string;
    accountHolder: string;
    hasUPI: boolean;
    upiId: string;
    primaryMethod: 'bank' | 'upi';
  } = {
    hasBankAccount: true,
    bankName: 'HDFC Bank',
    accountNumber: 'XXXX-XXXX-1234',
    ifsc: 'HDFC0001234',
    accountHolder: user?.displayName || 'Creator',
    hasUPI: true,
    upiId: 'creator@paytm',
    primaryMethod: 'bank',
  };

  // Mock Payout History with Reference IDs
  const mockPayoutHistory = [
    { id: '1', date: '2025-12-20', amount: 25000, method: 'HDFC Bank', status: 'completed', reference: 'PAY-12345' },
    { id: '2', date: '2025-12-10', amount: 15000, method: 'UPI', status: 'completed', reference: 'PAY-12344' },
    { id: '3', date: '2025-12-05', amount: 10000, method: 'HDFC Bank', status: 'processing', reference: 'PAY-12343' },
    { id: '4', date: '2025-11-25', amount: 20000, method: 'UPI', status: 'completed', reference: 'PAY-12342' },
    { id: '5', date: '2025-11-15', amount: 8000, method: 'HDFC Bank', status: 'completed', reference: 'PAY-12341' },
  ];

  // Mock Tax Documents
  const taxDocuments = [
    { name: 'TDS Certificate (Form 16A)', description: 'For income tax filing', type: 'pdf', available: true },
    { name: 'Annual Statement FY 2024-25', description: 'Yearly earnings summary', type: 'pdf', available: true },
    { name: 'GST Invoice', description: 'Platform fee GST credit', type: 'pdf', available: true },
    { name: 'Donation List', description: 'All donations received', type: 'csv', available: true },
  ];

  // Fetch all donations
  useEffect(() => {
    const fetchAllDonations = async () => {
      if (projects.length === 0) {
        setLoading(false);
        return;
      }

      try {
        // If a specific project is selected, only fetch donations for that project
        const projectsToFetch = selectedProjectId
          ? projects.filter(p => p.id === selectedProjectId)
          : projects;

        const allPromises = projectsToFetch.map(async (project) => {
          const donations = await getProjectDonations(project.id, { limitCount: 500 });
          return donations.map(d => ({ ...d, projectTitle: project.title }));
        });

        const results = await Promise.all(allPromises);
        setAllDonations(results.flat());
      } catch (error) {
        console.error('Error fetching donations:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!projectsLoading) {
      fetchAllDonations();
    }
  }, [projects, projectsLoading, selectedProjectId]);

  // Earnings by project
  const earningsByProject = useMemo(() => {
    const projectMap = new Map<string, { title: string; amount: number; count: number }>();

    allDonations.forEach(d => {
      const existing = projectMap.get(d.projectId);
      if (existing) {
        existing.amount += d.amount;
        existing.count += 1;
      } else {
        projectMap.set(d.projectId, {
          title: d.projectTitle,
          amount: d.amount,
          count: 1
        });
      }
    });

    return Array.from(projectMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.amount - a.amount);
  }, [allDonations]);

  // Earnings timeline (monthly)
  const earningsTimeline = useMemo(() => {
    const months: { month: string; amount: number; count: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

      const monthDonations = allDonations.filter(d => {
        const date = convertTimestamp(d.backedAt);
        return date >= monthDate && date <= monthEnd;
      });

      months.push({
        month: monthDate.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        amount: monthDonations.reduce((sum, d) => sum + d.amount, 0),
        count: monthDonations.length
      });
    }

    return months;
  }, [allDonations]);

  // Tax info (India Compliance)
  const taxInfo = useMemo(() => {
    const totalEarnings = summary?.totalRaised || 0;
    const platformFee = summary?.platformFees || totalEarnings * 0.05;
    const gstOnPlatformFee = platformFee * 0.18; // 18% GST on platform fee
    const paymentGatewayFee = totalEarnings * 0.02;
    const netEarnings = totalEarnings - platformFee - gstOnPlatformFee - paymentGatewayFee;
    // TDS: 1% on payouts > ₹7,50,000/year (Section 194C)
    const tds = netEarnings > 750000 ? netEarnings * 0.01 : 0;

    return {
      grossEarnings: totalEarnings,
      platformFee,
      gstOnPlatformFee,
      paymentGatewayFee,
      netEarnings,
      tds,
      takeHome: netEarnings - tds
    };
  }, [summary]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Download earnings statement
  const handleDownloadStatement = () => {
    const statement = {
      creator: user?.displayName || 'Creator',
      generatedAt: new Date().toISOString(),
      summary: {
        grossEarnings: taxInfo.grossEarnings,
        platformFee: taxInfo.platformFee,
        paymentGatewayFee: taxInfo.paymentGatewayFee,
        netEarnings: taxInfo.netEarnings,
        tds: taxInfo.tds,
        takeHome: taxInfo.takeHome
      },
      projectBreakdown: earningsByProject,
      monthlyTrend: earningsTimeline
    };

    const blob = new Blob([JSON.stringify(statement, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `earnings_statement_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Earnings statement downloaded');
  };

  if (projectsLoading || loading || earningsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dynamic Page Title */}
      <PageTitle title="Earnings" description="Manage your earnings and withdrawals" />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Earnings</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {selectedProject
                    ? `Showing earnings for ${selectedProject.title}`
                    : 'Manage your earnings, withdrawals, and tax documents'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleDownloadStatement}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Statement</span>
              </button>
              <button
                onClick={() => setShowPayoutForm(true)}
                disabled={processingPayout || (summary?.availableBalance || 0) < 500}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 disabled:opacity-50"
              >
                <Wallet className="w-4 h-4" />
                <span>Withdraw</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Demo Banner */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-4 mb-8 text-white">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">
              <strong>Demo System:</strong> This is a mocked payment system for demonstration. No real money transfers.
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Earned</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary?.totalRaised || 0)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Available</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(summary?.availableBalance || 0)}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{formatCurrency(summary?.pendingBalance || 0)}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Withdrawn</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary?.totalWithdrawn || 0)}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Earnings Timeline */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Earnings Timeline</h3>
              <div className="h-48 flex items-end justify-between space-x-2">
                {earningsTimeline.map((month) => {
                  const maxAmount = Math.max(...earningsTimeline.map(m => m.amount));
                  const height = maxAmount > 0 ? (month.amount / maxAmount) * 100 : 5;

                  return (
                    <div key={month.month} className="flex-1 flex flex-col items-center group">
                      <div className="relative flex-1 w-full flex items-end">
                        <div
                          className="w-full bg-gradient-to-t from-green-500 to-emerald-400 rounded-t transition-all duration-300 hover:from-green-600 hover:to-emerald-500"
                          style={{ height: `${Math.max(height, 5)}%` }}
                        />
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {formatCurrency(month.amount)}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 mt-2">{month.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Earnings by Project */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Earnings by Project</h3>
              {earningsByProject.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No earnings yet</p>
              ) : (
                <div className="space-y-4">
                  {earningsByProject.map((project, index) => {
                    const maxAmount = earningsByProject[0]?.amount || 1;
                    const percentage = (project.amount / maxAmount) * 100;

                    return (
                      <div key={project.id}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">{project.title}</span>
                            <span className="text-xs text-gray-500">({project.count} donations)</span>
                          </div>
                          <span className="font-semibold text-gray-900">{formatCurrency(project.amount)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${index === 0 ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-orange-400'
                              }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Payout History (Enhanced with Reference IDs) */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payout History</h3>
              {mockPayoutHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-gray-500 font-medium">Date</th>
                        <th className="text-left py-2 text-gray-500 font-medium">Amount</th>
                        <th className="text-left py-2 text-gray-500 font-medium">Method</th>
                        <th className="text-left py-2 text-gray-500 font-medium">Status</th>
                        <th className="text-left py-2 text-gray-500 font-medium">Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockPayoutHistory.map((payout) => (
                        <tr key={payout.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3">{new Date(payout.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                          <td className="py-3 font-medium">{formatCurrency(payout.amount)}</td>
                          <td className="py-3">{payout.method}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${payout.status === 'completed' ? 'bg-green-100 text-green-700' :
                              payout.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                              {payout.status === 'completed' ? '✅ Completed' :
                                payout.status === 'processing' ? '⏳ Processing' : payout.status}
                            </span>
                          </td>
                          <td className="py-3 text-gray-500 font-mono text-xs">{payout.reference}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No payouts yet</p>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Tax Information (Enhanced with GST) */}
            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="w-5 h-5" />
                <h3 className="font-semibold">Earnings Breakdown</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-orange-100">Gross Earnings</span>
                  <span className="font-medium">{formatCurrency(taxInfo.grossEarnings)}</span>
                </div>
                <div className="border-t border-white/20 my-2" />
                <div className="flex justify-between">
                  <span className="text-orange-100">Platform Fee (5%)</span>
                  <span className="font-medium">-{formatCurrency(taxInfo.platformFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-100">GST on Platform Fee (18%)</span>
                  <span className="font-medium">-{formatCurrency(taxInfo.gstOnPlatformFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-100">Payment Gateway (2%)</span>
                  <span className="font-medium">-{formatCurrency(taxInfo.paymentGatewayFee)}</span>
                </div>
                {taxInfo.tds > 0 && (
                  <div className="flex justify-between">
                    <span className="text-orange-100">TDS (1%)</span>
                    <span className="font-medium">-{formatCurrency(taxInfo.tds)}</span>
                  </div>
                )}
                <div className="border-t border-white/20 my-2" />
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Net Available</span>
                  <span className="font-bold">{formatCurrency(taxInfo.takeHome)}</span>
                </div>
              </div>
            </div>

            {/* Payment Methods (Enhanced) */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Payment Methods</h3>
                <button
                  onClick={() => setShowBankForm(true)}
                  className="text-sm text-orange-600 hover:text-orange-700"
                >
                  + Add New
                </button>
              </div>

              <div className="space-y-3">
                {/* Bank Account (Mock) */}
                <div className={`flex items-center justify-between p-3 rounded-lg border-2 ${mockBankDetails.primaryMethod === 'bank' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'
                  }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${mockBankDetails.primaryMethod === 'bank' ? 'bg-green-100' : 'bg-gray-200'}`}>
                      <Building2 className={`w-5 h-5 ${mockBankDetails.primaryMethod === 'bank' ? 'text-green-600' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{mockBankDetails.bankName}</p>
                        {mockBankDetails.primaryMethod === 'bank' && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Primary</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">A/C {mockBankDetails.accountNumber}</p>
                      <p className="text-xs text-gray-400">IFSC: {mockBankDetails.ifsc}</p>
                    </div>
                  </div>
                  <button className="text-xs text-gray-500 hover:text-gray-700">Edit</button>
                </div>

                {/* UPI (Mock) */}
                {mockBankDetails.hasUPI && (
                  <div className={`flex items-center justify-between p-3 rounded-lg border-2 ${mockBankDetails.primaryMethod === 'upi' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'
                    }`}>
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${mockBankDetails.primaryMethod === 'upi' ? 'bg-green-100' : 'bg-gray-200'}`}>
                        <Smartphone className={`w-5 h-5 ${mockBankDetails.primaryMethod === 'upi' ? 'text-green-600' : 'text-gray-500'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">UPI</p>
                        <p className="text-xs text-gray-500">{mockBankDetails.upiId}</p>
                      </div>
                    </div>
                    <button className="text-xs text-orange-600 hover:text-orange-700">Set Primary</button>
                  </div>
                )}
              </div>
            </div>

            {/* Tax Documents */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Tax Documents</h3>
              </div>
              <div className="space-y-2">
                {taxDocuments.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                      <p className="text-xs text-gray-500">{doc.description}</p>
                    </div>
                    <button
                      onClick={() => toast.success(`${doc.name} download started (Mock)`)}
                      className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700"
                    >
                      <Download className="w-3 h-3" />
                      {doc.type.toUpperCase()}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* India Compliance Info */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 text-sm">India Tax Compliance</h4>
                  <ul className="text-xs text-blue-700 mt-2 space-y-1">
                    <li>• PAN required for payouts &gt; ₹50,000</li>
                    <li>• TDS (1%) deducted on payouts &gt; ₹7,50,000/year</li>
                    <li>• GST (18%) charged on platform fee</li>
                    <li>• TDS reflects in Form 26AS</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Projects</span>
                  <span className="font-medium text-gray-900">{projects.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Donations</span>
                  <span className="font-medium text-gray-900">{allDonations.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg. Donation</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(allDonations.length > 0 ? allDonations.reduce((s, d) => s + d.amount, 0) / allDonations.length : 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Min. Withdrawal</span>
                  <span className="font-medium text-gray-900">₹500</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bank Details Modal */}
      <BankDetailsForm
        isOpen={showBankForm}
        onClose={() => setShowBankForm(false)}
        onSubmit={async (details) => {
          await updateBankDetails(details);
          setShowBankForm(false);
        }}
      />

      {/* Payout Request Modal */}
      <PayoutRequestForm
        isOpen={showPayoutForm}
        onClose={() => setShowPayoutForm(false)}
        availableBalance={summary?.availableBalance || 0}
        onSubmit={async (amount, method) => {
          await withdrawFunds(amount, method);
          setShowPayoutForm(false);
        }}
      />
    </div>
  );
}
