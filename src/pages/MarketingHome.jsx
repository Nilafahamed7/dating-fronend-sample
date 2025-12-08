import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
  ChatBubbleLeftRightIcon, 
  ShieldCheckIcon, 
  UserGroupIcon, 
  VideoCameraIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  BellIcon,
  UserPlusIcon,
  PhoneIcon,
  LockClosedIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';

import hero from '../assets/hero1.png';

export default function MarketingHome() {
  const navigate = useNavigate();
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [openFAQ, setOpenFAQ] = useState(null);
  const { scrollYProgress } = useScroll();

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: SparklesIcon,
      title: 'Smart Matches',
      description: 'We surface quality matches, not noise. Fewer swipes, better matches.',
      color: 'from-velora-primary to-velora-secondary',
      image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&h=400&fit=crop&q=80'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Verified Profiles & Safety',
      description: 'Verified IDs + photo checks to keep things real. ID checks, emergency share.',
      color: 'from-velora-secondary to-velora-primary',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=400&fit=crop&q=80'
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: 'Real-Time Chat & Calls',
      description: 'Message, voice & video with secure connections. Text, voice, and video.',
      color: 'from-velora-primary to-velora-secondary',
      image: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&h=400&fit=crop&q=80'
    },
    {
      icon: UserGroupIcon,
      title: 'Groups & Communities',
      description: 'Join events, meet locals with shared interests. Join events & interest circles.',
      color: 'from-velora-secondary to-velora-primary',
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop&q=80'
    },
    {
      icon: VideoCameraIcon,
      title: 'Video Profiles',
      description: 'Short video intros for premium members. Show the real you.',
      color: 'from-velora-primary to-velora-secondary',
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=400&fit=crop&q=80'
    }
  ];

  const steps = [
    {
      number: '1',
      title: 'Create your profile',
      description: 'Add photos, share your interests, and let your authentic personality shine through',
      icon: '✨',
      gradient: 'from-velora-primary to-velora-secondary',
      image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop&q=80'
    },
    {
      number: '2',
      title: 'Find matches & join groups',
      description: 'Discover people who share your values and join communities you\'ll love',
      icon: '💫',
      gradient: 'from-velora-secondary to-velora-primary',
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&q=80'
    },
    {
      number: '3',
      title: 'Chat, call, and meet safely',
      description: 'Start conversations, make calls, and build real connections with complete confidence',
      icon: '💬',
      gradient: 'from-velora-primary to-velora-secondary',
      image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop&q=80'
    }
  ];

  const testimonials = [
    {
      name: 'Asha',
      age: 29,
      text: 'I met someone in a week — real profiles, real people.',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&q=80',
      location: 'New York'
    },
    {
      name: 'James',
      age: 32,
      text: 'Love the group features and video calls. It feels so much more personal than other apps.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&q=80',
      location: 'Los Angeles'
    },
    {
      name: 'Emma',
      age: 27,
      text: 'Safe, fun, and actually works. I\'ve met amazing people through the communities feature.',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&q=80',
      location: 'Chicago'
    },
    {
      name: 'Mike',
      age: 35,
      text: 'Best dating app I\'ve tried. The smart matching really understands what I\'m looking for.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&q=80',
      location: 'Miami'
    }
  ];

  const safetyFeatures = [
    {
      icon: ShieldCheckIcon,
      title: 'Date Sharing',
      description: 'Share your date details with trusted contacts for added safety',
      color: 'from-velora-primary to-velora-secondary'
    },
    {
      icon: BellIcon,
      title: 'Emergency Alerts',
      description: 'Quick access to emergency services and trusted contacts',
      color: 'from-velora-secondary to-velora-primary'
    },
    {
      icon: LockClosedIcon,
      title: 'Verified IDs',
      description: 'Photo verification and ID checks to ensure authentic profiles',
      color: 'from-velora-primary to-velora-secondary'
    },
    {
      icon: UserPlusIcon,
      title: 'Trusted Contacts',
      description: 'Add friends and family who can check in on your dates',
      color: 'from-velora-secondary to-velora-primary'
    }
  ];

  const faqs = [
    {
      question: 'Is Xating free to use?',
      answer: 'Yes! Xating is free to download and use. You can create a profile, browse matches, and send messages for free. Premium features like video profiles and group creation are available with a subscription.'
    },
    {
      question: 'How does the matching algorithm work?',
      answer: 'Our smart matching algorithm considers your preferences, interests, location, and behavior patterns to surface quality matches. We focus on meaningful connections rather than endless swiping.'
    },
    {
      question: 'How do I verify my profile?',
      answer: 'You can verify your profile by taking a selfie that matches your profile photos. We also offer ID verification for an extra layer of safety and authenticity.'
    },
    {
      question: 'Can I use Xating for friendships, not just dating?',
      answer: 'Absolutely! Xating offers groups and communities where you can connect with people who share your interests, whether you\'re looking for friends, activity partners, or romantic connections.'
    },
    {
      question: 'What makes Xating different from other dating apps?',
      answer: 'Xating combines smart matching with community features, video profiles, and comprehensive safety tools. We focus on meaningful connections rather than endless swiping.'
    },
    {
      question: 'How do I report inappropriate behavior?',
      answer: 'You can report users directly from their profile or during a conversation. Our safety team reviews all reports within 24 hours and takes appropriate action.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-velora-accent via-white to-velora-accent">
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-xl border-b border-velora-primary/30 shadow-md"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between h-16 sm:h-18 md:h-20">
            {/* Logo */}
            <motion.div 
              className="flex items-center cursor-pointer"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-velora-primary via-velora-secondary to-velora-primary bg-clip-text text-transparent">
                Xating
              </h1>
            </motion.div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => navigate('/login')}
                className="px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base font-medium text-velora-darkGray hover:text-velora-black transition-colors"
              >
                Log in
              </button>
              <motion.button
                onClick={() => navigate('/signup')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-velora-black bg-gradient-to-r from-velora-primary to-velora-secondary rounded-full hover:shadow-lg hover:shadow-velora-primary/40 transition-all shadow-md"
              >
                Sign up
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-[430px] sm:pt-[750px] md:pt-[940px] lg:pt-32 pb-16 sm:pb-20 md:pb-24 lg:pb-28">
        {/* Beautiful Background with Gradient */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1644665068951-23ca1bb021df?q=80&w=2224&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
            alt="Happy couple connecting"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-velora-primary/85 via-velora-secondary/75 to-velora-primary/85" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        </div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-velora-primary/15 to-velora-secondary/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-velora-secondary/15 to-velora-primary/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full py-12 sm:py-16 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 xl:gap-16 items-center">
            {/* Left: Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-6 sm:space-y-8"
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold text-white leading-[1.1] sm:leading-tight drop-shadow-2xl">
                Xating — Meet better,
                <br />
                <span className="bg-gradient-to-r from-velora-primary via-white to-velora-secondary bg-clip-text text-transparent">
                  connect deeper
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl md:text-2xl text-white/95 leading-relaxed max-w-2xl font-medium drop-shadow-lg">
                A safer, smarter app for real conversations, meaningful matches and vibrant communities.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 pt-2">
                <motion.button
                  onClick={() => navigate('/signup')}
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(255, 203, 43, 0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  className="group px-8 sm:px-10 py-4 sm:py-5 text-base sm:text-lg font-bold text-velora-black bg-white rounded-full hover:bg-velora-accent hover:shadow-2xl hover:shadow-white/50 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-2 sm:gap-3 border-2 border-white/30 w-full sm:w-auto"
                >
                  Get started — it's free
                  <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
                <motion.button
                  onClick={scrollToHowItWorks}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 sm:px-10 py-4 sm:py-5 text-base sm:text-lg font-semibold text-white bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-all shadow-lg border-2 border-white/30 hover:border-white/50 hover:shadow-xl w-full sm:w-auto"
                >
                  How it works
                </motion.button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm md:text-base text-white/90 font-medium pt-2">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 sm:px-4 py-2 rounded-full border border-white/30">
                  <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  <span>Free to join</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 sm:px-4 py-2 rounded-full border border-white/30">
                  <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  <span>Verified profiles</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 sm:px-4 py-2 rounded-full border border-white/30">
                  <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  <span>Secure & private</span>
                </div>
              </div>
            </motion.div>

            {/* Right: Hero Image */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative  mt-8 sm:mt-12 lg:mt-0"
            >
              <motion.div
                animate={{ 
                  y: [0, -15, 0],
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative rounded-3xl sm:rounded-[3rem] lg:rounded-[4rem] shadow-2xl overflow-hidden border-4 border-white/30 hover:border-white/50 transition-all duration-500"
              >
                <img 
                  src={hero} 
                  alt="Happy couple using Xating app"
                  className="w-full mb-24 sm:mb-[360px] md:mb-[590px] lg:mb-0 h-[350px] sm:h-[450px]  md:h-[550px] lg:h-[600px] object-cover"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-16  sm:py-20 md:py-24 lg:py-28 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16 lg:mb-20"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-velora-primary via-velora-secondary to-velora-primary bg-clip-text text-transparent mb-4 sm:mb-6 leading-tight">
              Everything you need to
              <br />
              <span className="bg-gradient-to-r from-velora-primary to-velora-secondary bg-clip-text text-transparent">
                connect meaningfully
              </span>
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-velora-darkGray max-w-3xl mx-auto px-4 font-medium">
              Powerful features designed to help you build authentic relationships
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-12">
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
                  className="group relative bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-velora-primary/20 hover:border-velora-secondary/40"
                >
                  {/* Feature Image */}
                  <div className="relative h-48 sm:h-56 overflow-hidden">
                    <img 
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-20`} />
                  </div>
                  
                  <div className="p-6 sm:p-8">
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br ${feature.color} rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-velora-black" />
                    </div>
                    
                    <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-velora-primary to-velora-secondary bg-clip-text text-transparent mb-3 sm:mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-sm sm:text-base lg:text-lg text-velora-darkGray leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section ref={howItWorksRef} className="py-16 sm:py-20 md:py-24 lg:py-28 bg-gradient-to-br from-velora-accent via-white to-velora-accent relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16 lg:mb-20"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-velora-primary via-velora-secondary to-velora-primary bg-clip-text text-transparent mb-4 sm:mb-6">
              How it works
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-velora-darkGray max-w-3xl mx-auto px-4 font-medium">
              Get started in three simple steps
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-8 sm:gap-10 lg:gap-12">
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
                  <div className="hidden sm:block absolute top-16 sm:top-20 left-[60%] w-full h-0.5 bg-gradient-to-r from-velora-primary/40 via-velora-secondary/40 to-velora-primary/40" />
                )}

                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="relative inline-flex items-center justify-center mb-6 sm:mb-8"
                >
                  <div className="relative">
                    <div className={`w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-gradient-to-br ${step.gradient} rounded-full flex items-center justify-center text-3xl sm:text-4xl font-bold text-velora-black shadow-2xl relative z-10 ring-4 ring-velora-primary/20 hover:ring-velora-secondary/40 transition-all`}>
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
                      className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 text-3xl sm:text-4xl lg:text-5xl"
                    >
                      {step.icon}
                    </motion.div>
                  </div>
                </motion.div>

                <div className="relative h-48 sm:h-56 mb-4 sm:mb-6 rounded-2xl overflow-hidden">
                  <img 
                    src={step.image}
                    alt={step.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-velora-primary to-velora-secondary bg-clip-text text-transparent mb-3 sm:mb-4">
                  {step.title}
                </h3>
                <p className="text-base sm:text-lg text-velora-darkGray leading-relaxed px-2 font-medium">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial Carousel */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-28 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-velora-primary via-velora-secondary to-velora-primary bg-clip-text text-transparent mb-4 sm:mb-6">
              Loved by thousands
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-velora-darkGray max-w-2xl mx-auto">
              See what our community is saying
            </p>
          </motion.div>

          <div className="relative max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-3xl p-8 sm:p-10 lg:p-12 shadow-xl border-2 border-velora-primary/20"
              >
                <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                  <img 
                    src={testimonials[currentTestimonial].avatar}
                    alt={testimonials[currentTestimonial].name}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-velora-primary/30"
                  />
                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-lg sm:text-xl md:text-2xl text-velora-darkGray mb-4 sm:mb-6 italic leading-relaxed">
                      "{testimonials[currentTestimonial].text}"
                    </p>
                    <div>
                      <div className="font-bold text-velora-black text-lg sm:text-xl">
                        {testimonials[currentTestimonial].name}, {testimonials[currentTestimonial].age}
                      </div>
                      <div className="text-sm sm:text-base text-velora-darkGray/70">
                        {testimonials[currentTestimonial].location}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Carousel Controls */}
            <div className="flex justify-center gap-2 mt-6 sm:mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all ${
                    index === currentTestimonial 
                      ? 'bg-velora-primary w-8 sm:w-10' 
                      : 'bg-velora-primary/30 hover:bg-velora-primary/50'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing & Premium Section */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-28 bg-gradient-to-br from-velora-accent via-white to-velora-accent relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-velora-primary via-velora-secondary to-velora-primary bg-clip-text text-transparent mb-4 sm:mb-6">
              Unlock Premium Features
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-velora-darkGray max-w-2xl mx-auto">
              Video profiles & group creation for premium members
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-3xl p-8 sm:p-10 lg:p-12 shadow-2xl border-4 border-velora-primary/30 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-velora-primary/10 to-velora-secondary/10 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <div className="text-center mb-8 sm:mb-10">
                  <div className="inline-block px-4 py-2 bg-gradient-to-r from-velora-primary/20 to-velora-secondary/20 rounded-full mb-4">
                    <span className="text-sm sm:text-base font-semibold text-velora-darkGray">Premium</span>
                  </div>
                  <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-velora-primary to-velora-secondary bg-clip-text text-transparent mb-4">
                    Upgrade to Premium
                  </h3>
                  <p className="text-lg sm:text-xl text-velora-darkGray">
                    Get more out of Xating
                  </p>
                </div>

                <ul className="space-y-4 sm:space-y-5 mb-8 sm:mb-10">
                  {[
                    'Video profiles to showcase your personality',
                    'Create and manage your own groups',
                    'Unlimited call minutes',
                    'Priority customer support',
                    'Advanced matching filters',
                    'See who viewed your profile'
                  ].map((benefit, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex items-center gap-3 sm:gap-4"
                    >
                      <CheckCircleIcon className="w-6 h-6 sm:w-7 sm:h-7 text-velora-primary flex-shrink-0" />
                      <span className="text-base sm:text-lg text-velora-darkGray">{benefit}</span>
                    </motion.li>
                  ))}
                </ul>

                <motion.button
                  onClick={() => navigate('/signup')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto mx-auto block px-8 sm:px-10 py-4 sm:py-5 text-base sm:text-lg font-bold text-velora-black bg-gradient-to-r from-velora-primary to-velora-secondary rounded-full hover:shadow-xl hover:shadow-velora-primary/40 transition-all shadow-lg"
                >
                  Try Premium Free
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Safety & Trust Section */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-28 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-velora-primary via-velora-secondary to-velora-primary bg-clip-text text-transparent mb-4 sm:mb-6">
              Safety & Trust
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-velora-darkGray max-w-3xl mx-auto">
              Your safety is our priority. Built-in tools to keep you secure.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {safetyFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-velora-primary/20 hover:border-velora-secondary/40 text-center"
                >
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg`}>
                    <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-velora-black" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-velora-primary to-velora-secondary bg-clip-text text-transparent mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-velora-darkGray leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>

          <div className="text-center mt-10 sm:mt-12">
            <motion.button
              onClick={() => navigate('/contact')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-velora-darkGray bg-white rounded-full hover:bg-velora-accent transition-all shadow-lg border-2 border-velora-primary/30 hover:border-velora-secondary/50"
            >
              Learn more about safety
            </motion.button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-28 bg-gradient-to-br from-velora-accent via-white to-velora-accent relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-velora-primary via-velora-secondary to-velora-primary bg-clip-text text-transparent mb-4 sm:mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-velora-darkGray">
              Everything you need to know about Xating
            </p>
          </motion.div>

          <div className="space-y-4 sm:space-y-5">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg border-2 border-velora-primary/20 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  className="w-full px-6 sm:px-8 py-5 sm:py-6 flex items-center justify-between text-left hover:bg-velora-accent/50 transition-colors"
                >
                  <span className="text-base sm:text-lg font-semibold text-velora-darkGray pr-4">
                    {faq.question}
                  </span>
                  <ChevronDownIcon 
                    className={`w-5 h-5 sm:w-6 sm:h-6 text-velora-primary flex-shrink-0 transition-transform ${
                      openFAQ === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openFAQ === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 sm:px-8 pb-5 sm:pb-6 text-sm sm:text-base text-velora-darkGray leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Strip */}
      <section className="py-60 sm:py-60 md:py-96 lg:py-96 bg-gradient-to-r from-velora-primary via-velora-secondary to-velora-primary relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=1920&h=600&fit=crop&q=80" 
            alt="Happy couple"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-velora-primary/90 via-velora-secondary/90 to-velora-primary/90" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 w-full py-6 sm:py-8 md:py-10 lg:py-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-4 sm:space-y-6 md:space-y-8"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-velora-black drop-shadow-lg leading-tight px-2">
              Ready to find your match?
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-velora-black/90 max-w-2xl mx-auto font-medium px-4 sm:px-6">
              Join thousands of people finding meaningful connections on Xating
            </p>
            <div className="flex justify-center pt-2 sm:pt-4">
              <motion.button
                onClick={() => navigate('/signup')}
                whileHover={{ scale: 1.05, boxShadow: "0 25px 50px rgba(0, 0, 0, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                className="group px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 lg:py-6 text-sm sm:text-base md:text-lg lg:text-xl font-bold text-velora-black bg-white rounded-full hover:bg-gradient-to-r hover:from-velora-accent hover:to-velora-accent transition-all shadow-2xl flex items-center justify-center gap-2 sm:gap-3 border-2 sm:border-4 border-velora-primary/30 hover:border-velora-secondary/50 w-full sm:w-auto max-w-xs sm:max-w-none"
              >
                Get started free
                <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 group-hover:translate-x-2 transition-transform flex-shrink-0" />
              </motion.button>
            </div>
            <p className="text-xs sm:text-sm md:text-base text-velora-black/80 mt-2 sm:mt-4 md:mt-6 px-4">
              No credit card required • Free forever
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-10 sm:gap-12 lg:gap-14 mb-12 sm:mb-14 lg:mb-16">
            {/* Product */}
            <div>
              <h3 className="text-white font-bold text-base sm:text-lg mb-4 sm:mb-6">Product</h3>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <button onClick={scrollToHowItWorks} className="hover:text-white transition-colors text-gray-400 text-sm sm:text-base">
                    How it works
                  </button>
                </li>
                <li>
                  <button onClick={scrollToFeatures} className="hover:text-white transition-colors text-gray-400 text-sm sm:text-base">
                    Features
                  </button>
                </li>
                <li>
                  <a href="#groups" className="hover:text-white transition-colors text-gray-400 text-sm sm:text-base">
                    Groups
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-white font-bold text-base sm:text-lg mb-4 sm:mb-6">Company</h3>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <button onClick={() => navigate('/about')} className="hover:text-white transition-colors text-gray-400 text-sm sm:text-base">
                    About Us
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/contact')} className="hover:text-white transition-colors text-gray-400 text-sm sm:text-base">
                    Contact Us
                  </button>
                </li>
                <li>
                  <a href="#careers" className="hover:text-white transition-colors text-gray-400 text-sm sm:text-base">
                    Careers
                  </a>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-white font-bold text-base sm:text-lg mb-4 sm:mb-6">Support</h3>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <button onClick={() => navigate('/refund-policy')} className="hover:text-white transition-colors text-gray-400 text-sm sm:text-base">
                    Refund Policy
                  </button>
                </li>
                <li>
                  <a href="#safety" className="hover:text-white transition-colors text-gray-400 text-sm sm:text-base">
                    Safety
                  </a>
                </li>
                <li>
                  <a href="#help" className="hover:text-white transition-colors text-gray-400 text-sm sm:text-base">
                    Help Center
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-white font-bold text-base sm:text-lg mb-4 sm:mb-6">Legal</h3>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <a href="#privacy" className="hover:text-white transition-colors text-gray-400 text-sm sm:text-base">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#terms" className="hover:text-white transition-colors text-gray-400 text-sm sm:text-base">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-velora-primary to-velora-secondary bg-clip-text text-transparent mb-1 sm:mb-2">
                Xating
              </h3>
              <p className="text-gray-400 text-xs sm:text-sm">
                © {new Date().getFullYear()} Xating. All rights reserved.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <select className="bg-gray-900 text-gray-300 text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
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
