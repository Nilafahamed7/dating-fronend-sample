import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  EllipsisVerticalIcon,
  NoSymbolIcon,
  FlagIcon,
  ExclamationTriangleIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { matchService } from '../../services/matchService';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useNavBarContext } from '../common/GlobalNavBar';

export default function ChatOptionsMenu({ otherUser, matchId, showViewProfile = false }) {
  const { setShowLeftSidebar } = useNavBarContext();
  const [isOpen, setIsOpen] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 72, right: 16 });
  const [isMobile, setIsMobile] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();

  // Track if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update menu position when it opens
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const navbarHeight = 64;
      setMenuPosition({
        top: navbarHeight + 8,
        right: Math.max(16, window.innerWidth - rect.right - 8)
      });
    }
  }, [isOpen]);

  // Close menu when clicking outside or pressing Esc
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) &&
          !buttonRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleBlock = async () => {
    try {
      setLoading(true);
      const userId = otherUser._id || otherUser.userId;
      if (!userId) {
        toast.error('User ID not found');
        setLoading(false);
        return;
      }

      const reason = blockReason?.trim() || 'Blocked from chat';
      const response = await matchService.blockUser(userId, reason);

      if (response && response.success) {
        toast.success(response.message || 'User blocked successfully');
        setShowBlockModal(false);
        setBlockReason('');
        setIsOpen(false);
        // Navigate back after a short delay
        setTimeout(() => {
          navigate('/chat');
        }, 500);
      } else {
        toast.error(response?.message || 'Failed to block user');
      }
    } catch (error) {
      // Handle validation errors
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        const errorMessages = Array.isArray(validationErrors)
          ? validationErrors.map(e => e.msg || e.message).join(', ')
          : Object.values(validationErrors).flat().map(e => e.msg || e.message).join(', ');
        toast.error(errorMessages || 'Validation error');
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to block user';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) {
      toast.error('Please select a reason for reporting');
      return;
    }

    try {
      setLoading(true);
      const userId = otherUser._id || otherUser.userId;

      if (!userId) {
        toast.error('User ID not found');
        setLoading(false);
        return;
      }

      const response = await matchService.reportUser(
        userId,
        reportReason.trim(),
        reportDetails?.trim() || ''
      );

      if (response && response.success) {
        toast.success(response.message || 'Report submitted successfully');
        setShowReportModal(false);
        setReportReason('');
        setReportDetails('');
        setIsOpen(false);
      } else {
        toast.error(response?.message || 'Failed to report user');
      }
    } catch (error) {
      // Handle validation errors
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        const errorMessages = Array.isArray(validationErrors)
          ? validationErrors.map(e => e.msg || e.message).join(', ')
          : Object.values(validationErrors).flat().map(e => e.msg || e.message).join(', ');
        toast.error(errorMessages || 'Validation error');
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to report user';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        {showViewProfile ? (
          <button
            ref={buttonRef}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="px-4 py-2 text-velora-primary text-sm font-semibold hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            type="button"
            aria-label="View Profile and options"
            aria-expanded={isOpen}
            aria-haspopup="true"
          >
            <span>View Profile</span>
            <EllipsisVerticalIcon className="w-5 h-5 text-gray-600" />
          </button>
        ) : (
          <button
            ref={buttonRef}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Always open dropdown menu (both mobile and desktop)
              setIsOpen(!isOpen);
            }}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            type="button"
            aria-label="Chat options"
            aria-expanded={isOpen}
            aria-haspopup="true"
          >
            <EllipsisVerticalIcon className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
          </button>
        )}
      </div>

      {/* Render dropdown using portal to escape navbar overflow */}
      {isOpen && createPortal(
        <>
          {/* Backdrop - no animation needed */}
          <div
            className="fixed inset-0 z-[99999]"
            onClick={() => setIsOpen(false)}
            style={{ backgroundColor: 'transparent' }}
          />
          {/* Dropdown menu with animation */}
          <AnimatePresence>
            <motion.div
              key="dropdown-menu"
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="fixed w-48 bg-white rounded-lg shadow-2xl border-2 border-gray-300 py-2 z-[100000]"
              style={{
                top: `${menuPosition.top}px`,
                right: `${menuPosition.right}px`,
                position: 'fixed',
                zIndex: 100000,
                maxWidth: 'calc(100vw - 32px)'
              }}
              onClick={(e) => e.stopPropagation()}
              role="menu"
              aria-label="Chat options menu"
            >
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const userId = otherUser._id || otherUser.userId;
                  if (userId) {
                    navigate(`/profile/${userId}`);
                  }
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                type="button"
                role="menuitem"
              >
                <UserCircleIcon className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700">View Profile</span>
              </button>

              <div className="border-t border-gray-200 my-1"></div>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsOpen(false);
                  setTimeout(() => {
                    setShowBlockModal(true);
                  }, 100);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                type="button"
                role="menuitem"
              >
                <NoSymbolIcon className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700">Block user</span>
              </button>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsOpen(false);
                  setTimeout(() => {
                    setShowReportModal(true);
                  }, 100);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                type="button"
                role="menuitem"
              >
                <FlagIcon className="w-5 h-5 text-orange-500" />
                <span className="text-gray-700">Report user</span>
              </button>
            </motion.div>
          </AnimatePresence>
        </>,
        document.body
      )}

      {/* Block Confirmation Modal */}
      {showBlockModal && createPortal(
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100000]"
          onClick={() => {
            if (!loading) {
              setShowBlockModal(false);
              setBlockReason('');
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            style={{ zIndex: 100001 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Block User?
            </h3>

            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to block <span className="font-semibold text-gray-900">{otherUser.name || 'this user'}</span>?
              <br />
              You won't be able to message each other after blocking.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (optional)
              </label>
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Why are you blocking this user?"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows="3"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBlockModal(false);
                  setBlockReason('');
                }}
                disabled={loading}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBlock}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 shadow-lg shadow-red-500/30"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Blocking...
                  </span>
                ) : (
                  'Yes, Block User'
                )}
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}

      {/* Report Confirmation Modal */}
      {showReportModal && createPortal(
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100000] p-4"
          onClick={() => {
            if (!loading) {
              setShowReportModal(false);
              setReportReason('');
              setReportDetails('');
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <FlagIcon className="w-8 h-8 text-orange-600" />
              </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Report User?
            </h3>

            <p className="text-gray-600 text-center mb-6">
              Help us understand what's wrong with <span className="font-semibold text-gray-900">{otherUser.name || 'this user'}</span>.
              <br />
              Our team will review your report.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason <span className="text-red-500">*</span>
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Select a reason</option>
                <option value="Inappropriate behavior">Inappropriate behavior</option>
                <option value="Harassment">Harassment</option>
                <option value="Spam or scam">Spam or scam</option>
                <option value="Fake profile">Fake profile</option>
                <option value="Underage">Underage</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional details (optional)
              </label>
              <textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Provide more information..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                rows="3"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                  setReportDetails('');
                }}
                disabled={loading}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                disabled={loading || !reportReason.trim()}
                className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 shadow-lg shadow-orange-500/30"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Reporting...
                  </span>
                ) : (
                  'Yes, Report User'
                )}
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </>
  );
}
