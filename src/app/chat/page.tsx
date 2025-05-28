"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import LoginModal from "@/components/LoginModal";
import { useSocket } from "@/components/providers/SocketProvider";
import { Message, LoveNote, User } from "@/types/models";

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
      // Update conversations with the new message
      setConversations((prev) => {
        const updatedConversations = [...prev];
        const conversationIndex = updatedConversations.findIndex(c => c.id === data.senderId || c.id === data.recipientId);

        if (conversationIndex >= 0) {
          const conversation = { ...updatedConversations[conversationIndex] };
          conversation.lastMessage = data.content;
          conversation.unreadCount += 1;

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
        setMessages((prev) => {
          // If this message has a tempId, it's a confirmation of a message we sent
          if (data.tempId) {
            // Replace the temporary message with the real one from the database
            return prev.map(msg =>
              msg.id === data.tempId ? { ...data, tempId: undefined } : msg
            );
          } else {
            // It's a new message from the other user
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
              lastActive: data.isOnline ? "now" : "a moment ago",
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
      if (
        data.senderId === selectedUserId ||
        data.recipientId === selectedUserId
      ) {
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
      setMessages(prev =>
        prev.map(msg =>
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
      // Fetch user details
      const userResponse = await fetch(`/api/users/${userId}`);
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setSelectedUser(userData);
      }

      // Fetch message history
      const messagesResponse = await fetch(`/api/messages?userId=${userId}`);
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        setMessages(messagesData);
      }

      // Fetch love note if exists
      const loveNoteResponse = await fetch(`/api/love-notes?userId=${userId}`);
      if (loveNoteResponse.ok) {
        const loveNoteData = await loveNoteResponse.json();
        if (loveNoteData) {
          // Ensure the data has the expected structure before using it
          if (loveNoteData.senderId && loveNoteData.recipientId) {
            setLoveNote(loveNoteData);
            // Show love note popup if it's new (within last hour) or not answered by current user
            const isNew = new Date(loveNoteData.createdAt) > new Date(Date.now() - 3600000);
            const isUnanswered = session?.user?.id === loveNoteData.senderId
                ? !loveNoteData.senderAnswer
                : !loveNoteData.recipientAnswer;

            if (isNew || isUnanswered) {
              setShowLoveNote(true);
            }
          }
        }
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

    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');

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
        setMessages(prev =>
          prev.map (msg => msg.id === tempId ? savedMessage : msg))

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

        // Maybe trigger a love note after a few messages
        const messageCount = messages.filter(
          (msg) => msg.senderId === session.user.id
        ).length;
        if (messageCount === 2 && !loveNote && socket && isConnected) {
          // After 2 messages, generate a love note
          setTimeout(() => {
            socket.emit("create_love_note", { recipientId: selectedUserId });
          }, 1000);
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

  const handleSubmitLoveNote = () => {
    if (!loveNoteAnswer.trim() || !socket || !session?.user || !loveNote) return;

    const isRecipient = loveNote.recipientId === session.user.id;

    socket.emit('answer_love_note', {
      loveNoteId: loveNote.id,
      answer: loveNoteAnswer,
      isRecipient,
    });

    // Optimistically update UI
    setLoveNote((prev) => {
      if (!prev) return null;

      return {
        ...prev,
        senderAnswer: isRecipient ? prev.senderAnswer : loveNoteAnswer,
        recipientAnswer: isRecipient ? loveNoteAnswer : prev.recipientAnswer,
      };
    });

    setLoveNoteAnswer('');
    setShowLoveNote(false);
  };

  useEffect(() => {
    const userIdFromQuery = searchParams.get("userId");
    if (userIdFromQuery) {
      handleSelectConversation(userIdFromQuery);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F3] to-[#FFE5EA] pb-20 font-['Poppins']">
      <div className="max-w-[1200px] mx-auto p-4 md:p-8">
        <div className="bg-white rounded-[20px] shadow-md overflow-hidden">
          <div className="flex h-[calc(100vh-200px)]">
            {/* Conversations List */}
            <div className="w-full md:w-1/3 lg:w-1/4 border-r border-gray-200 overflow-y-auto">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 font-poppins">
                  Messages
                </h2>
                <p className="text-sm text-gray-500 font-poppins">
                  {isConnected ? "Connected" : "Connecting..."}
                </p>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <p className="font-poppins">Loading conversations...</p>
                </div>
              ) : conversations.length > 0 ? (
                <ul>
                  {conversations.map((conversation) => (
                    <li key={conversation.id}>
                      <button
                        onClick={() => handleSelectConversation(conversation.id)}
                        className={`flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors w-full text-left ${
                          selectedUserId === conversation.id ? "bg-pink-50" : ""
                        }`}
                      >
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                            {conversation.image ? (
                              <Image
                                src={conversation.image}
                                alt={conversation.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                {conversation.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          {conversation.isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#4CAF50] border-2 border-white"></div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between">
                            <h3 className="font-medium text-gray-900 truncate font-poppins">
                              {conversation.name}
                            </h3>
                            <span className="text-xs text-gray-500 font-poppins">
                              {conversation.lastActive}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 truncate font-poppins">
                            {conversation.lastMessage}
                          </p>
                        </div>

                        {conversation.unreadCount > 0 && (
                          <div className="ml-2 bg-[#FF3366] text-white text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center font-poppins">
                            {conversation.unreadCount}
                          </div>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center h-64">
                  <p className="text-gray-500 mb-4 font-poppins">
                    No conversations yet.
                  </p>
                  <Link
                    href="/"
                    className="text-[#FF3366] hover:underline font-poppins"
                  >
                    Find people to chat with
                  </Link>
                </div>
              )}
            </div>

            {/* Chat Area */}
            <div className="hidden md:flex flex-col flex-1">
              {selectedUser ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="relative mr-3">
                        <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                          {selectedUser.image ? (
                            <Image
                              src={selectedUser.image}
                              alt={selectedUser.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              {selectedUser.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#4CAF50] border-2 border-white"></div>
                      </div>

                      <div>
                        <h2 className="font-semibold text-lg font-poppins">
                          {selectedUser.name}
                        </h2>
                        <p className="text-xs text-[#4CAF50] font-poppins">
                          Online
                        </p>
                      </div>

                      {/* Music interests section */}
                      {selectedUser.hobbies?.includes("music") && (
                        <div className="ml-5 flex items-center px-3 py-1 bg-white/60 rounded-full">
                          <span className="text-gray-600 mr-1">🎵</span>
                          <span className="text-sm text-gray-600 font-poppins">
                            Music Lover
                          </span>
                        </div>
                      )}
                    </div>

                    {loveNote && (
                      <button
                        onClick={() => setShowLoveNote(true)}
                        className="ml-auto px-3 py-1 text-sm bg-[#F5F5F5] text-[#FF3366] rounded-full hover:bg-pink-50 transition-colors font-poppins"
                      >
                        ❤️ Love Note
                      </button>
                    )}
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => {
                      const isOwnMessage =
                        message.senderId === session?.user?.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            isOwnMessage ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`relative max-w-[70%] rounded-2xl px-4 py-2 ${
                              isOwnMessage
                                ? "bg-[#FF3366] text-white rounded-tr-none"
                                : "bg-gray-100 text-gray-800 rounded-tl-none"
                            }`}
                          >
                            <div className="break-words">{message.content}</div>
                            <div
                              className={`text-xs mt-1 ${
                                isOwnMessage ? "text-white/80" : "text-gray-500"
                              }`}
                            >
                              {new Date(message.createdAt).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                              {isOwnMessage && (
                                <span className="ml-2">
                                  {message.read ? "✓✓" : "✓"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200">
                    <form onSubmit={handleSubmitMessage} className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#FF3366] focus:border-transparent"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-[#FF3366] text-white px-6 py-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#E62E5C] transition-colors"
                      >
                        Send
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <p className="text-lg mb-2">
                      Select a conversation to start chatting
                    </p>
                    <p className="text-sm">Your messages will appear here</p>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Chat View */}
            <div className="md:hidden flex-1">
              {selectedUser ? (
                <div className="flex flex-col h-full">
                  {/* Mobile Chat Header */}
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="relative mr-3">
                        <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                          {selectedUser.image ? (
                            <Image
                              src={selectedUser.image}
                              alt={selectedUser.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              {selectedUser.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#4CAF50] border-2 border-white"></div>
                      </div>

                      <div>
                        <h2 className="font-semibold text-lg font-poppins">
                          {selectedUser.name}
                        </h2>
                        <p className="text-xs text-[#4CAF50] font-poppins">
                          Online
                        </p>
                      </div>

                      {/* Music interests section */}
                      {selectedUser.hobbies?.includes("music") && (
                        <div className="ml-5 flex items-center px-3 py-1 bg-white/60 rounded-full">
                          <span className="text-gray-600 mr-1">🎵</span>
                          <span className="text-sm text-gray-600 font-poppins">
                            Music Lover
                          </span>
                        </div>
                      )}
                    </div>

                    {loveNote && (
                      <button
                        onClick={() => setShowLoveNote(true)}
                        className="ml-auto px-3 py-1 text-sm bg-[#F5F5F5] text-[#FF3366] rounded-full hover:bg-pink-50 transition-colors font-poppins"
                      >
                        ❤️ Love Note
                      </button>
                    )}
                  </div>

                  {/* Mobile Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => {
                      const isOwnMessage =
                        message.senderId === session?.user?.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            isOwnMessage ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`relative max-w-[70%] rounded-2xl px-4 py-2 ${
                              isOwnMessage
                                ? "bg-[#FF3366] text-white rounded-tr-none"
                                : "bg-gray-100 text-gray-800 rounded-tl-none"
                            }`}
                          >
                            <div className="break-words">{message.content}</div>
                            <div
                              className={`text-xs mt-1 ${
                                isOwnMessage ? "text-white/80" : "text-gray-500"
                              }`}
                            >
                              {new Date(message.createdAt).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                              {isOwnMessage && (
                                <span className="ml-2">
                                  {message.read ? "✓✓" : "✓"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Mobile Message Input */}
                  <div className="p-4 border-t border-gray-200">
                    <form onSubmit={handleSubmitMessage} className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#FF3366] focus:border-transparent"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-[#FF3366] text-white px-6 py-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#E62E5C] transition-colors"
                      >
                        Send
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <p className="text-lg mb-2">
                      Select a conversation to start chatting
                    </p>
                    <p className="text-sm">Your messages will appear here</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Love Note Popup */}
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
              <h2 className="text-2xl font-semibold text-[#FF3366] font-poppins">
                Daily Love Note
              </h2>
              <p className="text-gray-700 mt-2 font-poppins">
                {loveNote.question}
              </p>
            </div>

            {/* My Answer */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1 font-poppins">
                Your Answer
              </label>
              {(session?.user?.id === loveNote.senderId &&
                loveNote.senderAnswer) ||
              (session?.user?.id === loveNote.recipientId &&
                loveNote.recipientAnswer) ? (
                <p className="bg-pink-50 p-3 rounded-lg text-gray-800 font-poppins">
                  {session?.user?.id === loveNote.senderId
                    ? loveNote.senderAnswer
                    : loveNote.recipientAnswer}
                </p>
              ) : (
                <textarea
                  value={loveNoteAnswer}
                  onChange={(e) => setLoveNoteAnswer(e.target.value)}
                  placeholder="Take a moment to reflect..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3366] font-poppins"
                  rows={4}
                />
              )}
            </div>

            {/* Partner's Answer */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1 font-poppins">
                {selectedUser?.name}'s Answer
              </label>
              {(session?.user?.id === loveNote.senderId &&
                loveNote.recipientAnswer) ||
              (session?.user?.id === loveNote.recipientId &&
                loveNote.senderAnswer) ? (
                <p className="bg-pink-50 p-3 rounded-lg text-gray-800 font-poppins">
                  {session?.user?.id === loveNote.senderId
                    ? loveNote.recipientAnswer
                    : loveNote.senderAnswer}
                </p>
              ) : (
                <div className="bg-gray-100 p-3 rounded-lg text-gray-400 flex items-center justify-center space-x-2 font-poppins">
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
                  <span>Waiting for response...</span>
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
                  className="bg-[#FF3366] text-white rounded-xl px-6 py-2 font-medium disabled:opacity-50 font-poppins"
                >
                  Share
                </button>
              )}
              <button
                onClick={() => setShowLoveNote(false)}
                className="text-gray-500 rounded-xl px-6 py-2 font-medium font-poppins"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-white shadow-md z-10">
        <ul className="flex justify-around list-none p-4">
          <li>
            <Link href="/" className="text-[#666] no-underline font-medium">
              Browse
            </Link>
          </li>
          <li>
            <Link
              href="/profile"
              className="text-[#666] no-underline font-medium"
            >
              Profile
            </Link>
          </li>
          <li>
            <Link
              href="/chat"
              className="text-[#BE185D] no-underline font-medium"
            >
              Chat
            </Link>
          </li>
          <li>
            <Link
              href="/love-note"
              className="text-[#666] no-underline font-medium"
            >
              Love Note
            </Link>
          </li>
          {session && (
            <li>
              <button
                onClick={() => signOut()}
                className="text-gray-500 font-poppins hover:text-[#FF3366]"
              >
                Log out
              </button>
            </li>
          )}
        </ul>
      </nav>

      {/* Login Modal */}
      {isLoginModalOpen && (
        <LoginModal onClose={() => {
            setIsLoginModalOpen(false);
          if (status === 'unauthenticated') {
            router.push('/');
            }
        }} />
      )}
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
