import { useState, useEffect } from 'react';
// NavBar removed - using GlobalNavBar from App.jsx
import LoadingSpinner from '../components/common/LoadingSpinner';
import { EnvelopeIcon, PhoneIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';
import { publicService } from '../services/publicService';
import { useNavigate } from 'react-router-dom';

export default function ContactUs() {
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const response = await publicService.getPageContent('contact-us');
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
          <h2 key={index} className="text-2xl font-bold text-gray-800 mt-6 mb-3">
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

  const metadata = content?.metadata || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl shadow-lg p-6 lg:p-10">
          {content && (
            <div className="prose prose-lg max-w-none">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">{content.title}</h1>

              {/* Contact Information Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
                {metadata.email && (
                  <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 border border-pink-100">
                    <div className="flex items-center gap-3 mb-3">
                      <EnvelopeIcon className="w-6 h-6 text-pink-600" />
                      <h3 className="text-lg font-semibold text-gray-800">Email</h3>
                    </div>
                    <a
                      href={`mailto:${metadata.email}`}
                      className="text-pink-600 hover:text-pink-700 font-medium"
                    >
                      {metadata.email}
                    </a>
                  </div>
                )}

                {metadata.phone && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                    <div className="flex items-center gap-3 mb-3">
                      <PhoneIcon className="w-6 h-6 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-800">Phone</h3>
                    </div>
                    <a
                      href={`tel:${metadata.phone}`}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {metadata.phone}
                    </a>
                  </div>
                )}

                {metadata.address && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                    <div className="flex items-center gap-3 mb-3">
                      <MapPinIcon className="w-6 h-6 text-green-600" />
                      <h3 className="text-lg font-semibold text-gray-800">Address</h3>
                    </div>
                    <p className="text-green-700 font-medium">
                      {metadata.address}
                    </p>
                  </div>
                )}

                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-100">
                  <div className="flex items-center gap-3 mb-3">
                    <ClockIcon className="w-6 h-6 text-yellow-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Business Hours</h3>
                  </div>
                  <p className="text-yellow-700 font-medium">
                    Monday - Friday: 9:00 AM - 6:00 PM EST<br />
                    Saturday: 10:00 AM - 4:00 PM EST<br />
                    Sunday: Closed
                  </p>
                </div>
              </div>

              {/* Support Button */}
              <div className="mt-8">
                <button
                  onClick={() => navigate('/support')}
                  className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-2xl font-semibold hover:from-yellow-600 hover:to-yellow-700 transition-all shadow-md hover:shadow-lg"
                >
                  Open Support Ticket
                </button>
              </div>

              {/* Content */}
              {metadata.content && (
                <div className="mt-8 text-gray-600">
                  {formatContent(metadata.content)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

