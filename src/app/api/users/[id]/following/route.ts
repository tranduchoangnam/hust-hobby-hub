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

    // Fetch users the target user is following
    const following = await prisma.follow.findMany({
      where: {
        followerId: targetUserId,
      },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            image: true,
            hobbies: {
              include: {
                hobby: true,
              },
              take: 3,
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format the response
    const formattedFollowing = following.map((follow) => ({
      id: follow.following.id,
      name: follow.following.name,
      image: follow.following.image,
      hobbies: follow.following.hobbies.map((h) => ({
        id: h.hobby.id,
        name: h.hobby.name,
      })),
      followedAt: follow.createdAt,
    }));

    return NextResponse.json(formattedFollowing);
  } catch (error) {
    console.error("Error fetching following list:", error);
    return NextResponse.json(
      { error: "Failed to fetch following list" },
      { status: 500 }
    );
  }
}
