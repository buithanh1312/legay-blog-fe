import API from "./axios";

export interface ConversationDTO {
  id: number;
  otherUsername: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
}

export interface MessageDTO {
  id: number;
  conversationId: number;
  senderUsername: string;
  content: string;
  createdAt: string;
  mine: boolean;
}

export const getConversations = async (): Promise<ConversationDTO[]> => {
  const res = await API.get("/messages/conversations");
  return res.data;
};

export const startConversation = async (username: string): Promise<ConversationDTO> => {
  const res = await API.post("/messages/conversations", { username });
  return res.data;
};

export const getMessages = async (conversationId: number): Promise<MessageDTO[]> => {
  const res = await API.get(`/messages/conversations/${conversationId}`);
  return res.data;
};

export const sendMessage = async (conversationId: number, content: string): Promise<MessageDTO> => {
  const res = await API.post(`/messages/conversations/${conversationId}`, { content });
  return res.data;
};
