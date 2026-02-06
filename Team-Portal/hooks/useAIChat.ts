'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useConversation } from '@elevenlabs/react';

export type ChatMode = 'voice' | 'text';
export type ConnectionStatus = 'idle' | 'requesting-mic' | 'connecting' | 'connected' | 'disconnecting' | 'error';

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

interface UseAIChatOptions {
  onError?: (error: string) => void;
}

export function useAIChat(options: UseAIChatOptions = {}) {
  const { onError } = options;

  // State
  const [mode, setMode] = useState<ChatMode>('voice');
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputFrequencyData, setInputFrequencyData] = useState<Uint8Array | null>(null);
  const [outputFrequencyData, setOutputFrequencyData] = useState<Uint8Array | null>(null);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');

  // Refs
  const animationFrameRef = useRef<number>();
  const messageIdCounter = useRef(0);

  // ElevenLabs conversation hook
  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to ElevenLabs');
      setStatus('connected');
      setError(null);
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs');
      setStatus('idle');
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    },
    onError: (err: string | Error) => {
      console.error('ElevenLabs error:', err);
      const errorMessage = typeof err === 'string' ? err : (err.message || 'Connection error');
      setError(errorMessage);
      setStatus('error');
      onError?.(errorMessage);
    },
    onMessage: (props: { message: string; role: 'user' | 'agent' }) => {
      // Handle incoming messages from conversation
      console.log('Message received:', props);
      if (props.message && props.role === 'agent') {
        // Only add agent messages (user messages are added when sent)
        addMessage('agent', props.message);
        // Agent responded, no longer waiting
        setIsWaitingForResponse(false);
      }
    },
  });

  // Helper to add messages
  const addMessage = useCallback((role: 'user' | 'agent', content: string) => {
    const newMessage: ChatMessage = {
      id: `msg-${++messageIdCounter.current}`,
      role,
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  }, []);

  // Start visualization loop
  const startVisualization = useCallback(() => {
    const updateVisualization = () => {
      try {
        const inputData = conversation.getInputByteFrequencyData?.();
        const outputData = conversation.getOutputByteFrequencyData?.();

        if (inputData) setInputFrequencyData(new Uint8Array(inputData));
        if (outputData) setOutputFrequencyData(new Uint8Array(outputData));
      } catch (e) {
        // Ignore errors during visualization
      }
      animationFrameRef.current = requestAnimationFrame(updateVisualization);
    };
    updateVisualization();
  }, [conversation]);

  // Request microphone permission
  const requestMicPermission = useCallback(async (): Promise<boolean> => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch (err) {
      console.error('Microphone permission denied:', err);
      return false;
    }
  }, []);

  // Start conversation
  const startConversation = useCallback(async (selectedMode: ChatMode = mode) => {
    try {
      setError(null);
      setMode(selectedMode);
      setSessionId(crypto.randomUUID());

      // For voice mode, request microphone permission
      if (selectedMode === 'voice') {
        setStatus('requesting-mic');
        const hasPermission = await requestMicPermission();
        if (!hasPermission) {
          setError('Microphone permission denied. Please allow access to use voice chat.');
          setStatus('error');
          return;
        }
      }

      setStatus('connecting');

      // Get signed URL from our API
      const response = await fetch('/api/elevenlabs/conversation-token');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get conversation token');
      }

      const { signedUrl } = await response.json();

      // Start session with ElevenLabs
      // Use textOnly: true for text mode - no audio input/output
      await conversation.startSession({
        signedUrl,
        textOnly: selectedMode === 'text',
      });

      // Start visualization only for voice mode
      if (selectedMode === 'voice') {
        startVisualization();
      }

    } catch (err) {
      console.error('Failed to start conversation:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect';
      setError(errorMessage);
      setStatus('error');
      onError?.(errorMessage);
    }
  }, [mode, requestMicPermission, conversation, startVisualization, onError]);

  // End conversation
  const endConversation = useCallback(async () => {
    try {
      setStatus('disconnecting');
      await conversation.endSession();
      setMessages([]);
      setIsWaitingForResponse(false);
      setSessionId('');
      setStatus('idle');
    } catch (err) {
      console.error('Error ending conversation:', err);
      setIsWaitingForResponse(false);
      setSessionId('');
      setStatus('idle');
    }
  }, [conversation]);

  // Send text message
  const sendTextMessage = useCallback(async (text: string) => {
    if (!text.trim() || status !== 'connected') return;

    // Add user message immediately to the chat
    addMessage('user', text.trim());

    // Show thinking indicator while waiting for response
    setIsWaitingForResponse(true);

    // Send to ElevenLabs
    try {
      conversation.sendUserMessage(text);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
      setIsWaitingForResponse(false);
    }
  }, [status, conversation, addMessage]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
    // Note: ElevenLabs SDK handles muting through micMuted option
    // For now, we track state locally - could be enhanced with SDK integration
  }, []);

  // Switch mode during conversation
  // Note: Since textOnly is set at session start, switching modes requires reconnecting
  const switchMode = useCallback(async (newMode: ChatMode) => {
    if (newMode === mode) return;

    if (status === 'connected') {
      // End current session and start new one with different mode
      try {
        await conversation.endSession();
        setMessages([]); // Clear messages for fresh start
        // Start new session with the new mode
        await startConversation(newMode);
      } catch (err) {
        console.error('Error switching mode:', err);
        setStatus('idle');
      }
    } else {
      setMode(newMode);
    }
  }, [mode, status, conversation, startConversation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    // State
    mode,
    status,
    error,
    isMuted,
    messages,
    isSpeaking: conversation.isSpeaking,
    isWaitingForResponse,
    sessionId,

    // Audio data for visualization
    inputFrequencyData,
    outputFrequencyData,

    // Actions
    startConversation,
    endConversation,
    sendTextMessage,
    toggleMute,
    switchMode,
    setMode,

    // Helpers
    isConnected: status === 'connected',
    isConnecting: status === 'connecting' || status === 'requesting-mic',
    canSendMessage: status === 'connected',
  };
}
