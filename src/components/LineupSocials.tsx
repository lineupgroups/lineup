import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, TrendingUp, Users, Calendar, Filter } from 'lucide-react';

export default function LineupSocials() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'following' | 'trending'>('all');

  // TODO: Replace with real social posts data from Firestore
  const posts: any[] = []; // Will be populated with actual user activity posts

  const filters = [
    { id: 'all', label: 'All Updates', icon: Calendar },
    { id: 'following', label: 'Following', icon: Users },
    { id: 'trending', label: 'Trending', icon: TrendingUp }
  ];

  const getPostIcon = (type: string) => {
    switch (type) {
      case 'milestone':
        return '🎉';
      case 'update':
        return '📢';
      case 'celebration':
        return '🎊';
      case 'announcement':
        return '📣';
      default:
        return '📝';
    }
  };

  const handleLike = (postId: string) => {
    // TODO: Implement real like functionality with Firestore
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Lineup Socials</h1>
            <p className="text-xl text-purple-100">
              Stay connected with creators, celebrate milestones, and be part of the journey
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Activity Feed</h2>
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
          </div>
          
          <div className="flex space-x-2 overflow-x-auto">
            {filters.map((filter) => {
              const Icon = filter.icon;
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    activeFilter === filter.id
                      ? 'bg-purple-100 text-purple-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-purple-50 hover:text-purple-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feed */}
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Post Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start space-x-3">
                  <img
                    src={post.user.avatar}
                    alt={post.user.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{post.user.name}</h3>
                      {post.user.verified && (
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                      <span className="text-2xl">{getPostIcon(post.type)}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                      <span className="px-2 py-1 bg-purple-100 text-purple-600 rounded-full text-xs">
                        {post.project}
                      </span>
                      <span>•</span>
                      <span>{post.timestamp}</span>
                    </div>
                    <p className="text-gray-800 leading-relaxed">{post.content}</p>
                  </div>
                </div>
              </div>

              {/* Post Image */}
              {post.image && (
                <div className="px-6 pb-4">
                  <img
                    src={post.image}
                    alt="Post image"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Post Actions */}
              <div className="px-6 py-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center space-x-2 transition-colors ${
                        post.liked 
                          ? 'text-red-600 hover:text-red-700' 
                          : 'text-gray-600 hover:text-red-600'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${post.liked ? 'fill-current' : ''}`} />
                      <span className="text-sm font-medium">{post.likes}</span>
                    </button>
                    
                    <button className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">{post.comments}</span>
                    </button>
                    
                    <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
                      <Share2 className="w-5 h-5" />
                      <span className="text-sm font-medium">{post.shares}</span>
                    </button>
                  </div>
                  
                  <button className="px-4 py-2 bg-purple-100 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors">
                    Support Project
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-8">
          <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105">
            Load More Updates
          </button>
        </div>

        {/* Trending Projects Sidebar */}
        <div className="mt-12">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <span>Trending Projects</span>
            </h3>
            <div className="space-y-4">
              {[
                { name: 'EcoWave: Sustainable Water Purifier', funding: '65%' },
                { name: 'LearnSphere: AR Learning Platform', funding: '56%' },
                { name: 'Street Art Revival Mumbai', funding: '76%' },
                { name: 'Digital Literacy for Seniors', funding: '69%' }
              ].map((project, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{project.name}</p>
                    <p className="text-xs text-gray-600">{project.funding} funded</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}