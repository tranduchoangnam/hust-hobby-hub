import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { loveNoteId, answer, isRecipient } = await request.json();
    
    if (!loveNoteId || !answer) {
      return NextResponse.json(
        { error: "Love note ID and answer are required" },
        { status: 400 }
      );
    }
    
    // Get the love note
    const loveNote = await prisma.loveNote.findUnique({
      where: { id: loveNoteId },
    });
    
    if (!loveNote) {
      return NextResponse.json(
        { error: "Love note not found" },
        { status: 404 }
      );
    }
    
    // Verify the user is either the sender or recipient
    if (loveNote.senderId !== session.user.id && loveNote.recipientId !== session.user.id) {
      return NextResponse.json(
        { error: "You are not authorized to answer this love note" },
        { status: 403 }
      );
    }
    
    // Update the love note with the answer
    const updatedLoveNote = await prisma.loveNote.update({
      where: { id: loveNoteId },
      data: isRecipient ? { recipientAnswer: answer } : { senderAnswer: answer },
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
    
    return NextResponse.json(updatedLoveNote);
  } catch (error) {
    console.error("Error answering love note:", error);
    return NextResponse.json(
      { error: "Failed to answer love note" },
      { status: 500 }
    );
  }
}