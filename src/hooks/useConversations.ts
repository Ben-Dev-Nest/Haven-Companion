import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load all conversations
  const loadConversations = async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error loading conversations',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setConversations(data || []);
  };

  // Load messages for a conversation
  const loadMessages = async (conversationId: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      toast({
        title: 'Error loading messages',
        description: error.message,
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    setMessages((data || []).map(msg => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      created_at: msg.created_at,
    })));
    setIsLoading(false);
  };

  // Create a new conversation
  const createConversation = async (title?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('conversations')
      .insert([{ user_id: user.id, title: title || 'New Conversation' }])
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error creating conversation',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }

    await loadConversations();
    return data;
  };

  // Save a message
  const saveMessage = async (conversationId: string, role: 'user' | 'assistant', content: string) => {
    const { error } = await supabase
      .from('messages')
      .insert([{ conversation_id: conversationId, role, content }]);

    if (error) {
      toast({
        title: 'Error saving message',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return true;
  };

  // Delete a conversation
  const deleteConversation = async (conversationId: string) => {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (error) {
      toast({
        title: 'Error deleting conversation',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    await loadConversations();
    if (currentConversationId === conversationId) {
      setCurrentConversationId(null);
      setMessages([]);
    }
    return true;
  };

  // Update conversation title
  const updateConversationTitle = async (conversationId: string, title: string) => {
    const { error } = await supabase
      .from('conversations')
      .update({ title })
      .eq('id', conversationId);

    if (error) {
      toast({
        title: 'Error updating conversation',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    await loadConversations();
    return true;
  };

  // Switch to a conversation
  const switchConversation = async (conversationId: string) => {
    setCurrentConversationId(conversationId);
    await loadMessages(conversationId);
  };

  // Initialize
  useEffect(() => {
    loadConversations();
  }, []);

  return {
    conversations,
    currentConversationId,
    messages,
    isLoading,
    createConversation,
    saveMessage,
    deleteConversation,
    updateConversationTitle,
    switchConversation,
    loadConversations,
    setMessages,
  };
};
