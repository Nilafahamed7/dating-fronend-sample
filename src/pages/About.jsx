import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, HeartIcon, ShieldCheckIcon, SparklesIcon } from '@heroicons/react/24/outline';

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span>Back</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900">About Us</h1>
            <div className="w-20" /> {/* Spacer */}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            About Xanting
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We're building a safer, smarter way to connect with people who share your interests and values.
          </p>
        </div>

        {/* Mission */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-8">
          <h3 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h3>
          <p className="text-gray-700 leading-relaxed text-lg mb-4">
            Xanting exists to bring people together through meaningful connections. We believe that everyone deserves a safe, authentic space to meet new people, build relationships, and find community.
          </p>
          <p className="text-gray-700 leading-relaxed text-lg">
            Our platform combines cutting-edge technology with a commitment to safety and authenticity, ensuring that every interaction is genuine and secure.
          </p>
        </div>

        {/* Values */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
              <HeartIcon className="w-6 h-6 text-red-500" />
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Authentic Connections</h4>
            <p className="text-gray-600">
              We prioritize real, meaningful relationships over superficial interactions.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <ShieldCheckIcon className="w-6 h-6 text-green-500" />
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Safety First</h4>
            <p className="text-gray-600">
              Your safety and privacy are our top priorities. We use advanced verification and moderation tools.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
              <SparklesIcon className="w-6 h-6 text-yellow-500" />
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Innovation</h4>
            <p className="text-gray-600">
              We're constantly improving our platform with new features and smarter matching algorithms.
            </p>
          </div>
        </div>

        {/* Story */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h3>
          <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
            <p>
              Xanting was founded in 2024 with a simple vision: to create a dating and social platform that puts people first. Frustrated by the superficial nature of existing apps and concerned about safety issues, our team set out to build something different.
            </p>
            <p>
              We started by listening to what people actually wanted: verified profiles, meaningful conversations, group communities, and a safe environment to connect. Today, Xanting serves thousands of users who are looking for authentic connections.
            </p>
            <p>
              We're proud of what we've built, but we're just getting started. Our team is constantly working on new features, improving safety measures, and finding better ways to help you connect with the people who matter most.
            </p>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Have questions or want to get in touch?</p>
          <button
            onClick={() => navigate('/contact')}
            className="px-8 py-3 bg-velora-primary text-black font-semibold rounded-full hover:opacity-90 transition-opacity shadow-md"
          >
            Contact Us
          </button>
        </div>
      </div>
    </div>
  );
}






