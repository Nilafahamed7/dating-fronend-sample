import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { matchService } from '../services/matchService';
import { groupChatService } from '../services/groupChatService';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import GroupChatWindow from '../components/chat/GroupChatWindow';
import PageContainer from '../components/common/PageContainer';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function Chat() {
  const { matchId: urlParam, groupId, inviteToken } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [match, setMatch] = useState(null);
  const [actualMatchId, setActualMatchId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [joiningByToken, setJoiningByToken] = useState(false);

  // Handle group invite link route
  useEffect(() => {
    if (groupId && inviteToken) {
      handleInviteLink();
    }
  }, [groupId, inviteToken]);

  const handleInviteLink = async () => {
    if (!user) {
      toast.error('Please login to join the group');
      navigate('/login');
      return;
    }

    try {
      setJoiningByToken(true);
      const response = await groupChatService.joinByToken(groupId, inviteToken);
      if (response.success) {
        toast.success('Successfully joined the group!');
        // Redirect to group chat
        navigate(`/chat/group/${groupId}`);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to join group';
      toast.error(errorMessage);
      // Redirect to chat list on error
      navigate('/chat');
    } finally {
      setJoiningByToken(false);
    }
  };

  // Handle group chat route
  if (groupId && !inviteToken) {
    return (
      <div
        className="flex flex-col w-full bg-velora-gray overflow-hidden"
        style={{
          height: 'calc(100vh - var(--top-navbar-height, 64px) - var(--bottom-navbar-height, 60px))',
          minHeight: 0,
        }}
      >
        <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
          <GroupChatWindow groupId={groupId} />
        </div>
      </div>
    );
  }

  // Show loading while joining via invite link
  if (groupId && inviteToken) {
    return (
      <div className="flex flex-col h-full w-full bg-velora-gray overflow-hidden">
        <PageContainer className="bg-velora-gray" fullWidth={true} padding={true}>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <LoadingSpinner />
              <p className="mt-4 text-gray-600">Joining group...</p>
            </div>
          </div>
        </PageContainer>
      </div>
    );
  }

  useEffect(() => {
    if (urlParam) {
      resolveMatchId();
    }
  }, [urlParam]);

  const resolveMatchId = async () => {
    try {
      setLoading(true);

      // First, try to find in match list (in case urlParam is already a matchId)
      const response = await matchService.getMatchList();
      const matchesList = response.matches || response.data || [];
      const foundMatch = matchesList.find((m) => m._id === urlParam || m.matchId === urlParam);

      if (foundMatch) {
        // urlParam is a valid matchId
        setMatch(foundMatch);
        setActualMatchId(foundMatch._id || foundMatch.matchId);
        return;
      }

      // If not found, urlParam might be a userId - try to get match status
      try {
        const statusResponse = await matchService.getMatchStatus(urlParam);
        if (statusResponse.success && statusResponse.data && statusResponse.data.matchId) {
          // Found matchId from userId, redirect to correct URL
          const correctMatchId = statusResponse.data.matchId;
          setActualMatchId(correctMatchId);
          // Update URL without reload
          window.history.replaceState(null, '', `/chat/${correctMatchId}`);
          // Load match details
          const updatedMatches = await matchService.getMatchList();
          const updatedList = updatedMatches.matches || updatedMatches.data || [];
          const updatedMatch = updatedList.find((m) => m._id === correctMatchId || m.matchId === correctMatchId);
          setMatch(updatedMatch);
        } else {
          // No match found
          setMatch(null);
          setActualMatchId(null);
        }
      } catch (statusError) {
        // If getMatchStatus fails, urlParam is likely not a userId either
        // It might be an invalid matchId
        setMatch(null);
        setActualMatchId(null);
      }
    } catch (error) {
      setMatch(null);
      setActualMatchId(null);
    } finally {
      setLoading(false);
    }
  };

  if (urlParam) {
    const otherUser = match?.otherUser || match?.user || {};

    if (!actualMatchId && !loading) {
      // No valid match found
      return (
        <div className="flex flex-col h-full w-full bg-velora-gray" style={{ height: '100%', width: '100%' }}>
          <PageContainer className="bg-velora-gray" fullWidth={true} padding={true}>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-6">
                <p className="text-gray-600 mb-4">No match found. You need to match with this user first.</p>
                <button
                  onClick={() => navigate('/matches')}
                  className="btn-primary"
                >
                  Go to Matches
                </button>
              </div>
            </div>
          </PageContainer>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full w-full bg-velora-gray overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : actualMatchId ? (
          <div className="flex-1 flex flex-col min-h-0 relative">
            <ChatWindow matchId={actualMatchId} otherUser={otherUser} />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-velora-gray" style={{ height: '100%', width: '100%' }}>
      <PageContainer className="bg-velora-gray" fullWidth={true} padding={false}>
        <div style={{ marginTop: 0, paddingTop: '1rem', paddingLeft: 0, paddingRight: 0 }}>
          <ChatList />
        </div>
      </PageContainer>
    </div>
  );
}

