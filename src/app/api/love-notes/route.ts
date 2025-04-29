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
    
    // Find the most recent love note between the current user and the specified user
    const loveNote = await prisma.loveNote.findFirst({
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
        createdAt: 'desc',
      },
    });
    
    return NextResponse.json(loveNote);
  } catch (error) {
    console.error("Error fetching love note:", error);
    return NextResponse.json(
      { error: "Failed to fetch love note" },
      { status: 500 }
    );
  }
}