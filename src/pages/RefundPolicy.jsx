import { useState, useEffect } from 'react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { publicService } from '../services/publicService';

export default function RefundPolicy() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const response = await publicService.getPageContent('refund-policy');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl shadow-lg p-6 lg:p-10">
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


