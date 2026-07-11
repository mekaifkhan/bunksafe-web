import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Image as ImageIcon, 
  Trash2, 
  X, 
  RotateCw, 
  Check, 
  FlipHorizontal,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar?: string;
  onSave: (avatarDataUrl: string | null) => void;
  profileName?: string;
}

type Mode = 'menu' | 'camera' | 'preview';

export default function AvatarPickerModal({
  isOpen,
  onClose,
  currentAvatar,
  onSave,
  profileName = 'User'
}: AvatarPickerModalProps) {
  const [mode, setMode] = useState<Mode>('menu');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Check if multiple cameras exist
  useEffect(() => {
    if (isOpen && mode === 'camera') {
      navigator.mediaDevices?.enumerateDevices()
        .then(devices => {
          const videoDevices = devices.filter(d => d.kind === 'videoinput');
          setHasMultipleCameras(videoDevices.length > 1);
        })
        .catch(() => {
          setHasMultipleCameras(false);
        });
    }
  }, [isOpen, mode]);

  // Clean up stream on unmount or mode change
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async (currentFacing = facingMode) => {
    stopCamera();
    setIsCameraLoading(true);
    setCameraError(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: currentFacing,
          width: { ideal: 640 },
          height: { ideal: 640 }
        },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Need to play after setting srcObject
        await videoRef.current.play();
      }
      setIsCameraLoading(false);
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      setIsCameraLoading(false);
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera access denied. Please grant permission in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device.');
      } else {
        setCameraError('Could not start camera. Please make sure no other app is using it.');
      }
    }
  };

  const handleCameraClick = async () => {
    setMode('camera');
    // Allow UI transition to mount video element first
    setTimeout(() => {
      startCamera(facingMode);
    }, 100);
  };

  const handleFlipCamera = () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  const handleCapture = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    
    // We want a square crop for the avatar
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const size = Math.min(videoWidth, videoHeight);
    
    canvas.width = size;
    canvas.height = size;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Horizontal mirroring for front camera user experience
      if (facingMode === 'user') {
        ctx.translate(size, 0);
        ctx.scale(-1, 1);
      }
      
      // Calculate coordinates to center-crop the video frame
      const sx = (videoWidth - size) / 2;
      const sy = (videoHeight - size) / 2;
      
      ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);
      setMode('preview');
      stopCamera();
    }
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCapturedImage(result);
        setMode('preview');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (capturedImage) {
      onSave(capturedImage);
      handleClose();
    }
  };

  const handleRemove = () => {
    if (window.confirm('Are you sure you want to remove your profile picture?')) {
      onSave(null);
      handleClose();
    }
  };

  const handleClose = () => {
    stopCamera();
    setMode('menu');
    setCapturedImage(null);
    setCameraError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.95, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 20, opacity: 0 }}
          className="relative bg-zinc-950 border border-zinc-850 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-4 border-b border-zinc-900 flex items-center justify-between">
            <h3 className="font-black text-sm uppercase tracking-wider text-zinc-300">
              {mode === 'menu' && 'Set Profile Picture'}
              {mode === 'camera' && 'Take Profile Photo'}
              {mode === 'preview' && 'Preview Photo'}
            </h3>
            <button
              onClick={handleClose}
              className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 flex flex-col items-center justify-center min-h-[250px] overflow-y-auto">
            
            {/* hidden gallery input */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />

            {mode === 'menu' && (
              <div className="w-full flex flex-col items-center gap-6">
                {/* Avatar Preview */}
                <div className="w-24 h-24 rounded-full bg-primary border-4 border-zinc-900 shadow-xl overflow-hidden flex items-center justify-center text-3xl font-black text-white">
                  {currentAvatar ? (
                    <img src={currentAvatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    profileName.charAt(0).toUpperCase()
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 w-full">
                  <button
                    onClick={handleGalleryClick}
                    className="flex items-center justify-center gap-3 w-full bg-zinc-900 hover:bg-zinc-850 text-zinc-100 font-bold py-3.5 px-4 rounded-xl border border-zinc-800 transition-all text-sm active:scale-[0.98]"
                  >
                    <ImageIcon className="text-primary" size={18} />
                    Choose from Gallery
                  </button>

                  <button
                    onClick={handleCameraClick}
                    className="flex items-center justify-center gap-3 w-full bg-zinc-900 hover:bg-zinc-850 text-zinc-100 font-bold py-3.5 px-4 rounded-xl border border-zinc-800 transition-all text-sm active:scale-[0.98]"
                  >
                    <Camera className="text-primary" size={18} />
                    Capture with Camera
                  </button>

                  {currentAvatar && (
                    <button
                      onClick={handleRemove}
                      className="flex items-center justify-center gap-3 w-full bg-red-950/20 hover:bg-red-950/40 text-red-400 font-bold py-3.5 px-4 rounded-xl border border-red-900/40 transition-all text-sm active:scale-[0.98]"
                    >
                      <Trash2 size={18} />
                      Remove Current Picture
                    </button>
                  )}
                </div>
              </div>
            )}

            {mode === 'camera' && (
              <div className="w-full flex flex-col items-center">
                <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-primary/30 bg-black flex items-center justify-center shadow-inner">
                  
                  {isCameraLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 text-zinc-400 gap-2">
                      <Loader2 className="animate-spin text-primary" size={28} />
                      <span className="text-xs font-bold tracking-wider">Starting camera...</span>
                    </div>
                  )}

                  {cameraError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 text-center p-4 gap-3">
                      <AlertTriangle className="text-amber-500" size={32} />
                      <p className="text-xs text-zinc-400 font-medium leading-relaxed">{cameraError}</p>
                      <button
                        onClick={handleGalleryClick}
                        className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg"
                      >
                        Use Gallery Instead
                      </button>
                    </div>
                  )}

                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                    style={{ display: cameraError ? 'none' : 'block' }}
                  />

                  {/* Aesthetic Circular Scanner Ring Overlay */}
                  {!isCameraLoading && !cameraError && (
                    <div className="absolute inset-0 border-2 border-dashed border-primary/20 rounded-full animate-spin-slow pointer-events-none" />
                  )}
                </div>

                {/* Camera Actions */}
                {!cameraError && (
                  <div className="flex items-center justify-center gap-6 mt-6 w-full">
                    <button
                      onClick={() => {
                        stopCamera();
                        setMode('menu');
                      }}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-black rounded-xl transition-all"
                    >
                      Back
                    </button>

                    <button
                      onClick={handleCapture}
                      disabled={isCameraLoading}
                      className="w-16 h-16 rounded-full bg-zinc-900 hover:bg-zinc-800 border-4 border-primary shadow-lg flex items-center justify-center text-white active:scale-90 transition-all disabled:opacity-50"
                      title="Capture Photo"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary" />
                    </button>

                    {hasMultipleCameras ? (
                      <button
                        onClick={handleFlipCamera}
                        disabled={isCameraLoading}
                        className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl transition-all active:scale-95"
                        title="Switch Camera"
                      >
                        <FlipHorizontal size={18} />
                      </button>
                    ) : (
                      <div className="w-11" /> // Spacer
                    )}
                  </div>
                )}
              </div>
            )}

            {mode === 'preview' && capturedImage && (
              <div className="w-full flex flex-col items-center">
                <div className="w-64 h-64 rounded-full overflow-hidden border-4 border-green-500/30 shadow-xl bg-zinc-900">
                  <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                </div>

                <div className="flex items-center gap-4 mt-8 w-full">
                  <button
                    onClick={() => {
                      setCapturedImage(null);
                      if (streamRef.current) {
                        setMode('camera');
                      } else {
                        handleCameraClick();
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 font-bold py-3 px-4 rounded-xl transition-all text-sm active:scale-95"
                  >
                    <RotateCw size={16} />
                    Retake
                  </button>

                  <button
                    onClick={handleSave}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-black py-3 px-4 rounded-xl shadow-lg shadow-primary/20 transition-all text-sm active:scale-95"
                  >
                    <Check size={16} />
                    Save & Set
                  </button>
                </div>
              </div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
