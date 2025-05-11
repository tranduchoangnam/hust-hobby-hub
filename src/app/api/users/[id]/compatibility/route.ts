import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
    
    // Verify the target user exists
    const targetUser = await prisma.user.findUnique({
      where: {
        id: targetUserId
      },
      include: {
        hobbies: {
          include: {
            hobby: true
          }
        }
      }
    });
    
    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Get the current user's hobbies
    const currentUser = await prisma.user.findUnique({
      where: {
        id: currentUserId
      },
      include: {
        hobbies: {
          include: {
            hobby: true
          }
        }
      }
    });
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "Current user not found" },
        { status: 404 }
      );
    }
    
    const currentUserHobbyIds = currentUser.hobbies.map(hobby => hobby.hobbyId);
    const targetUserHobbyIds = targetUser.hobbies.map(hobby => hobby.hobbyId);
    
    // Find common hobbies
    const commonHobbyIds = currentUserHobbyIds.filter(hobbyId => 
      targetUserHobbyIds.includes(hobbyId)
    );
    
    // Get common hobby details
    const commonHobbies = currentUser.hobbies
      .filter(hobby => commonHobbyIds.includes(hobby.hobbyId))
      .map(hobby => ({
        id: hobby.hobby.id,
        name: hobby.hobby.name
      }));
    
    // Calculate compatibility score (percentage of shared hobbies)
    const totalUniqueHobbies = new Set([...currentUserHobbyIds, ...targetUserHobbyIds]).size;
    const compatibilityScore = totalUniqueHobbies > 0 
      ? (commonHobbyIds.length / totalUniqueHobbies) * 100 
      : 0;
    
    return NextResponse.json({
      compatibility: {
        score: Math.round(compatibilityScore),
        commonHobbies,
        commonHobbyCount: commonHobbyIds.length,
        userHobbyCount: currentUserHobbyIds.length,
        targetUserHobbyCount: targetUserHobbyIds.length,
      },
      targetUser: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        image: targetUser.image,
        hobbies: targetUser.hobbies.map(h => ({
          id: h.hobby.id,
          name: h.hobby.name
        }))
      }
    });
  } catch (error) {
    console.error("Error calculating compatibility:", error);
    return NextResponse.json(
      { error: "Failed to calculate compatibility" },
      { status: 500 }
    );
  }
} 