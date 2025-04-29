import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const hobbies = await prisma.hobby.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    
    return NextResponse.json(hobbies);
  } catch (error) {
    console.error("Error fetching hobbies:", error);
    return NextResponse.json(
      { error: "Failed to fetch hobbies" },
      { status: 500 }
    );
  }
}