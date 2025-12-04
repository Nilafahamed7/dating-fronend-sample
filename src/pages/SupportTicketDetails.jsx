import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
// NavBar removed - using GlobalNavBar from App.jsx
import { supportService } from '../services/supportService';

export default function SupportTicketDetails() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [newResponse, setNewResponse] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTicketDetails();
  }, [ticketId]);

  const loadTicketDetails = async () => {
    try {
      const response = await supportService.getTicketDetails(ticketId);
      setTicket(response.ticket || response.data);
    } catch (error) {
      toast.error('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddResponse = async (e) => {
    e.preventDefault();
    if (!newResponse.trim()) return;

    try {
      await supportService.addResponse(ticketId, newResponse);
      setNewResponse('');
      loadTicketDetails();
    } catch (error) {
      toast.error('Failed to add response');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* NavBar removed - using GlobalNavBar from App.jsx */}
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* NavBar removed - using GlobalNavBar from App.jsx */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {ticket && (
          <>
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 mb-2">{ticket.subject}</h1>
                  <p className="text-sm text-gray-500">Category: {ticket.category}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  ticket.status === 'closed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {ticket.status}
                </span>
              </div>
              <p className="text-gray-700 mb-4">{ticket.message}</p>
              <p className="text-xs text-gray-400">
                Created {new Date(ticket.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <h2 className="text-xl font-bold text-gray-800">Responses</h2>
              {ticket.responses?.map((response) => (
                <div key={response._id} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-semibold text-gray-800">{response.author?.name || 'Support'}</p>
                    <p className="text-sm text-gray-500">{new Date(response.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="text-gray-700">{response.message}</p>
                </div>
              ))}
            </div>

            {ticket.status !== 'closed' && (
              <form onSubmit={handleAddResponse} className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Add Response</h3>
                <textarea
                  value={newResponse}
                  onChange={(e) => setNewResponse(e.target.value)}
                  rows={4}
                  placeholder="Type your response..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-velora-primary mb-4"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-velora-primary text-white rounded-lg hover:bg-velora-primary/90 transition"
                >
                  Send Response
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

