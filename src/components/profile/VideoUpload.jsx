import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { videoProfileService } from '../../services/videoProfileService';
import toast from 'react-hot-toast';
import {
  VideoCameraIcon,
  XMarkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import LoadingSpinner from '../common/LoadingSpinner';

const MAX_DURATION = 30; // seconds
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_FORMATS = ['video/mp4', 'video/quicktime', 'video/mov', 'video/webm'];

export default function VideoUpload({ user, onVideoUploaded, existingVideo }) {
  const [videoFile, setVideoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [caption, setCaption] = useState(existingVideo?.caption || '');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  // Check if user is allowed to upload (Premium users or Females)
  const isFemale = user?.gender?.toLowerCase() === 'female';
  const canUpload = user?.isPremium || isFemale;

  const handleFileSelect = (file) => {
    if (!canUpload) return;

    // Validate file type
    if (!ALLOWED_FORMATS.includes(file.type)) {
      toast.error('Only MP4, MOV, or WebM video files are allowed');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`Video file must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
      return;
    }

    setVideoFile(file);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Get video duration
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(url);
      const duration = video.duration;
      if (duration > MAX_DURATION) {
        toast.error(`Video must be ${MAX_DURATION} seconds or less`);
        setVideoFile(null);
        setPreviewUrl(null);
        return;
      }
    };
    video.src = url;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canUpload) return;

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (!canUpload) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!videoFile) {
      toast.error('Please select a video file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress (in real app, use axios onUploadProgress)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const duration = await new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          resolve(video.duration);
        };
        video.src = URL.createObjectURL(videoFile);
      });

      const response = await videoProfileService.uploadVideo(
        videoFile,
        Math.ceil(duration),
        caption || undefined
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success) {
        toast.success('Video uploaded successfully! It will be available after approval.');
        setVideoFile(null);
        setPreviewUrl(null);
        if (onVideoUploaded) {
          onVideoUploaded(response);
        }
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to upload video');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!existingVideo?.videoId) return;

    if (!window.confirm('Are you sure you want to delete this video?')) {
      return;
    }

    try {
      await videoProfileService.deleteVideoProfile(existingVideo.videoId);
      toast.success('Video deleted successfully');
      if (onVideoUploaded) {
        onVideoUploaded(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete video');
    }
  };

  const handleRemove = () => {
    setVideoFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusBadge = () => {
    if (!existingVideo) return null;

    const status = existingVideo.status;
    if (status === 'approved') {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckBadgeIcon className="w-5 h-5" />
          <span className="text-sm font-medium">Approved</span>
        </div>
      );
    } else if (status === 'pending') {
      return (
        <div className="flex items-center gap-2 text-yellow-600">
          <ClockIcon className="w-5 h-5" />
          <span className="text-sm font-medium">Pending Review</span>
        </div>
      );
    } else if (status === 'rejected') {
      return (
        <div className="flex items-center gap-2 text-red-600">
          <ExclamationTriangleIcon className="w-5 h-5" />
          <span className="text-sm font-medium">Rejected</span>
          {existingVideo.rejectionReason && (
            <span className="text-xs text-gray-600">({existingVideo.rejectionReason})</span>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <VideoCameraIcon className="w-6 h-6 text-yellow-600" />
            </div>
            Profile Video
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Upload a short video (max {MAX_DURATION}s, {MAX_FILE_SIZE / (1024 * 1024)}MB) to showcase yourself
          </p>
        </div>
        {existingVideo && getStatusBadge()}
      </div>

      {/* Existing Video Display */}
      {existingVideo && existingVideo.videoUrl && !videoFile && (
        <div className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200">
          <video
            ref={videoRef}
            src={existingVideo.videoUrl}
            className="w-full h-auto max-h-96"
            controls
            poster={existingVideo.thumbnailUrl}
          />
          <div className="absolute top-2 right-2">
            <button
              onClick={handleDelete}
              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Upload Area */}
      {!existingVideo?.videoUrl && (
        <>
          {canUpload ? (
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${dragActive
                  ? 'border-yellow-500 bg-yellow-50 scale-[1.02]'
                  : 'border-yellow-200 bg-yellow-50/30 hover:border-yellow-400 hover:bg-yellow-50'
                }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {!videoFile ? (
                <>
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <VideoCameraIcon className="w-8 h-8 text-yellow-600" />
                  </div>
                  <p className="text-gray-900 font-medium mb-2">
                    Drag and drop a video here, or click to select
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    MP4, MOV, or WebM • Max {MAX_DURATION}s • Max {MAX_FILE_SIZE / (1024 * 1024)}MB
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2.5 bg-yellow-500 text-black font-semibold rounded-xl hover:bg-yellow-600 transition-colors shadow-md hover:shadow-lg"
                  >
                    Select Video
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/quicktime,video/mov,video/webm"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden bg-black shadow-lg">
                    <video
                      src={previewUrl}
                      className="w-full h-auto max-h-64"
                      controls
                    />
                    <button
                      onClick={handleRemove}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                      Caption (optional)
                    </label>
                    <input
                      type="text"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      maxLength={200}
                      placeholder="Add a caption to your video..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-1 text-right">{caption.length}/200</p>
                  </div>
                  {uploading ? (
                    <div className="space-y-2">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-yellow-500 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 font-medium">
                        Uploading... {uploadProgress}%
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={handleUpload}
                      className="w-full px-6 py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-600 transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                      <VideoCameraIcon className="w-5 h-5" />
                      Upload Video
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <VideoCameraIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Video Profile is a Premium Feature</h4>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Upgrade to Premium to upload a profile video and stand out from the crowd!
              </p>
              <a
                href="/premium"
                className="inline-flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold rounded-xl hover:from-yellow-600 hover:to-yellow-700 transition-all shadow-md hover:shadow-lg"
              >
                Upgrade to Premium
              </a>
            </div>
          )}
        </>
      )}

      {/* Guidelines */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <p className="text-sm text-yellow-800 font-bold mb-2 flex items-center gap-2">
          <ExclamationTriangleIcon className="w-4 h-4" />
          Video Guidelines:
        </p>
        <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside ml-1">
          <li>Keep it appropriate and respectful</li>
          <li>No nudity or explicit content</li>
          <li>Show your personality and interests</li>
          <li>Good lighting and clear audio recommended</li>
        </ul>
      </div>
    </div>
  );
}




