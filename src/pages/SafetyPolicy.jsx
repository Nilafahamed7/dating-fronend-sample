import { useState, useEffect } from 'react';
// NavBar removed - using GlobalNavBar from App.jsx
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { publicService } from '../services/publicService';

export default function SafetyPolicy() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const response = await publicService.getPageContent('safety-policy');
      setContent(response.content);
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };

  const formatContent = (text) => {
    if (!text) return '';

    const lines = text.split('\n');
    const formatted = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('# ')) {
        formatted.push(
          <h1 key={index} className="text-3xl font-bold text-gray-900 mt-8 mb-4">
            {trimmed.substring(2)}
          </h1>
        );
      } else if (trimmed.startsWith('## ')) {
        formatted.push(
          <h2 key={index} className="text-2xl font-bold text-gray-800 mt-6 mb-3 flex items-center gap-2">
            {trimmed.substring(3).includes('Emergency') && (
              <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
            )}
            {trimmed.substring(3)}
          </h2>
        );
      } else if (trimmed.startsWith('### ')) {
        formatted.push(
          <h3 key={index} className="text-xl font-semibold text-gray-700 mt-4 mb-2">
            {trimmed.substring(4)}
          </h3>
        );
      } else if (trimmed.startsWith('- ')) {
        formatted.push(
          <li key={index} className="ml-6 mb-2 text-gray-600">
            {trimmed.substring(2)}
          </li>
        );
      } else if (trimmed.length > 0) {
        formatted.push(
          <p key={index} className="mb-4 text-gray-600 leading-relaxed">
            {trimmed}
          </p>
        );
      } else {
        formatted.push(<br key={index} />);
      }
    });

    return formatted;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 pt-16">
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl shadow-lg p-6 lg:p-10">
          {/* Safety Header */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 mb-8 border border-red-100">
            <div className="flex items-center gap-3 mb-3">
              <ShieldCheckIcon className="w-8 h-8 text-red-600" />
              <h2 className="text-2xl font-bold text-gray-900">Your Safety is Our Priority</h2>
            </div>
            <p className="text-gray-700">
              Please read and follow these safety guidelines to ensure a safe and positive experience on our platform.
            </p>
          </div>

          {content && (
            <div className="prose prose-lg max-w-none">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">{content.title}</h1>
              {content.metadata?.content && (
                <div className="text-gray-600">
                  {formatContent(content.metadata.content)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

