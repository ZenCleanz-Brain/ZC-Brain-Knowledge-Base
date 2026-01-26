'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useBackground } from '@/contexts/BackgroundContext';
import styles from './VideoBackground.module.css';

const VIDEO_URL = 'https://vconqnpmybosduyhtbmu.supabase.co/storage/v1/object/public/Videos/bg-general.mp4';
const VIDEO_DURATION = 5; // seconds
const CROSSFADE_DURATION = 2; // seconds
const MIDDLE_DURATION = VIDEO_DURATION - (CROSSFADE_DURATION * 2); // 1 second of full opacity

export default function VideoBackground() {
  const { isMotion } = useBackground();
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const [opacities, setOpacities] = useState({ a: 1, b: 0 });
  const animationRef = useRef<number | null>(null);
  const isInitializedRef = useRef(false);

  // Calculate opacity based on video time position
  const getOpacity = useCallback((time: number): number => {
    if (time < CROSSFADE_DURATION) {
      // First 2 seconds: fading in (0 to 1)
      return time / CROSSFADE_DURATION;
    } else if (time < CROSSFADE_DURATION + MIDDLE_DURATION) {
      // Middle section (2-3s): full opacity
      return 1;
    } else {
      // Last 2 seconds (3-5s): fading out (1 to 0)
      const fadeOutProgress = (time - CROSSFADE_DURATION - MIDDLE_DURATION) / CROSSFADE_DURATION;
      return 1 - fadeOutProgress;
    }
  }, []);

  // Animation loop to update opacities
  const updateLoop = useCallback(() => {
    const videoA = videoARef.current;
    const videoB = videoBRef.current;
    if (!videoA || !videoB) {
      animationRef.current = requestAnimationFrame(updateLoop);
      return;
    }

    const timeA = videoA.currentTime;
    const timeB = videoB.currentTime;

    const opacityA = getOpacity(timeA);
    const opacityB = getOpacity(timeB);

    setOpacities({ a: opacityA, b: opacityB });

    animationRef.current = requestAnimationFrame(updateLoop);
  }, [getOpacity]);

  // Initialize and start videos
  useEffect(() => {
    if (!isMotion) {
      // Cleanup when motion is disabled
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      isInitializedRef.current = false;
      return;
    }

    const videoA = videoARef.current;
    const videoB = videoBRef.current;
    if (!videoA || !videoB) return;

    const initializeVideos = () => {
      if (isInitializedRef.current) return;
      isInitializedRef.current = true;

      // Video A starts at the beginning (will fade in during 0-2s)
      videoA.currentTime = 0;

      // Video B starts 3 seconds later in the cycle (at position 3, which is fading out)
      // This creates the offset needed for seamless crossfade
      videoB.currentTime = VIDEO_DURATION - CROSSFADE_DURATION; // Start at 3 seconds

      // Start both videos
      videoA.play().catch(() => {});
      videoB.play().catch(() => {});

      // Set initial opacities based on starting positions
      setOpacities({
        a: getOpacity(0), // 0 (fading in from start)
        b: getOpacity(VIDEO_DURATION - CROSSFADE_DURATION) // ~1 (about to fade out)
      });

      // Start the animation loop
      animationRef.current = requestAnimationFrame(updateLoop);
    };

    // Wait for both videos to be ready
    let aReady = videoA.readyState >= 3;
    let bReady = videoB.readyState >= 3;

    const checkReady = () => {
      if (aReady && bReady) {
        initializeVideos();
      }
    };

    const handleACanPlay = () => {
      aReady = true;
      checkReady();
    };

    const handleBCanPlay = () => {
      bReady = true;
      checkReady();
    };

    videoA.addEventListener('canplaythrough', handleACanPlay);
    videoB.addEventListener('canplaythrough', handleBCanPlay);

    // Check if already ready
    if (videoA.readyState >= 3) aReady = true;
    if (videoB.readyState >= 3) bReady = true;
    checkReady();

    return () => {
      videoA.removeEventListener('canplaythrough', handleACanPlay);
      videoB.removeEventListener('canplaythrough', handleBCanPlay);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isMotion, getOpacity, updateLoop]);

  if (!isMotion) {
    return null;
  }

  return (
    <div className={styles.videoContainer}>
      <video
        ref={videoARef}
        className={styles.video}
        style={{ opacity: opacities.a }}
        loop
        muted
        playsInline
        preload="auto"
      >
        <source src={VIDEO_URL} type="video/mp4" />
      </video>
      <video
        ref={videoBRef}
        className={styles.video}
        style={{ opacity: opacities.b }}
        loop
        muted
        playsInline
        preload="auto"
      >
        <source src={VIDEO_URL} type="video/mp4" />
      </video>
      <div className={styles.overlay} />
    </div>
  );
}
