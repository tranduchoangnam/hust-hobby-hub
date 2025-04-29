import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Find all conversations for the current user
    // A conversation is defined by messages exchanged between two users
    const sentMessages = await prisma.message.findMany({
      where: {
        senderId: session.user.id,
      },
      distinct: ['recipientId'],
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        recipient: true,
      },
    });
    
    const receivedMessages = await prisma.message.findMany({
      where: {
        recipientId: session.user.id,
      },
      distinct: ['senderId'],
      orderBy: {
        createdAt: 'desc',
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
    
    // Count unread messages for each conversation
    const conversations = await Promise.all(
      Array.from(conversationPartners.values()).map(async (partner) => {
        const unreadCount = await prisma.message.count({
          where: {
            senderId: partner.id,
            recipientId: session.user.id,
            read: false,
          },
        });
        
        return {
          ...partner,
          unreadCount,
          isOnline: Math.random() > 0.5, // Mock online status for demo
          lastActive: 'Just now',
        };
      })
    );
    
    // Sort conversations by latest message
    conversations.sort((a, b) => 
      new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
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