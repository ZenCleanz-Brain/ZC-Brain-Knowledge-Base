'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './page.module.css';

const VIDEO_URL = 'https://vconqnpmybosduyhtbmu.supabase.co/storage/v1/object/public/Videos/login.mp4';
const VIDEO_DURATION = 5;
const CROSSFADE_DURATION = 2;
const MIDDLE_DURATION = VIDEO_DURATION - (CROSSFADE_DURATION * 2);
const STORAGE_KEY = 'zc-background-mode';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Video background state
  const [isMotion, setIsMotion] = useState(false);
  const [mounted, setMounted] = useState(false);
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const [opacities, setOpacities] = useState({ a: 1, b: 0 });
  const animationRef = useRef<number | null>(null);
  const isInitializedRef = useRef(false);

  // Load saved preference
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'motion') {
      setIsMotion(true);
    }
  }, []);

  // Toggle body class for background
  useEffect(() => {
    if (mounted) {
      if (isMotion) {
        document.body.classList.add('motion-bg-active');
      } else {
        document.body.classList.remove('motion-bg-active');
      }
    }
  }, [isMotion, mounted]);

  const toggleBackground = () => {
    const newMode = !isMotion;
    setIsMotion(newMode);
    localStorage.setItem(STORAGE_KEY, newMode ? 'motion' : 'static');
  };

  // Video crossfade logic
  const getOpacity = useCallback((time: number): number => {
    if (time < CROSSFADE_DURATION) {
      return time / CROSSFADE_DURATION;
    } else if (time < CROSSFADE_DURATION + MIDDLE_DURATION) {
      return 1;
    } else {
      const fadeOutProgress = (time - CROSSFADE_DURATION - MIDDLE_DURATION) / CROSSFADE_DURATION;
      return 1 - fadeOutProgress;
    }
  }, []);

  const updateLoop = useCallback(() => {
    const videoA = videoARef.current;
    const videoB = videoBRef.current;
    if (!videoA || !videoB) {
      animationRef.current = requestAnimationFrame(updateLoop);
      return;
    }
    const opacityA = getOpacity(videoA.currentTime);
    const opacityB = getOpacity(videoB.currentTime);
    setOpacities({ a: opacityA, b: opacityB });
    animationRef.current = requestAnimationFrame(updateLoop);
  }, [getOpacity]);

  useEffect(() => {
    if (!isMotion) {
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
      videoA.currentTime = 0;
      videoB.currentTime = VIDEO_DURATION - CROSSFADE_DURATION;
      videoA.play().catch(() => {});
      videoB.play().catch(() => {});
      setOpacities({
        a: getOpacity(0),
        b: getOpacity(VIDEO_DURATION - CROSSFADE_DURATION)
      });
      animationRef.current = requestAnimationFrame(updateLoop);
    };

    let aReady = videoA.readyState >= 3;
    let bReady = videoB.readyState >= 3;

    const checkReady = () => {
      if (aReady && bReady) initializeVideos();
    };

    const handleACanPlay = () => { aReady = true; checkReady(); };
    const handleBCanPlay = () => { bReady = true; checkReady(); };

    videoA.addEventListener('canplaythrough', handleACanPlay);
    videoB.addEventListener('canplaythrough', handleBCanPlay);

    if (videoA.readyState >= 3) aReady = true;
    if (videoB.readyState >= 3) bReady = true;
    checkReady();

    return () => {
      videoA.removeEventListener('canplaythrough', handleACanPlay);
      videoB.removeEventListener('canplaythrough', handleBCanPlay);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isMotion, getOpacity, updateLoop]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid username or password');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`${styles.main} ${isMotion ? styles.motionActive : ''}`}>
      {/* Video Background */}
      {isMotion && (
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
          <div className={styles.videoOverlay} />
        </div>
      )}

      {/* Background Toggle */}
      <button
        onClick={toggleBackground}
        className={styles.bgToggle}
        title={isMotion ? 'Switch to static background' : 'Switch to motion background'}
      >
        <span className={styles.bgToggleLabel}>{isMotion ? 'Motion' : 'Static'}</span>
        <div className={`${styles.bgToggleSwitch} ${isMotion ? styles.bgToggleSwitchActive : ''}`} />
      </button>

      <div className={styles.container}>
        <div className={styles.logo}>
          <Image
            src="/zencleanz-logo.png"
            alt="ZenCleanz Logo"
            width={100}
            height={100}
            className={styles.logoIcon}
            priority
          />
          <h1>Sign In</h1>
          <p>Access the Knowledge Base Portal</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className={styles.hint}>
          Contact your admin if you need access credentials.
        </p>
      </div>
    </main>
  );
}
