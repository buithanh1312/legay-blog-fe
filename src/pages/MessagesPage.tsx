import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import {
  getConversations,
  getMessages,
  sendMessage,
  startConversation,
  type ConversationDTO,
  type MessageDTO,
} from "../api/message";
import { timeAgo } from "../utils/time";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

export default function MessagesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<ConversationDTO[]>([]);
  const [activeConv, setActiveConv] = useState<ConversationDTO | null>(null);
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [newChat, setNewChat] = useState("");
  const [newChatError, setNewChatError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = localStorage.getItem("username") || "";

  // Load conversations
  useEffect(() => {
    getConversations().then(setConversations).catch(() => {});
  }, []);

  // Auto-open conversation from ?with=username param
  useEffect(() => {
    const withUser = searchParams.get("with");
    if (!withUser) return;
    handleStartConversation(withUser, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConv) return;
    getMessages(activeConv.id).then(setMessages).catch(() => {});
  }, [activeConv]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // WebSocket for real-time incoming messages
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        client.subscribe("/user/queue/messages", (frame) => {
          const msg: MessageDTO = JSON.parse(frame.body);
          setConversations((prev) =>
            prev.map((c) =>
              c.id === msg.conversationId
                ? { ...c, lastMessage: msg.content, lastMessageAt: msg.createdAt }
                : c
            )
          );
          setActiveConv((curr) => {
            if (curr?.id === msg.conversationId) {
              setMessages((m) => [...m, msg]);
            }
            return curr;
          });
        });
      },
      reconnectDelay: 5000,
    });
    client.activate();
    return () => { client.deactivate(); };
  }, []);

  const handleStartConversation = async (username: string, silent = false) => {
    if (!username.trim()) return;
    try {
      const conv = await startConversation(username.trim());
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === conv.id);
        return exists ? prev : [conv, ...prev];
      });
      setActiveConv(conv);
      setNewChat("");
      setNewChatError("");
    } catch {
      if (!silent) setNewChatError("Cannot start conversation. Make sure you both follow each other.");
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeConv || sending) return;
    setSending(true);
    try {
      const msg = await sendMessage(activeConv.id, input.trim());
      setMessages((m) => [...m, msg]);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConv.id ? { ...c, lastMessage: input.trim(), lastMessageAt: msg.createdAt } : c
        )
      );
      setInput("");
    } finally {
      setSending(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-screen-lg mx-auto px-4 pt-6 pb-8">
        <div className="bg-white rounded-2xl border overflow-hidden flex" style={{ height: "calc(100vh - 120px)" }}>

          {/* ── LEFT: Conversation list ─────────────────────────────────── */}
          <div className="w-80 flex-shrink-0 border-r flex flex-col">
            <div className="px-4 py-4 border-b flex items-center justify-between">
              <span className="font-semibold text-gray-800">Messages</span>
              <button
                onClick={() => navigate("/posts")}
                className="text-gray-400 hover:text-gray-600 text-lg"
                title="Back"
              >✕</button>
            </div>

            {/* New conversation input */}
            <div className="px-3 py-2 border-b">
              <form onSubmit={(e) => { e.preventDefault(); handleStartConversation(newChat); }}>
                <div className="flex gap-1">
                  <input
                    value={newChat}
                    onChange={(e) => { setNewChat(e.target.value); setNewChatError(""); }}
                    placeholder="Start chat with username…"
                    className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:border-[#6B2515] transition"
                  />
                  <button
                    type="submit"
                    className="bg-[#6B2515] text-white text-xs px-3 py-1.5 rounded-full hover:opacity-90 transition"
                  >+</button>
                </div>
                {newChatError && <p className="text-[10px] text-red-500 mt-1 px-1">{newChatError}</p>}
              </form>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y">
              {conversations.length === 0 && (
                <p className="text-xs text-gray-400 text-center mt-8 px-4">
                  No conversations yet.<br />Follow someone and start chatting!
                </p>
              )}
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveConv(c)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition ${
                    activeConv?.id === c.id ? "bg-[#fdf6f0]" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#6B2515]/20 text-[#6B2515] flex items-center justify-center font-semibold flex-shrink-0">
                    {c.otherUsername.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{c.otherUsername}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {c.lastMessage ?? "No messages yet"}
                    </p>
                  </div>
                  {c.lastMessageAt && (
                    <span className="text-[10px] text-gray-300 flex-shrink-0">{timeAgo(c.lastMessageAt)}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Chat thread ──────────────────────────────────────── */}
          {activeConv ? (
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="px-5 py-3.5 border-b flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#6B2515]/20 text-[#6B2515] flex items-center justify-center font-semibold text-sm">
                  {activeConv.otherUsername.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold text-gray-800">{activeConv.otherUsername}</span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
                {messages.length === 0 && (
                  <p className="text-xs text-gray-400 text-center mt-12">No messages yet. Say hello!</p>
                )}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm break-words ${
                        msg.mine
                          ? "bg-[#6B2515] text-white rounded-br-md"
                          : "bg-gray-100 text-gray-800 rounded-bl-md"
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p className={`text-[10px] mt-0.5 ${msg.mine ? "text-white/60" : "text-gray-400"}`}>
                        {timeAgo(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="px-4 py-3 border-t flex gap-2 items-center">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Message ${activeConv.otherUsername}…`}
                  className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:border-[#6B2515] focus:bg-white transition"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="w-9 h-9 rounded-full bg-[#6B2515] text-white flex items-center justify-center hover:opacity-90 transition disabled:opacity-40 flex-shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                  </svg>
                </button>
              </form>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 text-gray-200">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
              <p className="text-sm">Select a conversation to start chatting</p>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}
