/**
 * Video Player Component
 * Uses expo-av for direct video playback or iframe embed for YouTube
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Text } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus, AVPlaybackSource } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

interface VideoPlayerProps {
  videoUrl: string;
  onComplete?: () => void;
  onProgress?: (percent: number) => void;
}

// Helper to detect YouTube URLs and extract video ID
function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

// Simple YouTube Player using iframe (works reliably on web)
function YouTubePlayer({ videoId, onComplete }: { videoId: string; onComplete?: () => void }) {
  const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="logo-youtube" size={48} color="#FF0000" />
        <Text style={styles.errorText}>YouTube videos are best viewed on web</Text>
        <Text style={styles.errorSubtext}>Video ID: {videoId}</Text>
      </View>
    );
  }

  // Use dangerouslySetInnerHTML to bypass React Native Web's View limitations
  return (
    <div 
      style={{
        width: '100%',
        height: '100%',
        minHeight: 400,
        backgroundColor: '#000',
      }}
      dangerouslySetInnerHTML={{
        __html: `<iframe 
          src="${embedUrl}" 
          style="width: 100%; height: 100%; border: none; min-height: 400px;"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          title="Video lesson"
        ></iframe>`
      }}
    />
  );
}

export function VideoPlayer({ videoUrl, onComplete, onProgress }: VideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Check if this is a YouTube URL
  const youtubeVideoId = getYouTubeVideoId(videoUrl);

  useEffect(() => {
    // Hide controls after 3 seconds of inactivity
    if (showControls && isPlaying) {
      const timer = setTimeout(() => setShowControls(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showControls, isPlaying]);

  const handlePlaybackStatusUpdate = (playbackStatus: AVPlaybackStatus) => {
    setStatus(playbackStatus);

    if (!playbackStatus.isLoaded) {
      setIsLoading(true);
      return;
    }

    setIsLoading(false);
    setIsPlaying(playbackStatus.isPlaying);

    // Calculate progress percentage
    if (playbackStatus.durationMillis && playbackStatus.positionMillis) {
      const percent = (playbackStatus.positionMillis / playbackStatus.durationMillis) * 100;
      onProgress?.(percent);
    }

    // Check if video completed
    if (playbackStatus.didJustFinish) {
      onComplete?.();
    }
  };

  const togglePlayPause = async () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
    setShowControls(true);
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!videoUrl) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="videocam-off-outline" size={48} color="#94A3B8" />
          <Text style={styles.errorText}>No video URL provided</Text>
        </View>
      </View>
    );
  }

  // If it's a YouTube URL, use the simple YouTube player
  if (youtubeVideoId) {
    return (
      <View style={styles.container}>
        <YouTubePlayer videoId={youtubeVideoId} onComplete={onComplete} />
      </View>
    );
  }

  // Otherwise, use expo-av for direct video files
  const duration = status?.isLoaded ? status.durationMillis : 0;
  const position = status?.isLoaded ? status.positionMillis : 0;
  const progress = duration > 0 ? position / duration : 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.videoContainer}
        activeOpacity={1}
        onPress={() => setShowControls(!showControls)}
      >
        <Video
          ref={videoRef}
          style={styles.video}
          source={{ uri: videoUrl } as AVPlaybackSource}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={false}
          isLooping={false}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          useNativeControls={Platform.OS !== 'web'}
        />

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        )}

        {/* Custom controls for web */}
        {Platform.OS === 'web' && showControls && (
          <View style={styles.controlsOverlay}>
            <View style={styles.controlsBar}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={togglePlayPause}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={32}
                  color="#FFFFFF"
                />
              </TouchableOpacity>

              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                </View>
                <View style={styles.timeContainer}>
                  <Text style={styles.timeText}>{formatTime(position)}</Text>
                  <Text style={styles.timeText}>{formatTime(duration)}</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  youtubeWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    minHeight: 300,
    backgroundColor: '#000',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  controlButton: {
    padding: 8,
  },
  progressContainer: {
    flex: 1,
    gap: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 12,
    color: '#64748B',
  },
});
