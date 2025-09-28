import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  metadata: any;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  replied_to_id: string | null;
  sender?: {
    user_id: string;
    first_name: string | null;
    avatar_url: string | null;
  };
}

export interface Conversation {
  id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_group: boolean;
  title: string | null;
  last_message_id: string | null;
  participants?: {
    user_id: string;
    first_name: string | null;
    avatar_url: string | null;
  }[];
  last_message?: Message;
}

export const useConversations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // First get conversations the user participates in
      const { data: participantData, error: participantError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (participantError) throw participantError;
      
      const conversationIds = participantData?.map(p => p.conversation_id) || [];
      
      if (conversationIds.length === 0) return [];

      // Get conversations with details
      const { data: conversations, error: conversationError } = await supabase
        .from("conversations")
        .select("*")
        .in("id", conversationIds)
        .order("updated_at", { ascending: false });

      if (conversationError) throw conversationError;

      // Get participants for each conversation
      const enrichedConversations = await Promise.all(
        conversations.map(async (conversation) => {
          const { data: participants } = await supabase
            .from("conversation_participants")
            .select(`
              user_id,
              profiles!inner(user_id, first_name, avatar_url)
            `)
            .eq("conversation_id", conversation.id);

          const participantProfiles = participants?.map(p => ({
            user_id: p.user_id,
            first_name: (p.profiles as any)?.first_name || null,
            avatar_url: (p.profiles as any)?.avatar_url || null
          })) || [];

          // Get last message if it exists
          let lastMessage = null;
          if (conversation.last_message_id) {
            const { data: messageData } = await supabase
              .from("messages")
              .select(`
                *,
                sender:profiles(user_id, first_name, avatar_url)
              `)
              .eq("id", conversation.last_message_id)
              .single();
            
            lastMessage = messageData;
          }

          return {
            ...conversation,
            participants: participantProfiles,
            last_message: lastMessage
          };
        })
      );

      return enrichedConversations as Conversation[];
    },
    enabled: !!user?.id,
  });
};

export const useConversationMessages = (conversationId: string) => {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:profiles(user_id, first_name, avatar_url)
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!conversationId,
  });
};

export const useCreateConversation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      participantIds, 
      isGroup = false, 
      title 
    }: { 
      participantIds: string[]; 
      isGroup?: boolean; 
      title?: string; 
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({
          created_by: user.id,
          is_group: isGroup,
          title,
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add participants (including creator)
      const allParticipants = [user.id, ...participantIds.filter(id => id !== user.id)];
      const participantInserts = allParticipants.map(userId => ({
        conversation_id: conversation.id,
        user_id: userId,
      }));

      const { error: participantError } = await supabase
        .from("conversation_participants")
        .insert(participantInserts);

      if (participantError) throw participantError;

      return conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast({
        title: "Gesprek gestart",
        description: "Je nieuwe gesprek is aangemaakt.",
      });
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Er ging iets mis bij het starten van het gesprek.",
        variant: "destructive",
      });
    },
  });
};

export const useSendMessage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      conversationId, 
      content, 
      messageType = "text",
      repliedToId 
    }: { 
      conversationId: string; 
      content: string; 
      messageType?: string;
      repliedToId?: string;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          message_type: messageType,
          replied_to_id: repliedToId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};