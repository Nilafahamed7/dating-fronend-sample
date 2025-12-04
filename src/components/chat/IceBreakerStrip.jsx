import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { chatService } from '../../services/chatService';
import { useAuth } from '../../contexts/AuthContext';
import { getSocket } from '../../services/socketService';
import api from '../../services/api';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export default function IceBreakerStrip({ matchId, groupId, onMessageSent }) {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const scrollContainerRef = useRef(null);
  const refreshTimerRef = useRef(null);
  const modalRef = useRef(null);
  const lastFocusedButtonRef = useRef(null);

  // Fetch icebreaker prompts from admin-managed API (dynamically loaded)
  const fetchPrompts = async () => {
    try {
      setLoading(true);
      // Fetch from the public endpoint that returns admin-managed active prompts
      const response = await api.get('/icebreakers/prompts');
      if (response.data.success && response.data.prompts) {
        // Only show active prompts that are managed by admin (filter out empty/invalid prompts)
        const activePrompts = response.data.prompts.filter(p =>
          p && p.id && p.question && p.question.trim().length > 0
        );
        setPrompts(activePrompts);
      } else {
        setPrompts([]);
      }
    } catch (error) {
      setPrompts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();

    // Refresh prompts periodically
    refreshTimerRef.current = setInterval(fetchPrompts, REFRESH_INTERVAL);

    // Listen for admin updates
    const socket = getSocket();
    if (socket) {
      const handlePromptUpdate = () => {
        fetchPrompts();
      };
      socket.on('icebreakers:updated', handlePromptUpdate);
      return () => {
        socket.off('icebreakers:updated', handlePromptUpdate);
        if (refreshTimerRef.current) {
          clearInterval(refreshTimerRef.current);
        }
      };
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, []);

  const handlePromptClick = (prompt, event) => {
    // Store reference to the button that was clicked
    lastFocusedButtonRef.current = event?.currentTarget || null;
    setSelectedPrompt(prompt);
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    if (!selectedPrompt) return;

    setSending(selectedPrompt.id);
    setShowConfirm(false);

    try {
      // Send icebreaker message (FREE - no coin deduction)
      const response = await api.post('/chat/icebreaker/send', {
        matchId: groupId ? null : matchId,
        groupId: groupId || null,
        promptId: selectedPrompt.id,
        promptText: selectedPrompt.question,
      });

      if (response.data.success) {
        // Optimistically update UI
        const newMessage = response.data.data || response.data.message;
        if (onMessageSent) {
          onMessageSent(newMessage);
        }

        toast.success('Ice-breaker sent!', {
          duration: 2000,
          position: 'bottom-center',
        });
      } else {
        throw new Error(response.data.message || 'Failed to send ice-breaker');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send ice-breaker';

      if (errorMessage.includes('rate limit')) {
        toast.error(errorMessage, { duration: 3000 });
      } else {
        toast.error(errorMessage, { duration: 3000 });
      }
    } finally {
      setSending(null);
      setSelectedPrompt(null);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setSelectedPrompt(null);
  };

  // Handle ESC key and focus trap for modal
  useEffect(() => {
    if (!showConfirm) return;

    // Prevent background scrolling
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };

    // Trap focus in modal
    const modalElement = modalRef.current;
    if (modalElement) {
      const focusableElements = modalElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      const handleTabKey = (e) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      };

      modalElement.addEventListener('keydown', handleTabKey);
      window.addEventListener('keydown', handleEsc);

      // Focus first element after a brief delay
      setTimeout(() => {
        firstElement?.focus();
      }, 100);

      return () => {
        document.body.style.overflow = originalOverflow;
        modalElement.removeEventListener('keydown', handleTabKey);
        window.removeEventListener('keydown', handleEsc);
        // Restore focus to the button that opened the modal
        setTimeout(() => {
          lastFocusedButtonRef.current?.focus();
        }, 100);
      };
    }

      window.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleEsc);
        setTimeout(() => {
          lastFocusedButtonRef.current?.focus();
        }, 100);
      };
  }, [showConfirm]);

  if (loading || prompts.length === 0) {
    return null;
  }

  return (
    <>
      <div className="px-4 py-3 bg-white border-t border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide" ref={scrollContainerRef} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {prompts.map((prompt) => (
            <motion.button
              key={prompt.id}
              onClick={(e) => handlePromptClick(prompt, e)}
              disabled={sending === prompt.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-full shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={`Send ice-breaker: "${prompt.question}" (Free)`}
            >
              <span className="text-sm font-medium text-gray-800 truncate max-w-[200px]">
                {prompt.question}
              </span>
              <div className="flex items-center gap-1 px-2 py-0.5 bg-green-100 rounded-full border border-green-300">
                <span className="text-xs font-bold text-green-700">Free</span>
              </div>
              {sending === prompt.id && (
                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              )}
            </motion.button>
          ))}
          {/* Scroll indicator */}
          <div className="flex-shrink-0 flex items-center px-2 text-gray-400">
            <ChevronRightIcon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Confirmation Modal - Rendered via Portal to document.body for proper centering */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showConfirm && selectedPrompt && (
            <>
              {/* Backdrop - Full viewport coverage */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleCancel}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 10000,
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)'
                }}
              />
              {/* Modal Content - Centered using transform */}
              <div
                style={{
                  position: 'fixed',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10001,
                  width: '100%',
                  maxWidth: '28rem',
                  padding: '1rem',
                  pointerEvents: 'auto'
                }}
              >
                <motion.div
                  ref={modalRef}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="modal-title"
                  aria-describedby="modal-description"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-2xl shadow-2xl w-full p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 id="modal-title" className="text-xl font-bold text-black">
                      Send Ice-Breaker?
                    </h3>
                  </div>
                  <p id="modal-description" className="text-gray-600 mb-6" aria-live="polite">
                    "{selectedPrompt.question}"
                  </p>
                  <div className="flex gap-3">
                    <motion.button
                      onClick={handleCancel}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      onClick={handleConfirm}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={sending === selectedPrompt.id}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {sending === selectedPrompt.id ? 'Sending...' : 'Yes'}
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

