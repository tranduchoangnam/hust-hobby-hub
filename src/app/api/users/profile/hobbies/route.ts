import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET current user's hobbies
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
    
    // Get the user with hobbies
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        hobbies: {
          include: {
            hobby: true
          }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Format the hobbies for the response
    const hobbies = user.hobbies.map(userHobby => ({
      id: userHobby.hobby.id,
      name: userHobby.hobby.name
    }));
    
    return NextResponse.json({ hobbies });
  } catch (error) {
    console.error("Error fetching user hobbies:", error);
    return NextResponse.json(
      { error: "Failed to fetch hobbies" },
      { status: 500 }
    );
  }
}

// PUT to update user's hobbies
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
    const { hobbyIds } = await request.json();
    
    // Validate input
    if (!Array.isArray(hobbyIds)) {
      return NextResponse.json(
        { error: "hobbyIds must be an array" },
        { status: 400 }
      );
    }
    
    // Verify all hobbies exist
    const hobbies = await prisma.hobby.findMany({
      where: {
        id: {
          in: hobbyIds
        }
      }
    });
    
    if (hobbies.length !== hobbyIds.length) {
      return NextResponse.json(
        { error: "One or more hobbies not found" },
        { status: 400 }
      );
    }
    
    // Start a transaction
    await prisma.$transaction(async (tx) => {
      // Remove all existing hobby associations
      await tx.userHobby.deleteMany({
        where: {
          userId: userId
        }
      });
      
      // Create new hobby associations
      for (const hobbyId of hobbyIds) {
        await tx.userHobby.create({
          data: {
            userId: userId,
            hobbyId: hobbyId
          }
        });
      }
    });
    
    // Get updated user with hobbies
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        hobbies: {
          include: {
            hobby: true
          }
        }
      }
    });
    
    // Format the hobbies for the response
    const updatedHobbies = updatedUser?.hobbies.map(userHobby => ({
      id: userHobby.hobby.id,
      name: userHobby.hobby.name
    })) || [];
    
    return NextResponse.json({ 
      success: true,
      message: "Hobbies updated successfully",
      hobbies: updatedHobbies
    });
  } catch (error) {
    console.error("Error updating user hobbies:", error);
    return NextResponse.json(
      { error: "Failed to update hobbies" },
      { status: 500 }
    );
  }
} 