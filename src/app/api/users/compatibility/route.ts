import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Get current user from session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Get the current user's hobbies
    const userHobbies = await prisma.userHobby.findMany({
      where: {
        userId: userId
      },
      select: {
        hobbyId: true
      }
    });
    
    const currentUserHobbyIds = userHobbies.map(hobby => hobby.hobbyId);
    
    if (currentUserHobbyIds.length === 0) {
      return NextResponse.json(
        { message: "You don't have any hobbies set up yet", users: [] },
        { status: 200 }
      );
    }
    
    // Get all other users and their hobbies
    const otherUsers = await prisma.user.findMany({
      where: {
        id: {
          not: userId
        },
        hobbies: {
          some: {} // At least one hobby
        }
      },
      include: {
        hobbies: {
          include: {
            hobby: true
          }
        }
      }
    });
    
    // Calculate compatibility scores
    const usersWithCompatibility = otherUsers.map(user => {
      const otherUserHobbyIds = user.hobbies.map(hobby => hobby.hobbyId);
      
      // Find common hobbies
      const commonHobbies = currentUserHobbyIds.filter(hobbyId => 
        otherUserHobbyIds.includes(hobbyId)
      );
      
      // Calculate compatibility score (percentage of shared hobbies)
      const totalUniqueHobbies = new Set([...currentUserHobbyIds, ...otherUserHobbyIds]).size;
      const compatibilityScore = totalUniqueHobbies > 0 
        ? (commonHobbies.length / totalUniqueHobbies) * 100 
        : 0;
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        hobbies: user.hobbies.map(h => ({
          id: h.hobby.id,
          name: h.hobby.name
        })),
        commonHobbies: commonHobbies.length,
        compatibilityScore: Math.round(compatibilityScore)
      };
    });
    
    // Sort by compatibility score descending and limit to top 10
    const topMatches = usersWithCompatibility
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, 10);
    
    return NextResponse.json({
      users: topMatches
    });
  } catch (error) {
    console.error("Error finding compatible users:", error);
    return NextResponse.json(
      { error: "Failed to find compatible users" },
      { status: 500 }
    );
  }
} 