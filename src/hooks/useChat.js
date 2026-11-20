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

  // Send a message with low-latency streaming AI Mentor
  const sendMessage = async (text, persona = 'tutor') => {
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

    const botMsgId = `bot-${Date.now()}`;
    let accumulatedContent = '';
    let streamSuccess = false;

    // 1. Stream from dedicated Supabase chat-mentor Edge Function
    if (isSupabaseConfigured) {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pgoeqctzvbzwhafcrcvq.supabase.co';
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

        const response = await fetch(`${supabaseUrl}/functions/v1/chat-mentor`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(anonKey ? { Authorization: `Bearer ${anonKey}`, apikey: anonKey } : {}),
          },
          body: JSON.stringify({
            roadmapContext: {
              title: roadmapTitle || 'Curriculum Blueprint',
              overallProgressPercent: 0,
              activeMilestone: activeMilestoneTitle || 'Active Milestone',
              completedTaskTitles: [],
              pendingTaskTitles: [],
            },
            chatHistory: updatedMessages.slice(-6).map((m) => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              text: m.content,
            })),
            message: text,
          }),
        });

        if (response.ok && response.body) {
          streamSuccess = true;

          // Append empty assistant message placeholder for streaming
          setMessages((prev) => [
            ...prev,
            {
              id: botMsgId,
              roadmap_id: roadmapId,
              user_id: user?.id || 'bot_01',
              role: 'assistant',
              content: '',
              persona,
              created_at: new Date().toISOString(),
            },
          ]);

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data:')) {
                const dataStr = trimmed.slice(5).trim();
                if (dataStr === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.chunk) {
                    accumulatedContent += parsed.chunk;
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === botMsgId ? { ...m, content: accumulatedContent } : m
                      )
                    );
                  }
                } catch {
                  // Ignore JSON parse errors for incomplete chunks
                }
              }
            }
          }
        }
      } catch (streamErr) {
        console.warn('Streaming chat-mentor notice, falling back:', streamErr.message);
      }
    }

    // 2. Fallback to sendMentorMessage if streaming did not return content
    if (!streamSuccess || !accumulatedContent.trim()) {
      try {
        const aiResponse = await sendMentorMessage({
          messages: updatedMessages.slice(-6),
          roadmap_title: roadmapTitle,
          goal_summary: goalSummary,
          active_milestone: activeMilestoneTitle,
          persona,
        });

        accumulatedContent = aiResponse?.content || 'I am ready to help you with your deliverables.';

        setMessages((prev) => {
          const exists = prev.some((m) => m.id === botMsgId);
          if (exists) {
            return prev.map((m) => (m.id === botMsgId ? { ...m, content: accumulatedContent } : m));
          }
          return [
            ...prev,
            {
              id: botMsgId,
              roadmap_id: roadmapId,
              user_id: user?.id || 'bot_01',
              role: 'assistant',
              content: accumulatedContent,
              persona,
              created_at: new Date().toISOString(),
            },
          ];
        });
      } catch (err) {
        console.error('Mentor chat fallback error:', err);
      }
    }

    // Persist final assistant message to Supabase
    if (isSupabaseConfigured && user && accumulatedContent) {
      try {
        await supabase.from('chat_messages').insert({
          roadmap_id: roadmapId,
          user_id: user.id,
          role: 'assistant',
          content: accumulatedContent,
          persona,
        });
      } catch (err) {
        console.error('Failed to persist assistant message:', err);
      }
    }

    setIsTyping(false);
  };

  return {
    messages,
    isTyping,
    loading,
    sendMessage,
    refetch: fetchMessages,
  };
}
