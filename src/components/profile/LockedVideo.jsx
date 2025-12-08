import { LockClosedIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function LockedVideo({ thumbnailUrl, caption, onUnlock }) {
    return (
        <div className="relative rounded-lg overflow-hidden bg-gray-900 aspect-[9/16] sm:aspect-video group">
            {/* Blurred Background/Thumbnail */}
            {thumbnailUrl ? (
                <img
                    src={thumbnailUrl}
                    alt="Locked video"
                    className="w-full h-full object-cover blur-md scale-110 opacity-50 transition-transform duration-700 group-hover:scale-125"
                />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
            )}

            {/* Overlay Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/20 backdrop-blur-[2px]">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-4 border border-white/20 shadow-xl"
                >
                    <LockClosedIcon className="w-8 h-8 text-white" />
                </motion.div>

                <h3 className="text-xl font-bold text-white mb-2">
                    Private Video
                </h3>

                <p className="text-gray-200 text-sm mb-6 max-w-xs">
                    {onUnlock
                        ? "This video is locked. Unlock it to watch."
                        : "This user has a profile video. Upgrade to Premium to watch it and see more!"}
                </p>

                {onUnlock ? (
                    <button
                        onClick={onUnlock}
                        className="px-6 py-2.5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-semibold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-sm flex items-center gap-2"
                    >
                        <LockClosedIcon className="w-4 h-4" />
                        Unlock Video
                    </button>
                ) : (
                    <Link
                        to="/premium"
                        className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-sm"
                    >
                        Unlock Now
                    </Link>
                )}
            </div>

            {/* Caption Preview (optional, maybe blurred or hidden, but showing it might be teasing) */}
            {caption && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="h-4 w-3/4 bg-white/20 rounded animate-pulse mb-2"></div>
                </div>
            )}
        </div>
    );
}
