import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { matchService } from '../../services/matchService';
import MatchCard from './MatchCard';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import { HeartIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

export default function MatchesList() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadMatches();
  }, [user]);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const response = await matchService.getMatchList();
      const matchesList = response.matches || response.data || [];

      // Defensive filtering: Ensure no fake users are shown even if API returned them
      const filteredMatches = matchesList.filter(m => {
        const otherUser = m.otherUser || m.user;
        return !otherUser.isFake;
      });

      setMatches(filteredMatches);
    } catch (error) {
      toast.error('Failed to load matches');
      } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <EmptyState
        icon={HeartIcon}
        title="No matches yet"
        message="Start swiping to find your perfect match!"
      />
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  return (
    <motion.div
      className="space-y-5 p-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{
        marginTop: 0,
        paddingTop: '0.5rem',
        marginBottom: 0,
        paddingBottom: 0,
      }}
    >
      {matches.map((match, index) => (
        <MatchCard key={match._id || match.matchId} match={match} index={index} />
      ))}
    </motion.div>
  );
}

