import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Helper function to format last active time
function formatLastActive(lastMessageTime: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - lastMessageTime.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) {
    return "Just now";
  } else if (diffMinutes < 60) {
    return `${diffMinutes} phút trước`;
  } else if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} ngày trước`;
  } else {
    return lastMessageTime.toLocaleDateString();
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find all conversations for the current user
    // A conversation is defined by messages exchanged between two users
    const sentMessages = await prisma.message.findMany({
      where: {
        senderId: session.user.id,
      },
      distinct: ["recipientId"],
      orderBy: {
        createdAt: "desc",
      },
      include: {
        recipient: true,
      },
    });

    const receivedMessages = await prisma.message.findMany({
      where: {
        recipientId: session.user.id,
      },
      distinct: ["senderId"],
      orderBy: {
        createdAt: "desc",
      },
      include: {
        sender: true,
      },
    });

    // Combine and deduplicate to get all conversation partners
    const conversationPartners = new Map();

    // Add recipients of sent messages
    for (const msg of sentMessages) {
      if (!conversationPartners.has(msg.recipientId)) {
        conversationPartners.set(msg.recipientId, {
          id: msg.recipientId,
          name: msg.recipient.name,
          image: msg.recipient.image,
          lastMessage: msg.content,
          lastMessageTime: msg.createdAt,
        });
      }
    }

    // Add senders of received messages
    for (const msg of receivedMessages) {
      if (!conversationPartners.has(msg.senderId)) {
        conversationPartners.set(msg.senderId, {
          id: msg.senderId,
          name: msg.sender.name,
          image: msg.sender.image,
          lastMessage: msg.content,
          lastMessageTime: msg.createdAt,
        });
      }
    }

    // Count unread messages for each conversation and get the most recent message for lastActive
    const conversations = await Promise.all(
      Array.from(conversationPartners.values()).map(async (partner) => {
        const unreadCount = await prisma.message.count({
          where: {
            senderId: partner.id,
            recipientId: session.user.id,
            read: false,
          },
        });

        // Get the most recent message between current user and this partner to determine last active
        const mostRecentMessage = await prisma.message.findFirst({
          where: {
            OR: [
              {
                senderId: session.user.id,
                recipientId: partner.id,
              },
              {
                senderId: partner.id,
                recipientId: session.user.id,
              },
            ],
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        // Determine last active time based on when they last sent a message
        const lastActiveTime = mostRecentMessage
          ? mostRecentMessage.senderId === partner.id
            ? mostRecentMessage.createdAt
            : partner.lastMessageTime
          : partner.lastMessageTime;

        return {
          ...partner,
          unreadCount,
          isOnline: Math.random() > 0.5, // Mock online status for demo
          lastActive: formatLastActive(lastActiveTime),
        };
      })
    );

    // Sort conversations by latest message
    conversations.sort(
      (a, b) =>
        new Date(b.lastMessageTime).getTime() -
        new Date(a.lastMessageTime).getTime()
    );

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}
