'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, User, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import styles from './ChatMessages.module.css';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

interface ChatMessagesProps {
  messages: Message[];
  isTyping?: boolean;
  useFormattedOutput?: boolean;
}

// Rotating thinking phrases - zen-inspired
const THINKING_PHRASES = [
  'Contemplating',
  'Channeling',
  'Alchemising',
  'Searching knowledge base',
  'Connecting the dots',
  'Finding wisdom',
  'Processing',
  'Analyzing',
];

export default function ChatMessages({ messages, isTyping = false, useFormattedOutput = false }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [thinkingPhrase, setThinkingPhrase] = useState(0);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Rotate thinking phrases
  useEffect(() => {
    if (!isTyping) return;

    const interval = setInterval(() => {
      setThinkingPhrase((prev) => (prev + 1) % THINKING_PHRASES.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isTyping]);

  if (messages.length === 0 && !isTyping) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIconWrapper}>
          <Bot size={40} className={styles.emptyIcon} />
          <Sparkles size={16} className={styles.emptySparkle} />
        </div>
        <h3 className={styles.emptyTitle}>ZenCleanz Brain</h3>
        <p className={styles.emptyText}>Ask me anything about ZenCleanz products, protocols, or wellness guidance.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {messages.map((message) => (
        <div
          key={message.id}
          className={`${styles.message} ${message.role === 'user' ? styles.userMessage : styles.agentMessage}`}
        >
          <div className={styles.avatar}>
            {message.role === 'user' ? (
              <User size={18} />
            ) : (
              <Bot size={18} />
            )}
          </div>
          <div className={styles.content}>
            {useFormattedOutput && message.role === 'agent' ? (
              <div className={`${styles.text} ${styles.markdown}`}>
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            ) : (
              <p className={styles.text}>{message.content}</p>
            )}
            <span className={styles.timestamp}>
              {formatTime(message.timestamp)}
            </span>
          </div>
        </div>
      ))}

      {isTyping && (
        <div className={`${styles.message} ${styles.agentMessage} ${styles.thinkingMessage}`}>
          <div className={`${styles.avatar} ${styles.thinkingAvatar}`}>
            <Bot size={18} />
          </div>
          <div className={styles.content}>
            <div className={styles.thinkingIndicator}>
              <div className={styles.thinkingText}>
                <span className={styles.thinkingPhrase}>{THINKING_PHRASES[thinkingPhrase]}</span>
                <span className={styles.thinkingDots}>
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </span>
              </div>
              <div className={styles.thinkingBar}>
                <div className={styles.thinkingProgress}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
