import React, { useState } from 'react';
import { Check, X, ChevronDown, ChevronUp, Rocket, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ComparisonTable() {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const features = [
    {
      category: 'Getting Started',
      items: [
        { feature: 'Account Creation', creator: true, supporter: true, creatorDetail: 'Free forever', supporterDetail: 'Free forever' },
        { feature: 'Profile Customization', creator: true, supporter: true, creatorDetail: 'Full profile with bio, links', supporterDetail: 'Basic profile' },
        { feature: 'KYC Verification', creator: true, supporter: false, creatorDetail: 'Required for withdrawals', supporterDetail: 'Not required' }
      ]
    },
    {
      category: 'Project Features',
      items: [
        { feature: 'Create Projects', creator: true, supporter: false, creatorDetail: 'Unlimited projects', supporterDetail: '-' },
        { feature: 'Browse Projects', creator: true, supporter: true, creatorDetail: 'Full access', supporterDetail: 'Full access' },
        { feature: 'Support Projects', creator: true, supporter: true, creatorDetail: 'Can support others', supporterDetail: 'Primary feature' },
        { feature: 'Project Analytics', creator: true, supporter: false, creatorDetail: 'Detailed insights', supporterDetail: '-' }
      ]
    },
    {
      category: 'Communication',
      items: [
        { feature: 'Post Updates', creator: true, supporter: false, creatorDetail: 'Unlimited updates', supporterDetail: '-' },
        { feature: 'View Updates', creator: true, supporter: true, creatorDetail: 'All updates', supporterDetail: 'Only supported projects' },
        { feature: 'Comment on Projects', creator: true, supporter: true, creatorDetail: 'After supporting', supporterDetail: 'After supporting' },
        { feature: 'Direct Messages', creator: true, supporter: true, creatorDetail: 'With supporters', supporterDetail: 'With creators' }
      ]
    },
    {
      category: 'Payments & Fees',
      items: [
        { feature: 'Platform Fee', creator: true, supporter: false, creatorDetail: '5% on funds raised', supporterDetail: 'No fees' },
        { feature: 'Payment Methods', creator: true, supporter: true, creatorDetail: 'UPI, Bank transfer', supporterDetail: 'UPI, Cards, Net banking' },
        { feature: 'Instant Withdrawals', creator: true, supporter: false, creatorDetail: 'Available after milestone', supporterDetail: '-' },
        { feature: 'Tax Receipts', creator: false, supporter: true, creatorDetail: '-', supporterDetail: 'For eligible donations' }
      ]
    },
    {
      category: 'Community',
      items: [
        { feature: 'Follower System', creator: true, supporter: true, creatorDetail: 'Get followers', supporterDetail: 'Follow creators' },
        { feature: 'Badge System', creator: true, supporter: true, creatorDetail: 'Verified creator badge', supporterDetail: 'Supporter badges' },
        { feature: 'Leaderboards', creator: true, supporter: true, creatorDetail: 'Top creators', supporterDetail: 'Top supporters' },
        { feature: 'Community Events', creator: true, supporter: true, creatorDetail: 'Full access', supporterDetail: 'Full access' }
      ]
    }
  ];

  const visibleCategories = isExpanded ? features : features.slice(0, 2);

  return (
    <section className="py-20 bg-white">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Rocket className="w-4 h-4" />
            COMPARE
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Creator vs Supporter: What's the Difference?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose your role and start your journey with us
          </p>
        </div>

        {/* Comparison Table */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 sm:p-8 shadow-xl border border-gray-200">
          {/* Header Row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-gray-600 font-semibold text-lg">
              Features
            </div>
            <div className="text-center">
              <div className="inline-flex flex-col items-center bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-xl p-4 shadow-lg">
                <Heart className="w-8 h-8 mb-2" />
                <div className="font-bold text-lg">Supporter</div>
                <div className="text-sm text-blue-100">Support & Engage</div>
              </div>
            </div>
            <div className="text-center">
              <div className="inline-flex flex-col items-center bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-xl p-4 shadow-lg">
                <Rocket className="w-8 h-8 mb-2" />
                <div className="font-bold text-lg">Creator</div>
                <div className="text-sm text-orange-100">Build & Launch</div>
              </div>
            </div>
          </div>

          {/* Features List */}
          {visibleCategories.map((category, catIndex) => (
            <div key={catIndex} className="mb-8 last:mb-0">
              {/* Category Header */}
              <div className="bg-gray-200 rounded-lg px-4 py-2 mb-4">
                <h3 className="font-bold text-gray-800">{category.category}</h3>
              </div>

              {/* Feature Rows */}
              <div className="space-y-2">
                {category.items.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="grid grid-cols-3 gap-4 bg-white rounded-lg p-4 hover:shadow-md transition-all border border-gray-100"
                  >
                    {/* Feature Name */}
                    <div className="flex items-center text-gray-700 font-medium">
                      {item.feature}
                    </div>

                    {/* Supporter Column */}
                    <div className="flex flex-col items-center justify-center text-center">
                      {item.supporter ? (
                        <>
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mb-1">
                            <Check className="w-5 h-5 text-green-600" />
                          </div>
                          <span className="text-xs text-gray-600 hidden sm:block">
                            {item.supporterDetail}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mb-1">
                            <X className="w-5 h-5 text-gray-400" />
                          </div>
                          <span className="text-xs text-gray-400 hidden sm:block">
                            Not available
                          </span>
                        </>
                      )}
                    </div>

                    {/* Creator Column */}
                    <div className="flex flex-col items-center justify-center text-center">
                      {item.creator ? (
                        <>
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mb-1">
                            <Check className="w-5 h-5 text-green-600" />
                          </div>
                          <span className="text-xs text-gray-600 hidden sm:block">
                            {item.creatorDetail}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mb-1">
                            <X className="w-5 h-5 text-gray-400" />
                          </div>
                          <span className="text-xs text-gray-400 hidden sm:block">
                            Not available
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Expand/Collapse Button */}
          <div className="text-center mt-8">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-800 font-semibold rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-all shadow-md hover:shadow-lg"
            >
              {isExpanded ? (
                <>
                  Show Less
                  <ChevronUp className="w-5 h-5" />
                </>
              ) : (
                <>
                  View Full Comparison
                  <ChevronDown className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          {/* Supporter CTA */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl p-8 text-white shadow-xl">
            <Heart className="w-12 h-12 mb-4" />
            <h3 className="text-2xl font-bold mb-2">Ready to Support?</h3>
            <p className="text-blue-100 mb-6">
              Discover amazing projects and make a difference. Support creators and be part of their success story.
            </p>
            <button
              onClick={() => navigate('/discover')}
              className="w-full bg-white text-blue-600 font-bold py-3 px-6 rounded-lg hover:bg-blue-50 transition-all transform hover:scale-105"
            >
              Discover Projects
            </button>
          </div>

          {/* Creator CTA */}
          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-8 text-white shadow-xl">
            <Rocket className="w-12 h-12 mb-4" />
            <h3 className="text-2xl font-bold mb-2">Ready to Create?</h3>
            <p className="text-orange-100 mb-6">
              Turn your ideas into reality. Launch your project today and get funded by supporters across India.
            </p>
            <button
              onClick={() => navigate('/dashboard/projects/create')}
              className="w-full bg-white text-orange-600 font-bold py-3 px-6 rounded-lg hover:bg-orange-50 transition-all transform hover:scale-105"
            >
              Start Your Project
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

