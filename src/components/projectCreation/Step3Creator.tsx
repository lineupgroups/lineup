import React from 'react';
import { CheckCircle, Instagram, Youtube, Twitter, Linkedin, Globe } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Step3CreatorProps {
  onNext: () => void;
  onBack: () => void;
}

export default function Step3Creator({ onNext, onBack }: Step3CreatorProps) {
  const { user } = useAuth();

  // Get user data from profile (would come from Firestore in production)
  const userData = {
    displayName: user?.displayName || 'Anonymous',
    photoURL: user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'User')}&background=f97316&color=fff`,
    bio: 'Creator bio will be shown here from your profile.',
    socialLinks: {
      instagram: '',
      youtube: '',
      twitter: '',
      linkedin: '',
      website: ''
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Creator Profile</h2>
        <p className="text-gray-600">This information will be displayed on your project page</p>
      </div>

      {/* Profile Preview */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
        <div className="flex items-start space-x-6">
          <img
            src={userData.photoURL}
            alt={userData.displayName}
            className="w-24 h-24 rounded-full object-cover border-4 border-orange-100"
          />
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-2xl font-bold text-gray-900">{userData.displayName}</h3>
              {user?.emailVerified && (
                <CheckCircle className="w-6 h-6 text-green-500" />
              )}
            </div>
            
            <p className="text-gray-600 mb-4">{userData.bio}</p>
            
            {/* Social Links */}
            {(userData.socialLinks.instagram || userData.socialLinks.youtube || 
              userData.socialLinks.twitter || userData.socialLinks.linkedin || 
              userData.socialLinks.website) && (
              <div className="flex items-center space-x-4">
                {userData.socialLinks.instagram && (
                  <a href={userData.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-pink-600">
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {userData.socialLinks.youtube && (
                  <a href={userData.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-red-600">
                    <Youtube className="w-5 h-5" />
                  </a>
                )}
                {userData.socialLinks.twitter && (
                  <a href={userData.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-600">
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
                {userData.socialLinks.linkedin && (
                  <a href={userData.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-700">
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
                {userData.socialLinks.website && (
                  <a href={userData.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-orange-600">
                    <Globe className="w-5 h-5" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Using Your Existing Profile</h3>
            <p className="text-sm text-blue-800 mb-3">
              We're using your profile information to build trust with supporters. 
              This helps them know who's behind the project.
            </p>
            <p className="text-sm text-blue-800">
              Want to update your profile? You can do that from your profile settings after creating the project.
            </p>
          </div>
        </div>
      </div>

      {/* Verification Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Verification Status</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Email Verified</span>
            {user?.emailVerified ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <span className="text-sm text-amber-600">Pending</span>
            )}
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Phone Verified</span>
            <span className="text-sm text-amber-600">Complete in next step</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">KYC Verification</span>
            <span className="text-sm text-amber-600">Complete in next step</span>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
        <h3 className="font-semibold text-green-900 mb-3">Building Trust</h3>
        <ul className="text-sm text-green-800 space-y-2">
          <li>• A complete profile increases supporter confidence</li>
          <li>• Add social media links to show your online presence</li>
          <li>• A professional photo helps supporters connect with you</li>
          <li>• Share your story and why this project matters to you</li>
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600"
        >
          Continue to Verification →
        </button>
      </div>
    </div>
  );
}
