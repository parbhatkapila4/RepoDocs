"use client";
import  { useRef, useEffect, useState, useCallback } from "react";
import { X, Play } from "lucide-react";

interface VideoModalProps {
  videoSrc: string;
  isOpen: boolean;
  onClose: () => void;
}

export function VideoModal({ videoSrc, isOpen, onClose }: VideoModalProps) {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const closeVideoModal = useCallback(() => {
    onClose();
    setIsVideoLoaded(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [onClose]);

  const handlePlayClick = () => {
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.error("Error playing video:", error);
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsVideoLoaded(false);
      
      
      const timer = setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.load();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      setIsVideoLoaded(false);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isOpen, videoSrc]);

  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          closeVideoModal();
        }
      };
      
      document.addEventListener('keydown', handleEsc);
      
      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleEsc);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, closeVideoModal]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm" onClick={closeVideoModal}>
      <div
        className="relative flex w-full max-w-4xl items-center justify-center bg-black/95 rounded-2xl overflow-hidden border border-white/20 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full">
          <button
            onClick={closeVideoModal}
            className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/70 text-white hover:bg-black/90 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Close video modal"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
          
          {!isVideoLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20 rounded-2xl">
              <button
                onClick={handlePlayClick}
                className="p-4 rounded-full bg-white/30 hover:bg-white/40 transition-colors duration-300 cursor-pointer"
                aria-label="Play video"
                type="button"
              >
                <Play className="w-12 h-12 text-white" />
              </button>
            </div>
          )}

          <video
            ref={videoRef}
            src={videoSrc}
            controls
            preload="metadata"
            playsInline
            className="mx-auto w-full h-auto max-h-[80vh] rounded-2xl bg-black"
            onLoadedData={() => {
              setIsVideoLoaded(true);
            }}
            onCanPlay={() => {
              setIsVideoLoaded(true);
            }}
            onCanPlayThrough={() => {
              setIsVideoLoaded(true);
            }}
            onPlay={() => {
              setIsVideoLoaded(true);
            }}
            onEnded={closeVideoModal}
            onError={(e) => {
              console.error("Video error:", e);
              const target = e.target as HTMLVideoElement;
              console.error("Video error details:", {
                error: target.error?.code,
                errorMessage: target.error?.message,
                networkState: target.networkState,
                readyState: target.readyState,
                src: target.src,
                currentSrc: target.currentSrc
              });
              setIsVideoLoaded(true);
            }}
            onLoadStart={() => {
              setIsVideoLoaded(false);
            }}
            onLoadedMetadata={() => {
              
            }}
          >
            <source src={videoSrc} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </div>
  );
}
