// src/hooks/useChat.js
import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { sendMentorMessage } from '../lib/gemini';
import { MOCK_CHAT_MESSAGES } from '../lib/mockData';

export function useChat(roadmapId, roadmapTitle, goalSummary, activeMilestoneTitle) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch persistent chat messages for roadmap
  const fetchMessages = useCallback(async () => {
    if (!roadmapId) return;
    setLoading(true);

    if (!isSupabaseConfigured || !user) {
      setMessages(MOCK_CHAT_MESSAGES.filter((m) => m.roadmap_id === roadmapId) || MOCK_CHAT_MESSAGES);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('roadmap_id', roadmapId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.warn('Error fetching chat messages:', err.message);
      setMessages(MOCK_CHAT_MESSAGES);
    } finally {
      setLoading(false);
    }
  }, [roadmapId, user]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Send a message with live Gemini AI Proxy
  const sendMessage = async (text, persona = 'tutor', geminiModel = 'flash') => {
    if (!text.trim() || isTyping) return;

    const userMsg = {
      id: `usr-${Date.now()}`,
      roadmap_id: roadmapId,
      user_id: user?.id || 'usr_01',
      role: 'user',
      content: text,
      persona,
      created_at: new Date().toISOString(),
    };

    // Optimistically append user message
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsTyping(true);

    if (isSupabaseConfigured && user) {
      try {
        await supabase.from('chat_messages').insert({
          roadmap_id: roadmapId,
          user_id: user.id,
          role: 'user',
          content: text,
          persona,
        });
      } catch (err) {
        console.error('Failed to persist user message:', err);
      }
    }

    try {
      // Invoke secure Gemini Proxy Edge Function
      const aiResponse = await sendMentorMessage({
        messages: updatedMessages.slice(-6), // Send last 6 conversation turns for context
        roadmap_title: roadmapTitle,
        goal_summary: goalSummary,
        active_milestone: activeMilestoneTitle,
        persona,
        gemini_model: geminiModel,
      });

      const botContent = aiResponse?.content || 'I am ready to help you with your deliverables.';

      const botMsg = {
        id: `bot-${Date.now()}`,
        roadmap_id: roadmapId,
        user_id: user?.id || 'bot_01',
        role: 'assistant',
        content: botContent,
        persona,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMsg]);

      if (isSupabaseConfigured && user) {
        try {
          await supabase.from('chat_messages').insert({
            roadmap_id: roadmapId,
            user_id: user.id,
            role: 'assistant',
            content: botContent,
            persona,
          });
        } catch (err) {
          console.error('Failed to persist assistant message:', err);
        }
      }
    } catch (err) {
      console.error('Mentor chat error:', err);
    } finally {
      setIsTyping(false);
    }
  };

  return {
    messages,
    isTyping,
    loading,
    sendMessage,
    refetch: fetchMessages,
  };
}
