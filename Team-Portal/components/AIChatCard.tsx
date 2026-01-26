'use client';

import { useState, useCallback, useEffect, FormEvent } from 'react';
import {
  Brain,
  Sparkles,
  Mic,
  MessageSquare,
  MicOff,
  X,
  Send,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useAIChat } from '@/hooks/useAIChat';
import { useAdminSettings } from '@/contexts/AdminSettingsContext';
import VoiceVisualizer from './VoiceVisualizer';
import ChatMessages from './ChatMessages';
import styles from './AIChatCard.module.css';

// Rotating thinking phrases - zen-inspired (shared with voice mode)
const VOICE_THINKING_PHRASES = [
  'Contemplating',
  'Channeling',
  'Alchemising',
  'Listening deeply',
  'Connecting the dots',
  'Finding wisdom',
  'Processing',
  'Tuning in',
];

interface AIChatCardProps {
  onMouseMove?: (e: React.MouseEvent<HTMLElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLElement>) => void;
}

export default function AIChatCard({ onMouseMove, onMouseLeave }: AIChatCardProps) {
  const [inputValue, setInputValue] = useState('');
  const [voiceThinkingPhrase, setVoiceThinkingPhrase] = useState(0);
  const { settings } = useAdminSettings();

  const {
    mode,
    status,
    error,
    isMuted,
    messages,
    isSpeaking,
    isWaitingForResponse,
    inputFrequencyData,
    outputFrequencyData,
    startConversation,
    endConversation,
    sendTextMessage,
    toggleMute,
    switchMode,
    isConnected,
    isConnecting,
  } = useAIChat();

  const handleSendMessage = useCallback((e: FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      sendTextMessage(inputValue);
      setInputValue('');
    }
  }, [inputValue, sendTextMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim()) {
        sendTextMessage(inputValue);
        setInputValue('');
      }
    }
  }, [inputValue, sendTextMessage]);

  const isIdle = status === 'idle';
  const isError = status === 'error';

  // Rotate thinking phrases for voice mode (when not speaking)
  useEffect(() => {
    if (!isConnected || mode !== 'voice' || isSpeaking) return;

    const interval = setInterval(() => {
      setVoiceThinkingPhrase((prev) => (prev + 1) % VOICE_THINKING_PHRASES.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isConnected, mode, isSpeaking]);

  return (
    <div
      className={`${styles.card} ${isConnected ? styles.active : ''}`}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {/* Header - shown when connected */}
      {isConnected && (
        <div className={styles.header}>
          <div className={styles.modeToggle}>
            <button
              className={`${styles.modeButton} ${mode === 'voice' ? styles.activeMode : ''}`}
              onClick={() => switchMode('voice')}
            >
              <Mic size={14} />
              Voice
            </button>
            <button
              className={`${styles.modeButton} ${mode === 'text' ? styles.activeMode : ''}`}
              onClick={() => switchMode('text')}
            >
              <MessageSquare size={14} />
              Text
            </button>
          </div>
          <button className={styles.endButton} onClick={endConversation}>
            <X size={16} />
            End
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className={styles.content}>
        {/* Idle State */}
        {isIdle && (
          <>
            <div className={styles.iconWrapper}>
              <Brain size={48} />
              <Sparkles size={20} className={styles.sparkle} />
            </div>

            <h1 className={styles.title}>ZenCleanz Brain</h1>
            <p className={styles.description}>
              AI-powered assistance for ZenCleanz knowledge
            </p>

            <div className={styles.startButtons}>
              <button
                className={styles.voiceButton}
                onClick={() => startConversation('voice')}
              >
                <Mic size={18} />
                Voice Chat
              </button>
              <button
                className={styles.textButton}
                onClick={() => startConversation('text')}
              >
                <MessageSquare size={18} />
                Text Chat
              </button>
            </div>
          </>
        )}

        {/* Connecting State */}
        {isConnecting && (
          <>
            <div className={styles.iconWrapper}>
              <Loader2 size={48} className={styles.spinner} />
            </div>
            <h1 className={styles.title}>ZenCleanz Brain</h1>
            <p className={styles.description}>
              {status === 'requesting-mic' ? 'Requesting microphone access...' : 'Connecting...'}
            </p>
          </>
        )}

        {/* Error State */}
        {isError && (
          <>
            <div className={`${styles.iconWrapper} ${styles.errorIcon}`}>
              <AlertCircle size={48} />
            </div>
            <h1 className={styles.title}>Connection Error</h1>
            <p className={styles.errorText}>{error}</p>
            <button
              className={styles.retryButton}
              onClick={() => startConversation()}
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </>
        )}

        {/* Connected - Voice Mode */}
        {isConnected && mode === 'voice' && (
          <>
            <VoiceVisualizer
              frequencyData={isSpeaking ? outputFrequencyData : inputFrequencyData}
              isActive={true}
              isSpeaking={isSpeaking}
              size={120}
            />

            <h2 className={styles.statusTitle}>ZenCleanz Brain</h2>

            {isSpeaking ? (
              <p className={styles.statusText}>Speaking...</p>
            ) : (
              <div className={styles.voiceThinking}>
                <span className={styles.voiceThinkingPhrase}>
                  {VOICE_THINKING_PHRASES[voiceThinkingPhrase]}
                </span>
                <span className={styles.voiceThinkingDots}>
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </span>
              </div>
            )}

            <button
              className={`${styles.muteButton} ${isMuted ? styles.muted : ''}`}
              onClick={toggleMute}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          </>
        )}

        {/* Connected - Text Mode */}
        {isConnected && mode === 'text' && (
          <>
            <ChatMessages
              messages={messages}
              isTyping={isWaitingForResponse}
              useFormattedOutput={settings.formattedTextOutput}
            />

            <form className={styles.inputForm} onSubmit={handleSendMessage}>
              <input
                type="text"
                className={styles.textInput}
                placeholder="Type your message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              <button
                type="submit"
                className={styles.sendButton}
                disabled={!inputValue.trim()}
              >
                <Send size={18} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
