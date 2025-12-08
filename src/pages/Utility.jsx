import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  UserCircleIcon,
  HeartIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Utility() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const utilityFeatures = [
    {
      id: 'events',
      title: 'Events',
      description: 'Discover and create social events',
      icon: CalendarDaysIcon,
      color: 'from-blue-500 to-blue-600',
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      path: '/events',
      createPath: '/events/create',
    },
    {
      id: 'forums',
      title: 'Forums',
      description: 'Join discussions and share ideas',
      icon: ChatBubbleLeftRightIcon,
      color: 'from-purple-500 to-purple-600',
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      path: '/forums',
      createPath: '/forums/create',
    },
    {
      id: 'communities',
      title: 'Communities',
      description: 'Connect with like-minded people',
      icon: UserGroupIcon,
      color: 'from-green-500 to-green-600',
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      path: '/communities',
      createPath: '/communities/create',
    },
    {
      id: 'groups',
      title: 'Groups',
      description: 'Create and manage your groups',
      icon: UserCircleIcon,
      color: 'from-orange-500 to-orange-600',
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      path: '/groups',
      createPath: '/groups/create',
    },
    {
      id: 'dates',
      title: 'Dates',
      description: 'Schedule group dates and meetups',
      icon: HeartIcon,
      color: 'from-pink-500 to-pink-600',
      iconColor: 'text-pink-600',
      bgColor: 'bg-pink-50',
      path: '/group-dates',
      createPath: '/group-dates/create',
    },
  ];

  const handleFeatureClick = (feature) => {
    setLoading(true);
    navigate(feature.path);
  };

  const handleCreateClick = (e, feature) => {
    e.stopPropagation();
    setLoading(true);
    navigate(feature.createPath);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header removed - handled by GlobalNavBar */}

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {utilityFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleFeatureClick(feature)}
                className="relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group"
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                {/* Content */}
                <div className="relative p-6">
                  {/* Icon and Create Button */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 ${feature.bgColor} rounded-xl`}>
                      <Icon className={`w-8 h-8 ${feature.iconColor}`} />
                    </div>
                    <button
                      onClick={(e) => handleCreateClick(e, feature)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      aria-label={`Create ${feature.title}`}
                    >
                      <PlusIcon className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  {/* Title and Description */}
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {feature.title}
                  </h2>
                  <p className="text-gray-600 text-sm mb-4">
                    {feature.description}
                  </p>

                  {/* Action Button */}
                  <div className="flex items-center text-sm font-semibold text-gray-700 group-hover:text-velora-primary transition-colors">
                    <span>Explore</span>
                    <svg
                      className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>

                {/* Hover Effect Border */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`} />
              </motion.div>
            );
          })}
        </div>

        {/* Quick Actions Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 bg-white rounded-2xl shadow-lg p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/groups')}
              className="p-4 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors text-left"
            >
              <UserCircleIcon className="w-6 h-6 text-orange-600 mb-2" />
              <p className="text-sm font-semibold text-gray-900">My Groups</p>
            </button>
            <button
              onClick={() => navigate('/events')}
              className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors text-left"
            >
              <CalendarDaysIcon className="w-6 h-6 text-blue-600 mb-2" />
              <p className="text-sm font-semibold text-gray-900">My Events</p>
            </button>
            <button
              onClick={() => navigate('/communities')}
              className="p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors text-left"
            >
              <UserGroupIcon className="w-6 h-6 text-green-600 mb-2" />
              <p className="text-sm font-semibold text-gray-900">My Communities</p>
            </button>
            <button
              onClick={() => navigate('/group-dates')}
              className="p-4 bg-pink-50 hover:bg-pink-100 rounded-xl transition-colors text-left"
            >
              <HeartIcon className="w-6 h-6 text-pink-600 mb-2" />
              <p className="text-sm font-semibold text-gray-900">My Dates</p>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

