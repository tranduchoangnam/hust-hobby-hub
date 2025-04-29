import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    
    // Fetch messages between the current user and the specified user
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          {
            senderId: session.user.id,
            recipientId: userId,
          },
          {
            senderId: userId,
            recipientId: session.user.id,
          },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    
    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { content, recipientId, tempId } = await request.json();
    
    if (!content || !recipientId) {
      return NextResponse.json(
        { error: "Content and recipient ID are required" },
        { status: 400 }
      );
    }
    
    // Save message to database
    const message = await prisma.message.create({
      data: {
        content,
        senderId: session.user.id,
        recipientId,
        read: false,
      },
    });
    
    return NextResponse.json({ ...message, tempId });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}