"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import LoginModal from "@/components/LoginModal";
import { useSocket } from "@/components/providers/SocketProvider";
import { Message, LoveNote, User, StreakInfo } from "@/types/models";
import Avatar from "../../components/Avatar";

interface Conversation {
  id: string;
  name: string;
  image: string | null;
  lastMessage: string;
  unreadCount: number;
  isOnline: boolean;
  lastActive: string;
}

function ChatPageInner() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userIdFromQuery = searchParams.get("userId");

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { socket, isConnected } = useSocket();

  // Added states for inline chat functionality
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showLoveNote, setShowLoveNote] = useState(false);
  const [loveNote, setLoveNote] = useState<LoveNote | null>(null);
  const [loveNoteAnswer, setLoveNoteAnswer] = useState("");
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If not logged in, prompt the user to log in
    if (status === "unauthenticated") {
      setIsLoginModalOpen(true);
    }

    // Fetch conversations for the logged-in user
    if (session?.user) {
      const fetchConversations = async () => {
        setIsLoading(true);
        try {
          const response = await fetch("/api/conversations");
          if (response.ok) {
            const data = await response.json();
            setConversations(data);

            // If userId in url select that convo
            if (
              userIdFromQuery &&
              data.some((conv: Conversation) => conv.id === userIdFromQuery)
            ) {
              handleSelectConversation(userIdFromQuery);
            }
          }
        } catch (error) {
          console.error("Error fetching conversations:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchConversations();
    }
  }, [session, status, userIdFromQuery]);

  // Listen for new messages via Socket.IO
  useEffect(() => {
    if (!socket) return;

    socket.on("new_message", (data) => {
      console.log("Received new_message event:", data);

      // Update conversations with the new message
      setConversations((prev) => {
        const updatedConversations = [...prev];
        const conversationIndex = updatedConversations.findIndex(
          (c) => c.id === data.senderId || c.id === data.recipientId
        );

        if (conversationIndex >= 0) {
          const conversation = { ...updatedConversations[conversationIndex] };

          // Set appropriate preview based on message content
          if (data.content.includes("Daily Question:")) {
            conversation.lastMessage = data.content.includes("Hi! Let's start")
              ? "👋 Started with daily question"
              : "📝 Daily question answered";
          } else {
            conversation.lastMessage = data.content;
          }

          // Only increment unread count if it's not our message
          if (data.senderId !== session?.user?.id) {
            conversation.unreadCount += 1;
          }

          // Move this conversation to the top
          updatedConversations.splice(conversationIndex, 1);
          updatedConversations.unshift(conversation);
        }

        return updatedConversations;
      });

      // If we're in a chat with the sender/recipient, update the messages
      if (
        selectedUserId === data.senderId ||
        selectedUserId === data.recipientId
      ) {
        console.log("Adding message to current chat:", data);
        setMessages((prev) => {
          // If this message has a tempId, it's a confirmation of a message we sent
          if (data.tempId) {
            // Replace the temporary message with the real one from the database
            return prev.map((msg) =>
              msg.id === data.tempId ? { ...data, tempId: undefined } : msg
            );
          } else {
            // It's a new message from the other user or our daily question answer
            return [...prev, data];
          }
        });

        // Mark message as read if it's to the current user
        if (data.recipientId === session?.user?.id) {
          socket.emit("mark_read", { messageId: data.id });
        }
      }
    });

    socket.on("user_status_change", (data) => {
      // Update user online status
      setConversations((prev) => {
        return prev.map((conversation) => {
          if (conversation.id === data.userId) {
            return {
              ...conversation,
              isOnline: data.isOnline,
              lastActive: data.isOnline ? "Đang hoạt động" : "Vừa xong ",
            };
          }
          return conversation;
        });
      });
    });

    // Listen for love notes
    socket.on("new_love_note", (data: LoveNote) => {
      if (
        data.senderId === selectedUserId ||
        data.recipientId === selectedUserId
      ) {
        setLoveNote(data);
        setShowLoveNote(true);
      }
    });

    // Listen for love note updates
    socket.on("love_note_updated", (data: LoveNote) => {
      console.log("Received love_note_updated event:", data);
      if (
        data.senderId === selectedUserId ||
        data.recipientId === selectedUserId
      ) {
        console.log("Updating love note for current conversation");
        setLoveNote(data);
      }
    });

    return () => {
      socket.off("new_message");
      socket.off("user_status_change");
      socket.off("new_love_note");
      socket.off("love_note_updated");
    };
  }, [socket, session, selectedUserId]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when viewed
  useEffect(() => {
    if (!socket || !session?.user || !messages.length) return;

    const unreadMessages = messages.filter(
      (msg) => msg.recipientId === session.user.id && !msg.read
    );

    if (unreadMessages.length > 0) {
      // Mark messages as read
      unreadMessages.forEach((msg) => {
        socket.emit("mark_read", { messageId: msg.id });
      });

      // Update local state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.recipientId === session.user.id && !msg.read
            ? { ...msg, read: true }
            : msg
        )
      );
    }
  }, [messages, session, socket]);

  // Handle direct chat load from URL
  useEffect(() => {
    if (!userIdFromQuery || !session?.user || isLoading) return;

    // If we don't have the user in conversations yet but have userId in URL
    // attempt to fetch their information and create a chat with them
    if (!conversations.some((conv) => conv.id === userIdFromQuery)) {
      const loadUserChat = async () => {
        try {
          const userResponse = await fetch(`/api/users/${userIdFromQuery}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            // Add to conversations if not already there
            setConversations((prev) => {
              // Make sure we don't add duplicates
              if (!prev.some((c) => c.id === userData.id)) {
                return [
                  {
                    id: userData.id,
                    name: userData.name || "User",
                    image: userData.image,
                    lastMessage: "Start a conversation...",
                    unreadCount: 0,
                    isOnline: false,
                    lastActive: "unknown",
                  },
                  ...prev,
                ];
              }
              return prev;
            });

            // Now that we've added them to conversations, select their chat
            handleSelectConversation(userIdFromQuery);
          } else {
            console.error("User not found");
          }
        } catch (error) {
          console.error("Error loading user chat:", error);
        }
      };

      loadUserChat();
    }
  }, [userIdFromQuery, session, conversations, isLoading]);

  // Function to handle selecting a conversation
  const handleSelectConversation = async (userId: string) => {
    setSelectedUserId(userId);
    setIsChatLoading(true);

    // Update chat
    if (userIdFromQuery !== userId) {
      const url = new URL(window.location.href);
      url.searchParams.set("userId", userId);
      window.history.pushState({}, "", url);
    }

    try {
      // Fetch user details, messages, love note, and streak info in parallel
      const [userResponse, messagesResponse, loveNoteResponse, streakResponse] =
        await Promise.all([
          fetch(`/api/users/${userId}`),
          fetch(`/api/messages?userId=${userId}`),
          fetch(`/api/love-notes?userId=${userId}`),
          fetch(`/api/streaks/${userId}`),
        ]);

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setSelectedUser(userData);
      }

      let messagesData = [];
      if (messagesResponse.ok) {
        messagesData = await messagesResponse.json();
        setMessages(messagesData);
      }

      let hasRecentLoveNote = false;
      if (loveNoteResponse.ok) {
        const loveNoteData = await loveNoteResponse.json();
        if (loveNoteData) {
          // Ensure the data has the expected structure before using it
          if (loveNoteData.senderId && loveNoteData.recipientId) {
            setLoveNote(loveNoteData);
            hasRecentLoveNote = true;
            // Show love note popup if it's new (within last hour) or not answered by current user
            const isNew =
              new Date(loveNoteData.createdAt) > new Date(Date.now() - 3600000);
            const isUnanswered =
              session?.user?.id === loveNoteData.senderId
                ? !loveNoteData.senderAnswer
                : !loveNoteData.recipientAnswer;

            if (isNew || isUnanswered) {
              setShowLoveNote(true);
            }
          }
        }
      }

      if (streakResponse.ok) {
        const streakData = await streakResponse.json();
        setStreakInfo(streakData);
      }

      // Create a daily question immediately if this is a new conversation
      // (no messages between users AND no recent daily question)
      if (!hasRecentLoveNote && messagesData.length === 0) {
        // Small delay to ensure all data is loaded
        setTimeout(async () => {
          try {
            if (socket && isConnected) {
              // Use socket if available for real-time updates
              socket.emit("create_love_note", { recipientId: userId });
            } else {
              // Use API call as fallback when socket is not available
              const response = await fetch("/api/love-notes", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ recipientId: userId }),
              });

              if (response.ok) {
                const newLoveNote = await response.json();
                setLoveNote(newLoveNote);
                setShowLoveNote(true);
              }
            }
          } catch (error) {
            console.error("Error creating daily question:", error);
          }
        }, 500);
      }
    } catch (error) {
      console.error("Error fetching chat data:", error);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !session?.user || !selectedUserId) return;

    // Create a temporary ID for optimistic update
    const tempId = `temp-${Date.now()}`;

    // Optimistically add to UI
    const optimisticMessage: Message = {
      id: tempId,
      content: newMessage,
      senderId: session.user.id,
      recipientId: selectedUserId,
      createdAt: new Date().toISOString(),
      read: false,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage("");

    try {
      // Save message using API
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newMessage,
          recipientId: selectedUserId,
          tempId: tempId,
        }),
      });

      if (response.ok) {
        const savedMessage = await response.json();

        // Replace optimistic message with saved message
        setMessages((prev) =>
          prev.map((msg) => (msg.id === tempId ? savedMessage : msg))
        );

        // Refresh streak info after successful message
        try {
          const streakResponse = await fetch(`/api/streaks/${selectedUserId}`);
          if (streakResponse.ok) {
            const streakData = await streakResponse.json();
            setStreakInfo(streakData);
          }
        } catch (streakError) {
          console.error("Failed to update streak info:", streakError);
        }

        // Try to emit via socket, but don't block if socket is not connected
        if (socket && isConnected) {
          // Simplified payload with only necessary data
          try {
            socket.emit("send_message", {
              messageId: savedMessage.id,
              recipientId: selectedUserId,
            });
            console.log("Socket message emitted successfully");
          } catch (socketError) {
            console.error("Socket emit error:", socketError);
            // Message is already saved to DB, so we can continue without the socket
          }
        } else {
          console.log("Socket not connected, message saved to DB only");
        }
      } else {
        console.error("Failed to send message");
        // Rollback optimistic update
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Rollback optimistic update
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
    }
  };

  const handleSubmitLoveNote = async () => {
    if (
      !loveNoteAnswer.trim() ||
      !session?.user ||
      !loveNote ||
      !selectedUserId
    ) {
      console.log("Cannot submit: missing requirements", {
        hasAnswer: !!loveNoteAnswer.trim(),
        hasSession: !!session?.user,
        hasLoveNote: !!loveNote,
        hasSelectedUser: !!selectedUserId,
      });
      return;
    }

    const isRecipient = loveNote.recipientId === session.user.id;

    // Check if this is a new conversation (no previous messages)
    const isNewConversation = messages.length === 0;

    // Create message content based on conversation type
    const messageContent = isNewConversation
      ? `👋 Hi! Let's start with a daily question to get to know each other:\n\n📝 "${loveNote.question}"\n\n💭 My answer: ${loveNoteAnswer}`
      : `📝 Daily Question: "${loveNote.question}"\n\n💭 Answer: ${loveNoteAnswer}`;

    console.log("Sending daily question answer as message:", {
      loveNoteId: loveNote.id,
      isRecipient,
      isNewConversation,
      messageContent,
    });

    // Create optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      content: messageContent,
      senderId: session.user.id,
      recipientId: selectedUserId,
      createdAt: new Date().toISOString(),
      read: false,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      // Send message using the standard message endpoint
      const messageResponse = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientId: selectedUserId,
          content: messageContent,
        }),
      });

      if (!messageResponse.ok) {
        throw new Error("Failed to send message");
      }

      const savedMessage = await messageResponse.json();

      // Replace optimistic message with saved message
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? savedMessage : msg))
      );

      // Update love note answer
      const loveNoteResponse = await fetch("/api/love-notes/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          loveNoteId: loveNote.id,
          answer: loveNoteAnswer,
        }),
      });

      if (!loveNoteResponse.ok) {
        throw new Error("Failed to save love note answer");
      }

      setLoveNoteAnswer("");
      setShowLoveNote(false);

      // Update conversations list optimistically
      setConversations((prev) => {
        const updated = [...prev];
        const existingIndex = updated.findIndex((c) => c.id === selectedUserId);

        if (existingIndex >= 0) {
          // Move to top and update
          const conversation = updated.splice(existingIndex, 1)[0];
          updated.unshift({
            ...conversation,
            lastMessage: isNewConversation
              ? "Đã bắt đầu cuộc trò chuyện với câu hỏi hàng ngày"
              : "Đã trả lời câu hỏi hàng ngày",
            unreadCount: 0,
          });
        }

        return updated;
      });
    } catch (error) {
      console.error("Error sending daily question answer:", error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      alert("Failed to send your answer. Please try again.");
    }
  };

  useEffect(() => {
    const userIdFromQuery = searchParams.get("userId");
    if (userIdFromQuery) {
      handleSelectConversation(userIdFromQuery);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F3] to-[#FFE5EA] pb-20 font-['Montserrat']">
      <div className="max-w-[1200px] mx-auto p-4 md:p-8">
        <div className="bg-white rounded-[20px] shadow-md overflow-hidden">
          <div className="flex h-[calc(100vh-200px)]">
            {/* Conversation List */}
            <div className="w-full md:w-80 border-r border-gray-200 bg-white flex flex-col">
              <div className="p-4 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-xl font-bold text-[#333] font-montserrat">
                    Tin nhắn
                  </h1>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-500 font-montserrat">
                      Trực tuyến
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm kiếm cuộc trò chuyện..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#FF3366] focus:border-transparent text-sm font-montserrat"
                  />
                  <svg
                    className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-[#FF3366] border-t-transparent rounded-full animate-spin"></div>
                    <p className="font-montserrat text-gray-600 text-sm">
                      Đang tải cuộc trò chuyện...
                    </p>
                  </div>
                </div>
              ) : conversations.length > 0 ? (
                <ul className="overflow-y-auto flex-1">
                  {conversations.map((conversation) => (
                    <li key={conversation.id}>
                      <button
                        onClick={() =>
                          handleSelectConversation(conversation.id)
                        }
                        className={`flex items-center gap-3 p-4 hover:bg-gray-50 transition-all duration-200 w-full text-left border-l-4 ${
                          selectedUserId === conversation.id
                            ? "bg-pink-50 border-[#FF3366] shadow-sm"
                            : "border-transparent hover:border-pink-200"
                        }`}
                      >
                        <Avatar
                          src={conversation.image}
                          alt={conversation.name}
                          size={48}
                          showOnlineStatus={true}
                          isOnline={conversation.isOnline}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h3
                              className={`font-medium truncate font-montserrat ${
                                conversation.unreadCount > 0
                                  ? "text-gray-900 font-semibold"
                                  : "text-gray-700"
                              }`}
                            >
                              {conversation.name}
                            </h3>
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-xs text-gray-500 font-montserrat">
                                {conversation.lastActive}
                              </span>
                              {conversation.unreadCount > 0 && (
                                <div className="bg-[#FF3366] text-white text-xs font-medium rounded-full px-2 py-1 min-w-[20px] flex items-center justify-center font-montserrat animate-pulse">
                                  {conversation.unreadCount}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <p
                              className={`text-sm truncate font-montserrat ${
                                conversation.unreadCount > 0
                                  ? "text-gray-700 font-medium"
                                  : "text-gray-500"
                              }`}
                            >
                              {conversation.lastMessage}
                            </p>
                            {conversation.lastMessage && (
                              <div className="flex-shrink-0">
                                <svg
                                  className="w-3 h-3 text-gray-400"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center h-64">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-pink-200 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-8 h-8 text-pink-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500 mb-4 font-montserrat font-medium">
                    Chưa có cuộc trò chuyện nào.
                  </p>
                  <p className="text-gray-400 mb-4 font-montserrat text-sm">
                    Bắt đầu trò chuyện với những người có cùng sở thích!
                  </p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-[#FF3366] hover:text-[#E62E5C] font-montserrat font-medium transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Tìm người để trò chuyện
                  </Link>
                </div>
              )}
            </div>

            {/* Chat Area */}
            <div className="hidden md:flex flex-col flex-1">
              {selectedUser ? (
                <>
                  {/* Enhanced Chat Header */}
                  <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-white to-pink-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Avatar
                          src={selectedUser.image}
                          alt={selectedUser.name}
                          size={48}
                          showOnlineStatus={true}
                          isOnline={true}
                        />

                        <div className="ml-3">
                          <h2 className="font-semibold text-lg font-montserrat text-gray-800">
                            {selectedUser.name}
                          </h2>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <p className="text-xs text-green-600 font-montserrat font-medium">
                              Đang hoạt động
                            </p>
                          </div>
                        </div>

                        {/* Enhanced Streak Display */}
                        {streakInfo && streakInfo.currentStreak > 0 && (
                          <div className="ml-4 flex items-center px-4 py-2 bg-gradient-to-r from-[#FF3366] to-[#FF6B8A] rounded-full shadow-lg hover:shadow-xl transition-all">
                            <span className="text-white mr-2 text-lg">🔥</span>
                            <div className="text-white">
                              <span className="text-sm font-bold font-montserrat">
                                {streakInfo.currentStreak}
                              </span>
                              <span className="text-xs font-montserrat ml-1">
                                day{streakInfo.currentStreak !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Enhanced Interest Badges */}
                        {selectedUser.hobbies?.includes("music") && (
                          <div className="ml-3 flex items-center px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full border border-purple-200 shadow-sm">
                            <span className="text-purple-500 mr-2">🎵</span>
                            <span className="text-sm text-purple-600 font-montserrat font-medium">
                              Music Lover
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Enhanced Action Buttons */}
                        {streakInfo &&
                          (streakInfo.currentStreak > 0 ||
                            streakInfo.longestStreak > 0) && (
                            <button
                              onClick={() => setShowStreakModal(true)}
                              className="flex items-center gap-2 px-4 py-2 text-sm bg-white text-[#FF3366] rounded-full hover:bg-pink-50 transition-all border border-pink-200 shadow-sm hover:shadow-md font-montserrat"
                            >
                              <span>📊</span>
                              <span className="font-medium">Stats</span>
                            </button>
                          )}

                        {loveNote && (
                          <button
                            onClick={() => setShowLoveNote(true)}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full hover:from-pink-600 hover:to-red-600 transition-all shadow-md hover:shadow-lg font-montserrat"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="w-4 h-4"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                              <path d="M12 17h.01" />
                            </svg>
                            <span className="font-medium">
                              Câu Hỏi Hàng Ngày
                            </span>
                          </button>
                        )}

                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-all">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
                    {messages.map((message, index) => {
                      const isOwnMessage =
                        message.senderId === session?.user?.id;
                      const showAvatar =
                        !isOwnMessage &&
                        (index === 0 ||
                          messages[index - 1].senderId !== message.senderId);

                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            isOwnMessage ? "justify-end" : "justify-start"
                          } items-end gap-2`}
                        >
                          {!isOwnMessage && (
                            <div className="w-8 h-8 flex-shrink-0">
                              {showAvatar ? (
                                <Avatar
                                  src={selectedUser.image}
                                  alt={selectedUser.name}
                                  size={32}
                                />
                              ) : null}
                            </div>
                          )}

                          <div
                            className={`relative max-w-[70%] group ${
                              isOwnMessage ? "order-first" : ""
                            }`}
                          >
                            <div
                              className={`rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md ${
                                isOwnMessage
                                  ? "bg-gradient-to-r from-[#FF3366] to-[#FF6B8A] text-white rounded-tr-sm"
                                  : "bg-white text-gray-800 rounded-tl-sm border border-gray-100"
                              }`}
                            >
                              <div className="break-words leading-relaxed">
                                {message.content}
                              </div>
                              <div
                                className={`text-xs mt-2 flex items-center gap-1 ${
                                  isOwnMessage
                                    ? "text-white/80 justify-end"
                                    : "text-gray-500"
                                }`}
                              >
                                <span>
                                  {new Date(
                                    message.createdAt
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                {isOwnMessage && (
                                  <span
                                    className={`ml-1 ${
                                      message.read
                                        ? "text-white/90"
                                        : "text-white/70"
                                    }`}
                                  >
                                    {message.read ? "✓✓" : "✓"}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Message reactions placeholder */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-3 right-0 flex gap-1 text-xs">
                              {/* Add reaction buttons here if needed */}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Enhanced Message Input */}
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <form
                      onSubmit={handleSubmitMessage}
                      className="flex gap-3 items-end"
                    >
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Nhập tin nhắn..."
                          className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#FF3366] focus:border-transparent bg-gray-50 focus:bg-white transition-all text-sm font-montserrat"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </button>
                      </div>
                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-gradient-to-r from-[#FF3366] to-[#FF6B8A] text-white rounded-full p-3 hover:from-[#E62E5C] hover:to-[#FF5577] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                          />
                        </svg>
                      </button>
                    </form>

                    {/* Typing indicator */}
                    <div className="mt-2 h-4">
                      {/* Add typing indicator here if needed */}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-pink-200 rounded-full flex items-center justify-center mb-6">
                    <svg
                      className="w-12 h-12 text-pink-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2 font-montserrat">
                    Bắt đầu một cuộc trò chuyện
                  </h3>
                  <p className="text-gray-500 font-montserrat">
                    Chọn một cuộc trò chuyện từ thanh bên để bắt đầu trò chuyện
                  </p>
                </div>
              )}
            </div>

            {/* Mobile Chat View */}
            <div className="md:hidden flex-1">
              {selectedUser ? (
                <div className="flex flex-col h-full">
                  {/* Enhanced Mobile Chat Header */}
                  <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-white to-pink-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <button
                          onClick={() => setSelectedUserId(null)}
                          className="mr-3 p-1 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 19l-7-7 7-7"
                            />
                          </svg>
                        </button>

                        <Avatar
                          src={selectedUser.image}
                          alt={selectedUser.name}
                          size={40}
                          showOnlineStatus={true}
                          isOnline={true}
                        />

                        <div className="ml-3">
                          <h2 className="font-semibold text-lg font-montserrat text-gray-800">
                            {selectedUser.name}
                          </h2>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <p className="text-xs text-green-600 font-montserrat font-medium">
                              Đang trực tuyến
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Mobile Streak Display */}
                        {streakInfo && streakInfo.currentStreak > 0 && (
                          <div className="flex items-center px-2 py-1 bg-gradient-to-r from-[#FF3366] to-[#FF6B8A] rounded-full">
                            <span className="text-white mr-1 text-sm">🔥</span>
                            <span className="text-xs text-white font-bold font-montserrat">
                              {streakInfo.currentStreak}
                            </span>
                          </div>
                        )}

                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-all">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
                    {messages.map((message, index) => {
                      const isOwnMessage =
                        message.senderId === session?.user?.id;
                      const showAvatar =
                        !isOwnMessage &&
                        (index === 0 ||
                          messages[index - 1].senderId !== message.senderId);

                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            isOwnMessage ? "justify-end" : "justify-start"
                          } items-end gap-2`}
                        >
                          {!isOwnMessage && (
                            <div className="w-8 h-8 flex-shrink-0">
                              {showAvatar ? (
                                <Avatar
                                  src={selectedUser.image}
                                  alt={selectedUser.name}
                                  size={32}
                                />
                              ) : null}
                            </div>
                          )}

                          <div
                            className={`relative max-w-[70%] group ${
                              isOwnMessage ? "order-first" : ""
                            }`}
                          >
                            <div
                              className={`rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md ${
                                isOwnMessage
                                  ? "bg-gradient-to-r from-[#FF3366] to-[#FF6B8A] text-white rounded-tr-sm"
                                  : "bg-white text-gray-800 rounded-tl-sm border border-gray-100"
                              }`}
                            >
                              <div className="break-words leading-relaxed">
                                {message.content}
                              </div>
                              <div
                                className={`text-xs mt-2 flex items-center gap-1 ${
                                  isOwnMessage
                                    ? "text-white/80 justify-end"
                                    : "text-gray-500"
                                }`}
                              >
                                <span>
                                  {new Date(
                                    message.createdAt
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                {isOwnMessage && (
                                  <span
                                    className={`ml-1 ${
                                      message.read
                                        ? "text-white/90"
                                        : "text-white/70"
                                    }`}
                                  >
                                    {message.read ? "✓✓" : "✓"}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Message reactions placeholder */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-3 right-0 flex gap-1 text-xs">
                              {/* Add reaction buttons here if needed */}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Enhanced Message Input */}
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <form
                      onSubmit={handleSubmitMessage}
                      className="flex gap-3 items-end"
                    >
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Nhập tin nhắn..."
                          className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#FF3366] focus:border-transparent bg-gray-50 focus:bg-white transition-all text-sm font-montserrat"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </button>
                      </div>
                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-gradient-to-r from-[#FF3366] to-[#FF6B8A] text-white rounded-full p-3 hover:from-[#E62E5C] hover:to-[#FF5577] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                          />
                        </svg>
                      </button>
                    </form>

                    {/* Typing indicator */}
                    <div className="mt-2 h-4">
                      {/* Add typing indicator here if needed */}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <p className="text-lg mb-2">
                      Chọn một cuộc trò chuyện để bắt đầu
                    </p>
                    <p className="text-sm">
                      Tin nhắn của bạn sẽ hiển thị ở đây
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Note Popup */}
      {showLoveNote && loveNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md mx-4">
            <div className="text-center mb-6">
              <div className="bg-pink-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-8 h-8 text-[#FF3366]"
                >
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-[#FF3366] font-montserrat">
                Câu Hỏi Hàng Ngày
              </h2>
              <p className="text-gray-700 mt-2 font-montserrat">
                {loveNote.question}
              </p>
            </div>

            {/* My Answer */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1 font-montserrat">
                Câu trả lời của bạn
              </label>
              {(session?.user?.id === loveNote.senderId &&
                loveNote.senderAnswer) ||
              (session?.user?.id === loveNote.recipientId &&
                loveNote.recipientAnswer) ? (
                <p className="bg-pink-50 p-3 rounded-lg text-gray-800 font-montserrat">
                  {session?.user?.id === loveNote.senderId
                    ? loveNote.senderAnswer
                    : loveNote.recipientAnswer}
                </p>
              ) : (
                <textarea
                  value={loveNoteAnswer}
                  onChange={(e) => setLoveNoteAnswer(e.target.value)}
                  placeholder="Hãy dành một chút thời gian để suy ngẫm..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3366] font-montserrat"
                  rows={4}
                />
              )}
            </div>

            {/* Partner's Answer */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1 font-montserrat">
                Câu trả lời của {selectedUser?.name}
              </label>
              {(session?.user?.id === loveNote.senderId &&
                loveNote.recipientAnswer) ||
              (session?.user?.id === loveNote.recipientId &&
                loveNote.senderAnswer) ? (
                <p className="bg-pink-50 p-3 rounded-lg text-gray-800 font-montserrat">
                  {session?.user?.id === loveNote.senderId
                    ? loveNote.recipientAnswer
                    : loveNote.senderAnswer}
                </p>
              ) : (
                <div className="bg-gray-100 p-3 rounded-lg text-gray-400 flex items-center justify-center space-x-2 font-montserrat">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Đang chờ phản hồi...</span>
                </div>
              )}
            </div>

            <div className="flex justify-center space-x-4">
              {!(
                (session?.user?.id === loveNote.senderId &&
                  loveNote.senderAnswer) ||
                (session?.user?.id === loveNote.recipientId &&
                  loveNote.recipientAnswer)
              ) && (
                <button
                  onClick={handleSubmitLoveNote}
                  disabled={!loveNoteAnswer.trim()}
                  className="bg-[#FF3366] text-white rounded-xl px-6 py-2 font-medium disabled:opacity-50 font-montserrat"
                >
                  Chia sẻ
                </button>
              )}
              <button
                onClick={() => setShowLoveNote(false)}
                className="text-gray-500 rounded-xl px-6 py-2 font-medium font-montserrat"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Streak Statistics Modal */}
      {showStreakModal && streakInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md mx-4">
            <div className="text-center mb-6">
              <div className="bg-gradient-to-r from-[#FF3366] to-[#FF6B8A] rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-3xl">🔥</span>
              </div>
              <h2 className="text-2xl font-semibold text-[#FF3366] font-montserrat">
                Thống Kê Chuỗi Trò Chuyện
              </h2>
              <p className="text-gray-700 mt-2 font-montserrat">
                Chuỗi trò chuyện của bạn với {selectedUser?.name}
              </p>
            </div>

            <div className="space-y-4 mb-6">
              {/* Current Streak */}
              <div className="bg-gradient-to-r from-[#FF3366] to-[#FF6B8A] rounded-2xl p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90 font-montserrat">
                      Chuỗi Hiện Tại
                    </p>
                    <p className="text-3xl font-bold font-montserrat">
                      {streakInfo.currentStreak}
                    </p>
                    <p className="text-sm opacity-90 font-montserrat">
                      {streakInfo.currentStreak === 1 ? "ngày" : "ngày"}
                    </p>
                  </div>
                  <div className="text-4xl">🔥</div>
                </div>
              </div>

              {/* Longest Streak */}
              <div className="bg-amber-100 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-600 font-montserrat">
                      Chuỗi Dài Nhất
                    </p>
                    <p className="text-3xl font-bold text-amber-700 font-montserrat">
                      {streakInfo.longestStreak}
                    </p>
                    <p className="text-sm text-amber-600 font-montserrat">
                      {streakInfo.longestStreak === 1 ? "ngày" : "ngày"}
                    </p>
                  </div>
                  <div className="text-4xl">🏆</div>
                </div>
              </div>

              {/* Last Chat Date */}
              {streakInfo.lastChatDate && (
                <div className="bg-blue-50 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-montserrat">
                        Trò Chuyện Gần Nhất
                      </p>
                      <p className="text-lg font-semibold text-blue-700 font-montserrat">
                        {new Date(streakInfo.lastChatDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-2xl">📅</div>
                  </div>
                </div>
              )}
            </div>

            {/* Motivation message */}
            <div className="text-center mb-6">
              {streakInfo.currentStreak === 0 ? (
                <p className="text-gray-600 font-montserrat">
                  Bắt đầu chuỗi mới bằng cách trò chuyện ngay hôm nay! 💬
                </p>
              ) : streakInfo.currentStreak < 7 ? (
                <p className="text-gray-600 font-montserrat">
                  Tiếp tục nhé! Bạn đang xây dựng một kết nối tuyệt vời! 🚀
                </p>
              ) : (
                <p className="text-gray-600 font-montserrat">
                  Chuỗi ấn tượng! Hai bạn thật sự hợp nhau! ⭐
                </p>
              )}
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => setShowStreakModal(false)}
                className="bg-[#FF3366] text-white rounded-xl px-8 py-2 font-medium font-montserrat hover:bg-[#E62E5C] transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md shadow-2xl z-20 border-t border-gray-100">
        <ul className="flex justify-around list-none p-4">
          <li className="flex-1">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 text-[#666] no-underline font-medium p-3 rounded-xl transition-all duration-200 hover:bg-gray-100 hover:text-[#FF3366]"
            >
              <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <span className="text-sm">Khám phá</span>
            </Link>
          </li>
          <li className="flex-1">
            <Link
              href="/profile"
              className="flex items-center justify-center gap-2 text-[#666] no-underline font-medium p-3 rounded-xl transition-all duration-200 hover:bg-gray-100 hover:text-[#FF3366]"
            >
              <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <span className="text-sm">Hồ sơ</span>
            </Link>
          </li>
          <li className="flex-1">
            <Link
              href="/chat"
              className="flex items-center justify-center gap-2 text-[#FF3366] font-medium no-underline p-3 rounded-xl transition-all duration-200 hover:bg-[#FF3366]/10"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-[#FF3366] to-[#FF6B8A] rounded-xl flex items-center justify-center shadow-md">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <span className="text-sm font-bold">Trò chuyện</span>
            </Link>
          </li>
          <li className="flex-1">
            <Link
              href="/love-note"
              className="flex items-center justify-center gap-2 text-[#666] no-underline font-medium p-3 rounded-xl transition-all duration-200 hover:bg-gray-100 hover:text-[#FF3366]"
            >
              <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <span className="text-sm font-bold">Câu Hỏi Hàng Ngày</span>
            </Link>
          </li>
          {session && (
            <li className="flex-1">
              <button
                onClick={() => signOut()}
                className="flex items-center justify-center gap-2 text-gray-500 font-medium hover:text-[#FF3366] p-3 rounded-xl transition-all duration-200 hover:bg-gray-100 w-full"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </div>
                <span className="text-sm">Đăng xuất</span>
              </button>
            </li>
          )}
        </ul>
      </nav>

      {/* Login Modal */}
      {isLoginModalOpen && (
        <LoginModal
          onClose={() => {
            setIsLoginModalOpen(false);
            if (status === "unauthenticated") {
              router.push("/");
            }
          }}
        />
      )}

      {/* Custom CSS for glassmorphism effects */}
      <style jsx>{`
        .backdrop-blur-md {
          backdrop-filter: blur(12px);
        }
        .bg-white\\/95 {
          background-color: rgba(255, 255, 255, 0.95);
        }
      `}</style>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatPageInner />
    </Suspense>
  );
}
