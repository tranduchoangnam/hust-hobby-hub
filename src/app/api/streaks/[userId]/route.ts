import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { userId: otherUserId } = await params;
    const currentUserId = session.user.id;

    // Don't track streaks with yourself
    if (currentUserId === otherUserId) {
      return NextResponse.json(
        { error: "Cannot track streak with yourself" },
        { status: 400 }
      );
    }

    // Find existing streak (order user IDs to ensure consistency)
    const [user1Id, user2Id] = [currentUserId, otherUserId].sort();
    
    const streak = await prisma.streak.findUnique({
      where: {
        user1Id_user2Id: {
          user1Id,
          user2Id,
        },
      },
    });

    if (!streak) {
      return NextResponse.json({
        currentStreak: 0,
        longestStreak: 0,
        lastChatDate: null,
      });
    }

    return NextResponse.json({
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastChatDate: streak.lastChatDate,
    });
  } catch (error) {
    console.error("Error fetching streak:", error);
    return NextResponse.json(
      { error: "Failed to fetch streak" },
      { status: 500 }
    );
  }
} 