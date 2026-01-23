'use client';

import { useRef, useEffect } from 'react';
import styles from './VoiceVisualizer.module.css';

interface VoiceVisualizerProps {
  frequencyData: Uint8Array | null;
  isActive: boolean;
  isSpeaking?: boolean;
  size?: number;
}

export default function VoiceVisualizer({
  frequencyData,
  isActive,
  isSpeaking = false,
  size = 120,
}: VoiceVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size for high DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const baseRadius = size * 0.3;

    const draw = () => {
      ctx.clearRect(0, 0, size, size);

      // Calculate average volume from frequency data
      let avgVolume = 0;
      if (frequencyData && frequencyData.length > 0) {
        const sum = frequencyData.reduce((acc, val) => acc + val, 0);
        avgVolume = sum / frequencyData.length / 255;
      }

      // Pulsing effect based on volume
      const pulseAmount = isActive ? avgVolume * 15 : 0;
      const currentRadius = baseRadius + pulseAmount;

      // Glow color based on speaking/listening state
      const goldColor = isSpeaking
        ? 'rgba(232, 213, 163, 0.9)' // Brighter gold when speaking
        : 'rgba(201, 169, 98, 0.8)'; // Normal gold when listening

      const glowColor = isSpeaking
        ? 'rgba(232, 213, 163, 0.4)'
        : 'rgba(201, 169, 98, 0.2)';

      // Draw outer glow
      const gradient = ctx.createRadialGradient(
        centerX, centerY, currentRadius * 0.5,
        centerX, centerY, currentRadius * 1.5
      );
      gradient.addColorStop(0, glowColor);
      gradient.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(centerX, centerY, currentRadius * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw main circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(26, 26, 26, 0.9)';
      ctx.fill();

      // Draw border
      ctx.strokeStyle = goldColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw frequency bars in a circular pattern
      if (frequencyData && frequencyData.length > 0 && isActive) {
        const barCount = 32;
        const barWidth = 3;

        for (let i = 0; i < barCount; i++) {
          const freqIndex = Math.floor((i / barCount) * frequencyData.length);
          const value = frequencyData[freqIndex] / 255;
          const barHeight = value * 20 + 5;

          const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
          const innerRadius = currentRadius - 5;
          const outerRadius = innerRadius - barHeight;

          const x1 = centerX + Math.cos(angle) * innerRadius;
          const y1 = centerY + Math.sin(angle) * innerRadius;
          const x2 = centerX + Math.cos(angle) * outerRadius;
          const y2 = centerY + Math.sin(angle) * outerRadius;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = goldColor;
          ctx.lineWidth = barWidth;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }

      // Draw center icon (simplified waveform)
      if (isActive) {
        const waveWidth = currentRadius * 0.6;
        const waveHeight = avgVolume * 15 + 5;

        ctx.beginPath();
        ctx.moveTo(centerX - waveWidth / 2, centerY);

        // Draw simple waveform
        for (let i = 0; i <= 20; i++) {
          const x = centerX - waveWidth / 2 + (waveWidth / 20) * i;
          const y = centerY + Math.sin(i * 0.8 + Date.now() * 0.005) * waveHeight;
          ctx.lineTo(x, y);
        }

        ctx.strokeStyle = goldColor;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [frequencyData, isActive, isSpeaking, size]);

  return (
    <div
      className={`${styles.container} ${isActive ? styles.active : ''} ${isSpeaking ? styles.speaking : ''}`}
      style={{ width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        style={{ width: size, height: size }}
      />
    </div>
  );
}
