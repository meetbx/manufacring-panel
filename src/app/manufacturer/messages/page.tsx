"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getManufacturerConversations, getConversationMessages, saveServerMessage, sendMediaMessage } from "@/app/actions/chat";
import { Send, Store, User, Paperclip, FileText, X, Download } from "lucide-react";
import Image from "next/image";
import * as Ably from "ably";

function ManufacturerMessagesContent() {
  const searchParams = useSearchParams();
  const targetConvId = searchParams.get("conversationId");

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ablyRealtimeRef = useRef<Ably.Realtime | null>(null);
  const channelRef = useRef<any>(null);

useEffect(() => {
    console.log("🔍 [Client] Fetching manufacturer conversations...");
    getManufacturerConversations()
      .then((data) => {
        console.log("✅ [Client] Raw conversations returned from server:", data);
        setConversations(data);
        if (data && data.length > 0) {
          const matched = targetConvId 
            ? data.find((c) => c.id === targetConvId) || data[0]
            : data[0];
          console.log("🎯 [Client] Auto-selecting active conversation:", matched);
          handleSelectConversation(matched);
        } else {
          console.warn("⚠️ [Client] No conversations returned for this manufacturer user.");
        }
      })
      .catch((err) => {
        console.error("❌ [Client] Error calling getManufacturerConversations():", err);
      });
  }, [targetConvId]);

  useEffect(() => {
    if (!activeConv?.id || !currentUserId) return;

    const realtime = new Ably.Realtime({
      authUrl: "/api/ably/auth",
    });
    ablyRealtimeRef.current = realtime;

    const channel = realtime.channels.get(`conv_${activeConv.id}`);
    channelRef.current = channel;

    channel.subscribe("new_message", (message) => {
      const newMsg = message.data;
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    });

    channel.attach();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
      realtime.close();
    };
  }, [activeConv?.id, currentUserId]);

  const handleSelectConversation = async (conv: any) => {
    console.log("📩 [Client] Fetching messages for conversation ID:", conv?.id);
    setActiveConv(conv);
    try {
      const res = await getConversationMessages(conv.id);
      console.log("✅ [Client] Received messages response:", res);
      setMessages(res.messages || []);
      setCurrentUserId(res.currentUserId || null);
    } catch (e) {
      console.error("❌ [Client] Failed to load messages for conv ID:", conv?.id, e);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && selectedFiles.length === 0) || !activeConv || isUploading) return;

    const contentCopy = inputText.trim();
    const filesCopy = [...selectedFiles];

    setInputText("");
    setSelectedFiles([]);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("content", contentCopy);
      filesCopy.forEach((file) => formData.append("files", file));

      const savedMessage = await sendMediaMessage(activeConv.id, formData);

      setMessages((prev) => {
        if (prev.some((m) => m.id === savedMessage.id)) return prev;
        return [...prev, savedMessage];
      });

      if (channelRef.current) {
        await channelRef.current.publish("new_message", savedMessage);
      }
    } catch (err) {
      console.error("Failed to send message with attachments", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 max-w-7xl mx-auto border-x border-gray-200">
      {/* Sidebar */}
      <div className="w-1/3 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <h1 className="font-extrabold text-lg">Manufacturer Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => handleSelectConversation(conv)}
              className={`p-4 cursor-pointer hover:bg-gray-50 transition flex items-center gap-3 ${
                activeConv?.id === conv.id ? "bg-orange-50/60 border-l-4 border-orange-500" : ""
              }`}
            >
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                <User className="w-6 h-6 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold truncate text-gray-900">Buyer Chat</h3>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {conv.messages[0]?.content || "No messages yet"}
                </p>
              </div>
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="text-center p-8 text-gray-400 text-xs">No incoming buyer chats yet.</div>
          )}
        </div>
      </div>

      {/* Main Chat Window */}
      <div className="flex-1 flex flex-col bg-[#F8FAFC]">
        {activeConv ? (
          <>
            <div className="bg-white px-6 py-3.5 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Active Inquiry Room</h2>
                  <p className="text-[11px] text-gray-500">Secure B2B Channel</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => {
                const isMe = msg.senderId === currentUserId;
                return (
                  <div key={msg.id || Math.random()} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-md px-4 py-2.5 rounded-2xl text-sm shadow-xs ${
                        isMe 
                          ? "bg-[#FF5500] text-white rounded-br-none" 
                          : "bg-white text-gray-900 border border-gray-200 rounded-bl-none"
                      }`}
                    >
                      {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}

                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="space-y-2 mt-2">
                          {msg.attachments.map((att: any) => (
                            <div key={att.id}>
                              {att.type === "IMAGE" ? (
                                <a href={att.fileUrl} target="_blank" rel="noopener noreferrer" className="block relative w-48 h-48 rounded-lg overflow-hidden border border-gray-200">
                                  <Image src={att.fileUrl} alt={att.fileName || "Attachment"} fill className="object-cover" />
                                </a>
                              ) : (
                                <a href={att.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white/10 p-3 rounded-xl border border-gray-200 hover:bg-white/20 transition">
                                  <FileText className="w-8 h-8 text-orange-500 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold truncate">{att.fileName}</p>
                                    <p className="text-[10px] text-gray-400">{(att.fileSize / 1024).toFixed(1)} KB • PDF</p>
                                  </div>
                                  <Download className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className={`text-[10px] mt-1 text-right ${isMe ? "text-orange-100" : "text-gray-400"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                );
              })}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white px-4 py-2 rounded-2xl text-xs text-gray-400 italic border border-gray-200">
                    Buyer is typing...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

           {/* File Preview Tray */}
            {selectedFiles.length > 0 && (
              <div className="bg-gray-100 px-4 py-2 border-t border-gray-200 flex gap-2 overflow-x-auto">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="relative bg-white border border-gray-300 rounded-lg p-2 flex items-center gap-2 flex-shrink-0 text-xs">
                    {file.type === "application/pdf" ? (
                      <FileText className="w-5 h-5 text-red-500" />
                    ) : (
                      <img src={URL.createObjectURL(file)} alt="" className="w-8 h-8 object-cover rounded" />
                    )}
                    <span className="max-w-[100px] truncate">{file.name}</span>
                    <button type="button" onClick={() => removeSelectedFile(idx)} className="text-gray-500 hover:text-red-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Message Composer */}
            <form onSubmit={handleSendMessage} className="bg-white p-4 border-t border-gray-200 flex items-center gap-3">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                multiple 
                accept="image/jpeg,image/png,image/webp,application/pdf" 
                className="hidden" 
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-gray-500 hover:text-[#FF5500] p-2 transition flex-shrink-0"
                aria-label="Attach file"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={inputText}
                onChange={handleInputChange}
                placeholder={isUploading ? "Uploading attachment..." : "Reply to buyer..."}
                disabled={isUploading}
                className="flex-1 bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20 focus:border-[#FF5500]"
              />
              <button
                type="submit"
                disabled={isUploading}
                className="bg-[#FF5500] hover:bg-[#E04B00] text-white px-5 py-3 rounded-xl transition font-bold flex items-center justify-center shadow-sm disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm font-medium">
            Select a conversation from the sidebar
          </div>
        )}
      </div>
    </div>
  );
}

export default function ManufacturerMessagesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading chat...</div>}>
      <ManufacturerMessagesContent />
    </Suspense>
  );
}