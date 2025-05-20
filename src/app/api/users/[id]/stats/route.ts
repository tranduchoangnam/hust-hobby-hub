import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const targetUserId = params.id;

    // Count followers
    const followerCount = await prisma.follow.count({
      where: {
        followingId: targetUserId,
      },
    });

    // Count following
    const followingCount = await prisma.follow.count({
      where: {
        followerId: targetUserId,
      },
    });

    return NextResponse.json({
      followerCount,
      followingCount,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch user stats" },
      { status: 500 }
    );
  }
}
