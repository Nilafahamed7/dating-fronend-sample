import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CameraIcon, XMarkIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { profileService } from '../../services/profileService';
import toast from 'react-hot-toast';
import LoadingSpinner from '../common/LoadingSpinner';

export default function CameraVerification({ onSuccess, onCancel, isPending = false }) {
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('instructions'); // 'instructions' | 'camera' | 'preview' | 'success'

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Callback ref to handle video element mounting
  const onVideoRef = useCallback((node) => {
    videoRef.current = node;
    if (node && stream) {
      node.srcObject = stream;
      node.play().catch(e => console.error("Error playing video:", e));
    }
  }, [stream]);

  const startCamera = async () => {
    try {
      setError(null);

      // Request camera access with specific constraints
      // facingMode: 'user' prefers the front camera (webcam on laptops)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false,
      });

      setStream(mediaStream);
      setStep('camera');

    } catch (err) {
      console.error('Camera error:', err);
      setError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera permission denied. Please enable camera access in your browser settings and try again.'
          : err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError'
            ? 'No camera found. Please connect a camera and try again.'
            : 'Failed to access camera. Please check your camera settings and try again.'
      );
      setStep('instructions');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const imageUrl = URL.createObjectURL(blob);
        setCapturedImage({ blob, url: imageUrl });
        setStep('preview');

        // Stop camera stream
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
      }
    }, 'image/jpeg', 0.9);
  };

  const retakePhoto = () => {
    if (capturedImage?.url) {
      URL.revokeObjectURL(capturedImage.url);
    }
    setCapturedImage(null);
    setStep('camera');
    startCamera();
  };

  const submitVerification = async () => {
    if (!capturedImage?.blob) return;

    try {
      setIsUploading(true);
      setError(null);

      // Create FormData with the captured image
      const formData = new FormData();
      formData.append('media', capturedImage.blob, 'verification-selfie.jpg');
      formData.append('type', 'photo');

      // Add metadata to indicate this is from camera
      formData.append('source', 'camera');
      formData.append('timestamp', new Date().toISOString());

      // Upload to backend
      const response = await profileService.uploadVerificationPhoto(formData);

      if (response.success) {
        setStep('success');
        toast.success('We received your selfie. Our team will review it shortly.');

        // Cleanup
        if (capturedImage.url) {
          URL.revokeObjectURL(capturedImage.url);
        }

        // Call success callback after a delay
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          }
        }, 1500);
      } else {
        throw new Error(response.message || 'Failed to submit verification');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to submit verification. Please try again.');
      toast.error(err.response?.data?.message || err.message || 'Failed to submit verification');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    // Stop camera stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    // Cleanup captured image
    if (capturedImage?.url) {
      URL.revokeObjectURL(capturedImage.url);
    }

    if (onCancel) {
      onCancel();
    }
  };

  if (isPending) {
    return (
      <div className="bg-gradient-to-r from-yellow-50 via-yellow-50/50 to-white rounded-3xl shadow-xl p-6 border-2 border-yellow-200">
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
            <CameraIcon className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-bold text-black mb-2">Verification Pending</h3>
          <p className="text-sm text-gray-600 mb-4">
            Your verification request is being reviewed by our team.
          </p>
          <span className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
            Pending Review
          </span>
        </div>
      </div>
    );
  }

  // Modal Overlay
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative"
      >
        {/* Close Button (Top Right) */}
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/30 rounded-full text-white transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Instructions Step */}
            {step === 'instructions' && (
              <motion.div
                key="instructions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                  <CameraIcon className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-2xl font-bold text-black mb-2">Verify Your Profile</h3>
                <p className="text-gray-600 mb-6">
                  Take a clear selfie to verify your identity. Make sure your face is clearly visible.
                </p>
                <div className="space-y-3 mb-6 text-left bg-gray-50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">Center your face in the frame</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">Remove sunglasses and hats</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">Ensure good lighting</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">Look directly at the camera</p>
                  </div>
                </div>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={startCamera}
                    className="flex-1 px-4 py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2 shadow-lg"
                  >
                    <CameraIcon className="w-5 h-5" />
                    Open Camera
                  </button>
                </div>
              </motion.div>
            )}

            {/* Camera Step */}
            {step === 'camera' && (
              <motion.div
                key="camera"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="relative bg-black rounded-2xl overflow-hidden aspect-[3/4]">
                  <video
                    ref={onVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
                  />
                  {/* Face frame overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-64 border-2 border-white/50 rounded-[40%] shadow-2xl" />
                  </div>
                  {/* Instructions overlay */}
                  <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                    <p className="text-white text-sm font-medium bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full inline-block">
                      Center your face in the frame
                    </p>
                  </div>
                </div>
                <canvas ref={canvasRef} className="hidden" />
                <div className="flex gap-3">
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={capturePhoto}
                    className="flex-1 px-4 py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2 shadow-lg"
                  >
                    <CameraIcon className="w-5 h-5" />
                    Take Selfie
                  </button>
                </div>
              </motion.div>
            )}

            {/* Preview Step */}
            {step === 'preview' && (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="relative bg-black rounded-2xl overflow-hidden aspect-[3/4]">
                  {capturedImage?.url && (
                    <img
                      src={capturedImage.url}
                      alt="Captured selfie"
                      className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
                    />
                  )}
                </div>
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={retakePhoto}
                    disabled={isUploading}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <ArrowPathIcon className="w-5 h-5" />
                    Retake
                  </button>
                  <button
                    onClick={submitVerification}
                    disabled={isUploading}
                    className="flex-1 px-4 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                  >
                    {isUploading ? (
                      <>
                        <LoadingSpinner size="sm" color="white" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-5 h-5" />
                        Submit Verification
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Success Step */}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                  <CheckCircleIcon className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-black mb-2">Submitted!</h3>
                <p className="text-gray-600">
                  We received your selfie. Redirecting you to home...
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
