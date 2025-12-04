import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
// NavBar removed - using GlobalNavBar from App.jsx
import ProfileLeftSidebar from '../components/sidebar/ProfileLeftSidebar';
import { PlusIcon, ChatBubbleLeftRightIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { supportService } from '../services/supportService';

export default function Support() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', category: '', message: '' });

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await supportService.getMyTickets();
      setTickets(response.tickets || response.data?.tickets || []);
    } catch (error) {
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      await supportService.createTicket(newTicket);
      toast.success('Ticket created successfully');
      setShowCreateModal(false);
      setNewTicket({ subject: '', category: '', message: '' });
      loadTickets();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create ticket');
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'closed') return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    return <ClockIcon className="w-5 h-5 text-yellow-500" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex">
      <ProfileLeftSidebar isOpen={showLeftSidebar} onClose={() => setShowLeftSidebar(false)} />

      <div className="flex-1 relative z-10 flex flex-col min-w-0">
        {/* NavBar removed - using GlobalNavBar from App.jsx */}

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Support</h1>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-4 py-2.5 rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all text-sm sm:text-base shadow-md hover:shadow-lg"
              >
                <PlusIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Create Ticket</span>
                <span className="sm:hidden">Create</span>
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No support tickets yet</div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <motion.div
                    key={ticket._id || ticket.ticketId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => navigate(`/support/${ticket._id || ticket.ticketId}`)}
                    className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-800 mb-1">{ticket.subject}</h3>
                        <p className="text-sm text-gray-500">{ticket.category}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ticket.status)}
                        <span className="text-sm font-semibold capitalize">{ticket.status}</span>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-3 line-clamp-2">{ticket.message}</p>
                    <p className="text-xs text-gray-400">
                      Created {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Create Support Ticket</h2>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-velora-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                <select
                  value={newTicket.category}
                  onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-velora-primary"
                  required
                >
                  <option value="">Select category</option>
                  <option value="technical">Technical</option>
                  <option value="billing">Billing</option>
                  <option value="account">Account</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Message</label>
                <textarea
                  value={newTicket.message}
                  onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-velora-primary"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-velora-primary text-white rounded-lg hover:bg-velora-primary/90 transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

