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
    
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}