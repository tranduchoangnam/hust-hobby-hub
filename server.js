import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { prisma } from "./src/lib/prisma.ts";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = 3456;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();
// Random questions for love notes
const loveNoteQuestions = [
    "Bài hát nào luôn khiến bạn muốn hát theo?",
    "Thể loại phim nào bạn có thể xem cả ngày mà không chán?",
    "Cuốn sách nào bạn khuyên mọi người nên đọc?",
    "Hoạt động nào khiến bạn quên mất thời gian?",
    "Món ăn nào bạn nấu ngon nhất?",
    "Sở thích nào giúp bạn tìm thấy cảm hứng sáng tạo?",
    "Game hoặc môn thể thao nào bạn chơi giỏi nhất?",
    "Kỹ năng thủ công nào bạn tự hào nhất?",
    "Ứng dụng nào trên điện thoại bạn không thể thiếu?",
    "Hoạt động cuối tuần nào khiến bạn cảm thấy hạnh phúc nhất?",
];
// Map of connected users
const connectedUsers = new Map();

app.prepare().then(() => {
    const httpServer = createServer(handler);

    const io = new Server(httpServer);
    io.use((socket, next) => {
        const userId = socket.handshake.auth.userId;
        if (!userId) {
            return next(new Error("Unauthorized"));
        }

        // Attach user ID to socket
        socket.userId = userId;
        next();
    });

    io.on("connection", (socket) => {
        const userId = socket.userId;

        console.log(`User connected: ${userId}`);

        // Add user to connected users map
        connectedUsers.set(userId, socket.id);

        // Broadcast user online status
        socket.broadcast.emit("user_status_change", {
            userId,
            isOnline: true,
        });

        // Handle sending messages
        socket.on("send_message", async (data) => {
            try {
                const { content, recipientId, tempId, messageId } = data;

                // If messageId is provided, we already saved this message via API
                // Just forward it to the recipient for real-time updates
                if (messageId) {
                    const message = await prisma.message.findUnique({
                        where: { id: messageId },
                    });

                    if (message) {
                        // Send message to recipient if online
                        const recipientSocketId =
                            connectedUsers.get(recipientId);
                        if (recipientSocketId) {
                            io.to(recipientSocketId).emit(
                                "new_message",
                                message,
                            );
                        }
                        return;
                    }
                }

                // Otherwise, save message to database (fallback for direct socket messages)
                const message = await prisma.message.create({
                    data: {
                        content,
                        senderId: userId,
                        recipientId,
                        read: false,
                    },
                });

                // Send message to recipient if online
                const recipientSocketId = connectedUsers.get(recipientId);
                if (recipientSocketId) {
                    io.to(recipientSocketId).emit("new_message", message);
                }

                // Send confirmation to sender with tempId to replace the optimistic message
                socket.emit("new_message", { ...message, tempId });
            } catch (error) {
                console.error("Error sending message:", error);
            }
        });

        // Handle marking messages as read
        socket.on("mark_read", async (data) => {
            try {
                const { messageId } = data;

                // Update message in database
                const message = await prisma.message.update({
                    where: { id: messageId },
                    data: { read: true },
                });

                // Notify sender that message was read
                const senderSocketId = connectedUsers.get(message.senderId);
                if (senderSocketId) {
                    io.to(senderSocketId).emit("message_read", {
                        messageId,
                        recipientId: message.recipientId,
                    });
                }
            } catch (error) {
                console.error("Error marking message as read:", error);
            }
        });

        // Handle creating a love note
        socket.on("create_love_note", async (data) => {
            try {
                const { recipientId } = data;

                // Ensure consistent ordering of user IDs to prevent duplicate love notes
                const [user1, user2] = [userId, recipientId].sort();

                // Check if there's already an active love note between these users (in either direction)
                const existingLoveNote = await prisma.loveNote.findFirst({
                    where: {
                        OR: [
                            {
                                senderId: user1,
                                recipientId: user2,
                            },
                            {
                                senderId: user2,
                                recipientId: user1,
                            },
                        ],
                        createdAt: {
                            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
                        },
                    },
                });

                if (existingLoveNote) {
                    // Send the existing love note to the requester
                    socket.emit("new_love_note", existingLoveNote);
                    return;
                }

                // Create new love note with random question
                const randomQuestion =
                    loveNoteQuestions[
                        Math.floor(Math.random() * loveNoteQuestions.length)
                    ];

                // Always use the original sender/recipient order for creation
                const loveNote = await prisma.loveNote.create({
                    data: {
                        question: randomQuestion,
                        senderId: userId,
                        recipientId,
                    },
                });

                // Send love note to both users
                socket.emit("new_love_note", loveNote);

                const recipientSocketId = connectedUsers.get(recipientId);
                if (recipientSocketId) {
                    io.to(recipientSocketId).emit("new_love_note", loveNote);
                }
            } catch (error) {
                console.error("Error creating love note:", error);
                
                // If there's a constraint error (duplicate), try to find and return the existing one
                if (error.code === 'P2002') {
                    try {
                        const existingLoveNote = await prisma.loveNote.findFirst({
                            where: {
                                OR: [
                                    {
                                        senderId: userId,
                                        recipientId,
                                    },
                                    {
                                        senderId: recipientId,
                                        recipientId: userId,
                                    },
                                ],
                                createdAt: {
                                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                                },
                            },
                        });
                        
                        if (existingLoveNote) {
                            socket.emit("new_love_note", existingLoveNote);
                        }
                    } catch (findError) {
                        console.error("Error finding existing love note:", findError);
                    }
                }
            }
        });

        // Handle answering a love note
        socket.on("answer_love_note", async (data) => {
            try {
                const { loveNoteId, answer, isRecipient } = data;

                // Update love note in database
                const loveNote = await prisma.loveNote.update({
                    where: { id: loveNoteId },
                    data: isRecipient
                        ? { recipientAnswer: answer }
                        : { senderAnswer: answer },
                });

                // Get partner ID (either sender or recipient)
                const partnerId = isRecipient
                    ? loveNote.senderId
                    : loveNote.recipientId;

                console.log(`Love note answered by ${userId} for love note ${loveNoteId}`);

                // Notify both users about love note update
                socket.emit("love_note_updated", loveNote);

                const partnerSocketId = connectedUsers.get(partnerId);
                if (partnerSocketId) {
                    io.to(partnerSocketId).emit("love_note_updated", loveNote);
                }
            } catch (error) {
                console.error("Error answering love note:", error);
            }
        });

        // Handle disconnection
        socket.on("disconnect", () => {
            console.log(`User disconnected: ${userId}`);

            // Remove user from connected users map
            connectedUsers.delete(userId);

            // Broadcast user offline status
            socket.broadcast.emit("user_status_change", {
                userId,
                isOnline: false,
            });
        });
    });

    httpServer
        .once("error", (err) => {
            console.error(err);
            process.exit(1);
        })
        .listen(port, () => {
            console.log(`> Ready on http://${hostname}:${port}`);
        });
});
