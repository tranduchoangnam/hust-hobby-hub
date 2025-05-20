import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST to follow a user
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const targetUserId = params.id;

    // Get current user from session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const currentUserId = session.user.id;

    // Prevent following yourself
    if (currentUserId === targetUserId) {
      return NextResponse.json(
        { error: "You cannot follow yourself" },
        { status: 400 }
      );
    }

    // Verify the target user exists
    const targetUser = await prisma.user.findUnique({
      where: {
        id: targetUserId,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      return NextResponse.json(
        { error: "Already following this user" },
        { status: 400 }
      );
    }

    // Create follow relationship
    const follow = await prisma.follow.create({
      data: {
        followerId: currentUserId,
        followingId: targetUserId,
      },
    });

    return NextResponse.json(
      { message: "Successfully followed user", follow },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error following user:", error);
    return NextResponse.json(
      { error: "Failed to follow user" },
      { status: 500 }
    );
  }
}

// DELETE to unfollow a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const targetUserId = params.id;

    // Get current user from session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const currentUserId = session.user.id;

    // Check if following relationship exists
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    });

    if (!existingFollow) {
      return NextResponse.json(
        { error: "Not following this user" },
        { status: 400 }
      );
    }

    // Delete follow relationship
    await prisma.follow.delete({
      where: {
        id: existingFollow.id,
      },
    });

    return NextResponse.json(
      { message: "Successfully unfollowed user" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return NextResponse.json(
      { error: "Failed to unfollow user" },
      { status: 500 }
    );
  }
}

// GET to check follow status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const targetUserId = params.id;

    // Get current user from session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const currentUserId = session.user.id;

    // Check if following relationship exists
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    });

    // Get follower count
    const followerCount = await prisma.follow.count({
      where: {
        followingId: targetUserId,
      },
    });

    return NextResponse.json({
      isFollowing: !!follow,
      followerCount,
    });
  } catch (error) {
    console.error("Error checking follow status:", error);
    return NextResponse.json(
      { error: "Failed to check follow status" },
      { status: 500 }
    );
  }
}
