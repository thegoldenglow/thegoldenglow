import React, { useState, useEffect, useRef } from 'react';
import Icon from '../atoms/Icon';

const EmbeddedPostViewer = ({ postUrl, requiredViewingTime = 30, onViewingComplete, onClose }) => {
  const [viewingTime, setViewingTime] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const intervalRef = useRef(null);
  const observerRef = useRef(null);
  const containerRef = useRef(null);

  // Extract platform and embed URL from the post URL
  const getEmbedInfo = (url) => {
    if (!url) return { platform: 'unknown', embedUrl: '', isSupported: false };

    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    if (youtubeMatch) {
      return {
        platform: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=0&rel=0`,
        isSupported: true
      };
    }

    // Instagram
    const instagramMatch = url.match(/instagram\.com\/p\/([\w-]+)/);
    if (instagramMatch) {
      return {
        platform: 'instagram',
        embedUrl: `${url}embed/`,
        isSupported: true
      };
    }

    // TikTok
    const tiktokMatch = url.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/);
    if (tiktokMatch) {
      return {
        platform: 'tiktok',
        embedUrl: `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}`,
        isSupported: true
      };
    }

    // Twitter/X
    const twitterMatch = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
    if (twitterMatch) {
      return {
        platform: 'twitter',
        embedUrl: url,
        isSupported: true
      };
    }

    // Generic iframe support for other platforms
    return {
      platform: 'generic',
      embedUrl: url,
      isSupported: true
    };
  };

  const embedInfo = getEmbedInfo(postUrl);

  // Set up intersection observer to track visibility
  useEffect(() => {
    if (!containerRef.current) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting && entry.intersectionRatio > 0.5);
      },
      { threshold: 0.5 }
    );

    observerRef.current.observe(containerRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Track viewing time when visible
  useEffect(() => {
    if (isVisible && !isCompleted) {
      intervalRef.current = setInterval(() => {
        setViewingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= requiredViewingTime) {
            setIsCompleted(true);
            onViewingComplete && onViewingComplete(newTime);
            clearInterval(intervalRef.current);
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isVisible, isCompleted, requiredViewingTime, onViewingComplete]);

  const progressPercentage = Math.min(100, (viewingTime / requiredViewingTime) * 100);

  const renderEmbeddedContent = () => {
    if (!embedInfo.isSupported) {
      return (
        <div className="flex flex-col items-center justify-center h-64 bg-deepLapis/30 rounded-lg border border-royalGold/30">
          <Icon name="link" size={48} className="text-textLight/50 mb-4" />
          <p className="text-textLight/70 text-center mb-4">This platform is not supported for embedding</p>
          <a 
            href={postUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-royalGold/20 hover:bg-royalGold/30 text-textGold px-4 py-2 rounded transition-colors"
          >
            View Original Post
          </a>
        </div>
      );
    }

    switch (embedInfo.platform) {
      case 'youtube':
        return (
          <iframe
            src={embedInfo.embedUrl}
            className="w-full h-64 md:h-80 rounded-lg"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="YouTube video"
          />
        );
      
      case 'instagram':
        return (
          <iframe
            src={embedInfo.embedUrl}
            className="w-full h-64 md:h-80 rounded-lg"
            frameBorder="0"
            scrolling="no"
            allowtransparency="true"
            title="Instagram post"
          />
        );
      
      case 'tiktok':
        return (
          <iframe
            src={embedInfo.embedUrl}
            className="w-full h-64 md:h-80 rounded-lg"
            frameBorder="0"
            allow="encrypted-media"
            title="TikTok video"
          />
        );
      
      case 'twitter':
        return (
          <div className="w-full h-64 md:h-80 bg-deepLapis/30 rounded-lg border border-royalGold/30 flex items-center justify-center">
            <div className="text-center">
              <Icon name="twitter" size={48} className="text-textLight/50 mb-4 mx-auto" />
              <p className="text-textLight/70 mb-4">Twitter/X posts require external viewing</p>
              <a 
                href={postUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-royalGold/20 hover:bg-royalGold/30 text-textGold px-4 py-2 rounded transition-colors"
              >
                View Tweet
              </a>
            </div>
          </div>
        );
      
      default:
        return (
          <iframe
            src={embedInfo.embedUrl}
            className="w-full h-64 md:h-80 rounded-lg"
            frameBorder="0"
            title="Embedded content"
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-deepLapisDark rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-royalGold/30">
          <div>
            <h3 className="text-xl font-medium text-textGold">View Social Media Post</h3>
            <p className="text-sm text-textLight/70 mt-1">
              Watch for {requiredViewingTime} seconds to complete the task
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-textLight/50 hover:text-textLight transition-colors"
          >
            <Icon name="x" size={24} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b border-royalGold/30">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-textLight/70">Viewing Progress</span>
            <span className="text-sm text-textGold font-medium">
              {viewingTime}s / {requiredViewingTime}s
            </span>
          </div>
          <div className="relative h-2 bg-deepLapis rounded-full">
            <div 
              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
                isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-amber-500 to-textGold'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          {isCompleted && (
            <div className="flex items-center gap-2 mt-2 text-green-400">
              <Icon name="check" size={16} />
              <span className="text-sm font-medium">Task completed!</span>
            </div>
          )}
        </div>

        {/* Embedded Content */}
        <div ref={containerRef} className="p-6">
          {renderEmbeddedContent()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-royalGold/30 flex justify-between items-center">
          <div className="text-xs text-textLight/50">
            {isVisible ? (
              <span className="text-green-400">✓ Content is visible - timer active</span>
            ) : (
              <span className="text-amber-400">⚠ Scroll to make content visible</span>
            )}
          </div>
          <div className="flex gap-2">
            <a 
              href={postUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm bg-deepLapis/50 hover:bg-deepLapis text-textLight px-3 py-2 rounded transition-colors"
            >
              View Original
            </a>
            {isCompleted && (
              <button
                onClick={onClose}
                className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
              >
                Continue
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmbeddedPostViewer;