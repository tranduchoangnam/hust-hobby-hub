import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Random questions for love notes
const loveNoteQuestions = [
  "Thể loại âm nhạc nào làm thay đổi tâm trạng của bạn?",
  "Bộ phim nào bạn có thể xem đi xem lại mà không bao giờ chán?",
  "Cuốn sách nào đã ảnh hưởng sâu sắc đến cách suy nghĩ của bạn?",
  "Môn thể thao hoặc hoạt động nào giúp bạn giải tỏa căng thẳng?",
  "Món ăn nào bạn thích nấu nhất khi muốn thử nghiệm?",
  "Địa điểm du lịch nào khiến bạn cảm thấy bình yên nhất?",
  "Sở thích nào của bạn khiến người khác thấy bất ngờ?",
  "Game hoặc trò chơi nào bạn có thể chơi hàng giờ mà không biết mệt?",
  "Loại hình nghệ thuật nào bạn muốn học nếu có thời gian?",
  "Kênh YouTube hoặc podcast nào bạn không bao giờ bỏ lỡ?",
  "Hoạt động ngoài trời nào khiến bạn cảm thấy tự do nhất?",
  "Thể loại phim nào phản ánh tính cách của bạn?",
  "Nhạc cụ nào bạn ước mình biết chơi?",
  "Món ăn từ nước nào bạn muốn học nấu?",
  "Sở thích thủ công nào giúp bạn thư giãn?",
  "Thể loại sách nào bạn đọc khi muốn thoát khỏi thực tế?",
  "Hoạt động nào bạn làm để rèn luyện sức khỏe?",
  "Ứng dụng nào trên điện thoại bạn sử dụng nhiều nhất cho sở thích?",
  "Sở thích nào của bạn bắt đầu từ tuổi thơ và vẫn tiếp tục?",
  "Hoạt động nào giúp bạn kết nối với thiên nhiên?",
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    
    // Find the most recent love note between the current user and the specified user
    const loveNote = await prisma.loveNote.findFirst({
      where: {
        OR: [
          {
            senderId: session.user.id,
            recipientId: userId,
          },
          {
            senderId: userId,
            recipientId: session.user.id,
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return NextResponse.json(loveNote);
  } catch (error) {
    console.error("Error fetching love note:", error);
    return NextResponse.json(
      { error: "Failed to fetch love note" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { recipientId } = await request.json();
    
    if (!recipientId) {
      return NextResponse.json(
        { error: "Recipient ID is required" },
        { status: 400 }
      );
    }

    // Ensure consistent ordering of user IDs to prevent duplicate love notes
    const [user1, user2] = [session.user.id, recipientId].sort();

    // Check if there's already an active love note between these users (in either direction)
    const existingLoveNote = await prisma.loveNote.findFirst({
      where: {
        OR: [
          {
            senderId: user1,
            recipientId: user2,
          },
          {
            senderId: user2,
            recipientId: user1,
          },
        ],
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    if (existingLoveNote) {
      return NextResponse.json(existingLoveNote);
    }

    // Create new love note with random question
    const randomQuestion = loveNoteQuestions[
      Math.floor(Math.random() * loveNoteQuestions.length)
    ];

    // Always use the original sender/recipient order for creation
    const loveNote = await prisma.loveNote.create({
      data: {
        question: randomQuestion,
        senderId: session.user.id,
        recipientId,
      },
    });

    return NextResponse.json(loveNote);
  } catch (error) {
    console.error("Error creating love note:", error);
    
    // If there's a constraint error (duplicate), try to find and return the existing one
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      try {
        const session = await getServerSession(authOptions);
        const { recipientId } = await request.json();
        
        if (session?.user?.id) {
          const existingLoveNote = await prisma.loveNote.findFirst({
            where: {
              OR: [
                {
                  senderId: session.user.id,
                  recipientId,
                },
                {
                  senderId: recipientId,
                  recipientId: session.user.id,
                },
              ],
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
              },
            },
          });
          
          if (existingLoveNote) {
            return NextResponse.json(existingLoveNote);
          }
        }
      } catch (findError) {
        console.error("Error finding existing love note:", findError);
      }
    }
    
    return NextResponse.json(
      { error: "Failed to create love note" },
      { status: 500 }
    );
  }
}