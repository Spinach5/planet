// Chat API — matches Taro src/service/hbut/chat.js
import { serverGet, serverPost } from "@/utils/serverRequest";

export interface Conversation {
  conversation_id: number;
  id?: number;
  other_user?: { nickName: string };
  otherName?: string;
  other_name?: string;
  book_title?: string;
  bookName?: string;
  book_name?: string;
  book_image?: string;
  bookImage?: string;
  price?: number;
  bookPrice?: number;
  book_price?: number;
  isDelivery?: number;
  is_delivery?: number;
  last_message?: { content: string; created_at: string } | string;
  lastMessage?: { content: string; created_at: string } | string;
  last_message_time?: string;
  unreadCount?: number;
  unread_count?: number;
  updated_at?: string;
}

export interface Message {
  id: number;
  content: string;
  created_at: string;
  sender_id: number;
  is_me?: boolean;
}

export async function createConversation(bookId: number): Promise<{ id: number; conversation_id?: number }> {
  const res = await serverPost<{ id: number; conversation_id?: number }>("/api/v1/conversations", { book_id: bookId });
  if (!res?.data) throw new Error("创建会话失败");
  return res.data;
}

export async function getConversations(): Promise<Conversation[]> {
  const res = await serverGet<Record<string, unknown>[]>("/api/v1/conversations");
  const raw = (res?.data ?? []) as Record<string, unknown>[];
  return raw.map((c) => ({
    conversation_id: (c.conversation_id ?? c.id ?? 0) as number,
    id: (c.id ?? c.conversation_id ?? 0) as number,
    other_user: c.other_user as Conversation['other_user'],
    otherName: (c.otherName ?? c.other_name ?? '') as string,
    book_title: (c.book_title ?? c.bookName ?? c.book_name ?? '') as string,
    book_image: (c.book_image ?? c.bookImage ?? '') as string,
    price: (c.price ?? c.bookPrice ?? c.book_price ?? 0) as number,
    isDelivery: (c.isDelivery ?? c.is_delivery ?? 0) as number,
    last_message: c.last_message ?? c.lastMessage ?? null,
    last_message_time: (c.last_message_time ?? c.updated_at ?? '') as string,
    unreadCount: (c.unreadCount ?? c.unread_count ?? 0) as number,
  }));
}

export async function getMessages(conversationId: number, page = 1, pageSize = 20): Promise<Message[]> {
  const res = await serverGet<Record<string, unknown>[]>(`/api/v1/conversations/${conversationId}/messages`, {
    page: String(page), pageSize: String(pageSize),
  });
  const raw = (res?.data ?? []) as Record<string, unknown>[];
  return raw.map((m) => ({
    id: (m.id ?? m.message_id ?? 0) as number,
    content: (m.content ?? '') as string,
    created_at: (m.created_at ?? m.create_time ?? '') as string,
    sender_id: (m.sender_id ?? m.senderId ?? 0) as number,
    is_me: (m.is_me ?? m.isMe ?? false) as boolean,
  }));
}

export async function sendMessage(conversationId: number, content: string): Promise<Message> {
  const res = await serverPost<Message>(`/api/v1/conversations/${conversationId}/messages`, { content });
  if (!res?.data) throw new Error("发送失败");
  return res.data;
}
