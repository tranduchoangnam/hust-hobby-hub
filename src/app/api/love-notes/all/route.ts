import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Fetch all love notes for the current user (as either sender or recipient)
    const loveNotes = await prisma.loveNote.findMany({
      where: {
        OR: [
          { senderId: session.user.id },
          { recipientId: session.user.id },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
    
    return NextResponse.json(loveNotes);
  } catch (error) {
    console.error("Error fetching love notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch love notes" },
      { status: 500 }
    );
  }
}