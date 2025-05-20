import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Fetch followers with their basic info
    const followers = await prisma.follow.findMany({
      where: {
        followingId: userId,
      },
      include: {
        follower: {
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
    const formattedFollowers = followers.map((follow) => ({
      id: follow.follower.id,
      name: follow.follower.name,
      image: follow.follower.image,
      hobbies: follow.follower.hobbies.map((h) => ({
        id: h.hobby.id,
        name: h.hobby.name,
      })),
      followedAt: follow.createdAt,
    }));

    return NextResponse.json(formattedFollowers);
  } catch (error) {
    console.error("Error fetching followers:", error);
    return NextResponse.json(
      { error: "Failed to fetch followers" },
      { status: 500 }
    );
  }
}
