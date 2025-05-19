import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET to fetch user's bio
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { bio: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ bio: user.bio || "" });
  } catch (error) {
    console.error("Error fetching user bio:", error);
    return NextResponse.json(
      { error: "Failed to fetch user bio" },
      { status: 500 }
    );
  }
}

// PUT to update user's bio
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { bio } = await request.json();

    // Validate input
    if (typeof bio !== "string") {
      return NextResponse.json(
        { error: "Bio must be a string" },
        { status: 400 }
      );
    }

    // Update user bio
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { bio },
      select: { bio: true },
    });

    return NextResponse.json({ bio: updatedUser.bio });
  } catch (error) {
    console.error("Error updating user bio:", error);
    return NextResponse.json(
      { error: "Failed to update user bio" },
      { status: 500 }
    );
  }
}
