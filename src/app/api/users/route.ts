import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const hobbyId = searchParams.get("hobbyId");
  
  try {
    const session = await getServerSession(authOptions);
    
    // If no hobby ID provided, return error
    if (!hobbyId) {
      return NextResponse.json(
        { error: "Hobby ID is required" },
        { status: 400 }
      );
    }
    
    // Query users who have the specified hobby
    const users = await prisma.user.findMany({
      where: {
        hobbies: {
          some: {
            hobbyId: hobbyId
          }
        },
        // Exclude the current user if logged in
        ...(session?.user ? { id: { not: session.user.id } } : {})
      },
      include: {
        hobbies: {
          include: {
            hobby: true
          }
        }
      }
    });

    // If user is logged in, calculate compatibility scores
    if (session?.user?.id) {
      // Get the current user's hobbies
      const userHobbies = await prisma.userHobby.findMany({
        where: {
          userId: session.user.id
        },
        select: {
          hobbyId: true
        }
      });
      
      const currentUserHobbyIds = userHobbies.map(hobby => hobby.hobbyId);
      
      // Calculate compatibility scores for each user
      const usersWithScores = users.map(user => {
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
          ...user,
          compatibilityScore: Math.round(compatibilityScore),
          commonHobbies: commonHobbies.length
        };
      });
      
      return NextResponse.json(usersWithScores);
    }
    
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}