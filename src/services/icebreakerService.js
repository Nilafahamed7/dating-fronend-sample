import api from './api';

export const icebreakerService = {
  // Get icebreaker prompts
  getPrompts: async () => {
    const response = await api.get('/icebreakers/prompts');
    return response.data;
  },

  // Answer a prompt
  answerPrompt: async (promptId, answer) => {
    const response = await api.post('/icebreakers/answer', { promptId, answer });
    return response.data;
  },

  // Get my answers
  getMyAnswers: async () => {
    const response = await api.get('/icebreakers/answers');
    return response.data;
  },

  // Get available games
  getGames: async () => {
    const response = await api.get('/icebreakers/games');
    return response.data;
  },

  // Start a game session
  startGame: async (gameId, matchId) => {
    const response = await api.post('/icebreakers/games/start', { gameId, matchId });
    return response.data;
  },

  // Get game session details
  getGameSession: async (sessionId) => {
    const response = await api.get(`/icebreakers/games/${sessionId}`);
    return response.data;
  },
};

