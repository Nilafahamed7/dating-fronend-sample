import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  ChatBubbleLeftRightIcon, 
  ShieldCheckIcon, 
  UserGroupIcon, 
  VideoCameraIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  StarIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon, HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

export default function MarketingHome() {
  const navigate = useNavigate();
  const featuresRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const features = [
    {
      icon: ChatBubbleLeftRightIcon,
      title: 'Real-time Chat & Calls',
      description: 'Secure, encrypted conversations with crystal-clear voice and video calls built right in',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Verified Profiles & Safety',
      description: 'Photo verification and advanced safety tools to keep every connection authentic and secure',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50'
    },
    {
      icon: UserGroupIcon,
      title: 'Groups & Communities',
      description: 'Join vibrant real-time group chats and connect with communities that share your passions',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50'
    },
    {
      icon: VideoCameraIcon,
      title: 'Video Profiles',
      description: 'Showcase your personality with premium video profiles that make you stand out',
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-50'
    },
    {
      icon: SparklesIcon,
      title: 'Smart Matches',
      description: 'AI-powered matching with personalized icebreakers to spark meaningful conversations',
      color: 'from-amber-500 to-yellow-500',
      bgColor: 'bg-amber-50'
    }
  ];

  const steps = [
    {
      number: '1',
      title: 'Create your profile',
      description: 'Add photos, share your interests, and let your authentic personality shine through',
      icon: '✨',
      gradient: 'from-purple-400 to-pink-400'
    },
    {
      number: '2',
      title: 'Find matches & join groups',
      description: 'Discover people who share your values and join communities you\'ll love',
      icon: '💫',
      gradient: 'from-blue-400 to-cyan-400'
    },
    {
      number: '3',
      title: 'Chat, call, and meet safely',
      description: 'Start conversations, make calls, and build real connections with complete confidence',
      icon: '💬',
      gradient: 'from-amber-400 to-yellow-400'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah M.',
      text: 'Found my best match in just a week! The video profiles made all the difference.',
      avatar: '👩',
      rating: 5,
      location: 'New York'
    },
    {
      name: 'James K.',
      text: 'Love the group features and video calls. It feels so much more personal than other apps.',
      avatar: '👨',
      rating: 5,
      location: 'Los Angeles'
    },
    {
      name: 'Emma L.',
      text: 'Safe, fun, and actually works. I\'ve met amazing people through the communities feature.',
      avatar: '👩‍🦰',
      rating: 5,
      location: 'Chicago'
    },
    {
      name: 'Mike T.',
      text: 'Best dating app I\'ve tried. The smart matching really understands what I\'m looking for.',
      avatar: '👨‍🦱',
      rating: 5,
      location: 'Miami'
    }
  ];

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <motion.div 
              className="flex items-center"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 bg-clip-text text-transparent">
                Xanting
              </h1>
            </motion.div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Log in
              </button>
              <motion.button
                onClick={() => navigate('/signup')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full hover:from-amber-600 hover:to-yellow-600 transition-all shadow-lg shadow-amber-500/30"
              >
                Sign up
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative pb-24 sm:pb-32 min-h-screen flex items-center overflow-hidden" style={{ paddingTop: 'calc(80px + 48rem)' }}>
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-amber-200/40 to-yellow-200/40 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-orange-200/40 to-amber-200/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-r from-yellow-200/30 to-amber-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-block mb-6"
              >
                <span className="px-4 py-2 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-full text-sm font-semibold text-amber-800 border border-amber-200">
                  ✨ Trusted by 50,000+ users
                </span>
              </motion.div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold text-gray-900 leading-tight mb-6">
                Meet better,
                <br />
                <span className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 bg-clip-text text-transparent">
                  connect deeper
                </span>
              </h1>
              
              <p className="text-xl sm:text-2xl text-gray-700 mb-10 leading-relaxed max-w-xl">
                A safer, smarter app for real conversations, meaningful matches and vibrant communities.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <motion.button
                  onClick={() => navigate('/signup')}
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(251, 191, 36, 0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  className="group px-8 py-5 text-lg font-semibold text-black bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full hover:from-amber-500 hover:to-yellow-500 transition-all shadow-xl shadow-amber-500/30 flex items-center justify-center gap-3"
                >
                  Get started — it's free
                  <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
                <motion.button
                  onClick={scrollToFeatures}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-5 text-lg font-medium text-gray-700 bg-white rounded-full hover:bg-gray-50 transition-all shadow-lg border-2 border-gray-100"
                >
                  How it works
                </motion.button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span>Free to join</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span>Verified profiles</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span>Secure & private</span>
                </div>
              </div>
            </motion.div>

            {/* Right: Hero Image */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              {/* Main Phone Mockup */}
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative bg-white rounded-[3rem] shadow-2xl p-6 transform rotate-3 hover:rotate-0 transition-transform duration-500"
              >
                <div className="aspect-[9/16] bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100 rounded-[2.5rem] flex items-center justify-center overflow-hidden relative">
                  {/* Mockup Content */}
                  <div className="absolute inset-0 p-6 flex flex-col gap-4">
                    <div className="h-20 bg-white/80 rounded-2xl backdrop-blur-sm" />
                    <div className="flex-1 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl" />
                    <div className="h-16 bg-white/80 rounded-2xl backdrop-blur-sm" />
                  </div>
                  <div className="text-center relative z-10">
                    <div className="text-7xl mb-4 animate-bounce">📱</div>
                    <p className="text-gray-600 font-medium">App Preview</p>
                  </div>
                </div>
              </motion.div>

              {/* Floating Cards */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="absolute -bottom-8 -left-8 bg-white rounded-2xl shadow-2xl p-6 transform -rotate-6 hover:rotate-0 transition-transform duration-300 border border-gray-100 z-10"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-2xl shadow-lg">
                    💬
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">New match!</p>
                    <p className="text-sm text-gray-500">Start chatting now</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="absolute -top-8 -right-8 bg-white rounded-2xl shadow-2xl p-5 transform rotate-6 hover:rotate-0 transition-transform duration-300 border border-gray-100 z-10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center text-white text-xl shadow-lg">
                    ⭐
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Superlike!</p>
                    <p className="text-xs text-gray-500">Someone likes you</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-24 sm:py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6">
              Everything you need to
              <br />
              <span className="bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">
                connect meaningfully
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to help you build authentic relationships
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden"
                >
                  {/* Gradient Background on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-amber-600 group-hover:to-yellow-600 group-hover:bg-clip-text transition-all duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-lg">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 sm:py-32 bg-gradient-to-br from-gray-50 via-amber-50/30 to-yellow-50/30 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-200/20 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6">
              How it works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12 lg:gap-16">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="text-center relative"
              >
                {/* Connecting Line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-20 left-[60%] w-full h-0.5 bg-gradient-to-r from-amber-300 to-yellow-300" />
                )}

                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="relative inline-flex items-center justify-center mb-8"
                >
                  <div className={`w-24 h-24 bg-gradient-to-br ${step.gradient} rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-xl relative z-10`}>
                    {step.number}
                  </div>
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      delay: index * 0.5
                    }}
                    className="absolute -top-2 -right-2 text-5xl"
                  >
                    {step.icon}
                  </motion.div>
                </motion.div>

                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-24 sm:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20"
          >
            {[
              { value: '50k+', label: 'Active users', icon: '👥' },
              { value: '20k+', label: 'Monthly matches', icon: '💕' },
              { value: '99%', label: 'Verified profiles', icon: '✅' },
              { value: '4.8★', label: 'App rating', icon: '⭐' }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="text-center p-6 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl border border-amber-100"
              >
                <div className="text-4xl mb-3">{stat.icon}</div>
                <div className="text-4xl font-extrabold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Testimonials */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6">
              Loved by thousands
            </h2>
            <p className="text-xl text-gray-600">
              See what our community is saying
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-200 to-yellow-300 rounded-full flex items-center justify-center text-3xl shadow-md">
                    {testimonial.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.location}</div>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarSolidIcon key={i} className="w-4 h-4 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed italic">"{testimonial.text}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Strip */}
      <section className="py-24 sm:py-32 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-20">
          <div 
            className="absolute top-0 left-0 w-full h-full"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat'
            }}
          />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-black mb-6">
              Ready to find your match?
            </h2>
            <p className="text-xl text-gray-900 mb-10 max-w-2xl mx-auto">
              Join thousands of people finding meaningful connections on Xanting
            </p>
            <motion.button
              onClick={() => navigate('/signup')}
              whileHover={{ scale: 1.05, boxShadow: "0 25px 50px rgba(0, 0, 0, 0.3)" }}
              whileTap={{ scale: 0.95 }}
              className="group px-10 py-6 text-xl font-bold text-black bg-white rounded-full hover:bg-gray-50 transition-all shadow-2xl flex items-center gap-3 mx-auto"
            >
              Get started free
              <ArrowRightIcon className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </motion.button>
            <p className="text-sm text-gray-800 mt-6">
              No credit card required • Free forever
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
            {/* Product */}
            <div>
              <h3 className="text-white font-bold text-lg mb-6">Product</h3>
              <ul className="space-y-3">
                <li>
                  <button onClick={scrollToFeatures} className="hover:text-white transition-colors text-gray-400">
                    How it works
                  </button>
                </li>
                <li>
                  <button onClick={scrollToFeatures} className="hover:text-white transition-colors text-gray-400">
                    Features
                  </button>
                </li>
                <li>
                  <a href="#groups" className="hover:text-white transition-colors text-gray-400">
                    Groups
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-white font-bold text-lg mb-6">Company</h3>
              <ul className="space-y-3">
                <li>
                  <button onClick={() => navigate('/about')} className="hover:text-white transition-colors text-gray-400">
                    About Us
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/contact')} className="hover:text-white transition-colors text-gray-400">
                    Contact Us
                  </button>
                </li>
                <li>
                  <a href="#careers" className="hover:text-white transition-colors text-gray-400">
                    Careers
                  </a>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-white font-bold text-lg mb-6">Support</h3>
              <ul className="space-y-3">
                <li>
                  <button onClick={() => navigate('/refund-policy')} className="hover:text-white transition-colors text-gray-400">
                    Refund Policy
                  </button>
                </li>
                <li>
                  <a href="#safety" className="hover:text-white transition-colors text-gray-400">
                    Safety
                  </a>
                </li>
                <li>
                  <a href="#help" className="hover:text-white transition-colors text-gray-400">
                    Help Center
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-white font-bold text-lg mb-6">Legal</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#privacy" className="hover:text-white transition-colors text-gray-400">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#terms" className="hover:text-white transition-colors text-gray-400">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent mb-2">
                Xanting
              </h3>
              <p className="text-gray-400 text-sm">
                © {new Date().getFullYear()} Xanting. All rights reserved.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <select className="bg-gray-800 text-gray-300 text-sm px-4 py-2 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
                <option>English</option>
                <option>Español</option>
                <option>Français</option>
              </select>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
