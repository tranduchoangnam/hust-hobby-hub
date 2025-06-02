import { prisma } from "@/lib/prisma";

/**
 * Updates the streak between two users when they chat
 */
export async function updateChatStreak(user1Id: string, user2Id: string): Promise<void> {
  try {
    // Order user IDs to ensure consistency
    const [sortedUser1Id, sortedUser2Id] = [user1Id, user2Id].sort();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1); // Start of yesterday

    // Find or create streak record
    let streak = await prisma.streak.findUnique({
      where: {
        user1Id_user2Id: {
          user1Id: sortedUser1Id,
          user2Id: sortedUser2Id,
        },
      },
    });

    if (!streak) {
      // Create new streak
      streak = await prisma.streak.create({
        data: {
          user1Id: sortedUser1Id,
          user2Id: sortedUser2Id,
          currentStreak: 1,
          longestStreak: 1,
          lastChatDate: today,
        },
      });
      return;
    }

    // Check if they already chatted today
    const lastChatDate = streak.lastChatDate;
    if (lastChatDate && isSameDay(lastChatDate, today)) {
      // Already counted today, no update needed
      return;
    }

    let newCurrentStreak = 1;
    
    // Check if they chatted yesterday (consecutive days)
    if (lastChatDate && isSameDay(lastChatDate, yesterday)) {
      newCurrentStreak = streak.currentStreak + 1;
    }

    // Update longest streak if current is higher
    const newLongestStreak = Math.max(streak.longestStreak, newCurrentStreak);

    // Update the streak
    await prisma.streak.update({
      where: {
        user1Id_user2Id: {
          user1Id: sortedUser1Id,
          user2Id: sortedUser2Id,
        },
      },
      data: {
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastChatDate: today,
      },
    });
  } catch (error) {
    console.error("Error updating chat streak:", error);
    // Don't throw error to avoid disrupting message sending
  }
}

/**
 * Checks if two dates are the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Gets streak information between two users
 */
export async function getStreak(user1Id: string, user2Id: string) {
  try {
    const [sortedUser1Id, sortedUser2Id] = [user1Id, user2Id].sort();
    
    const streak = await prisma.streak.findUnique({
      where: {
        user1Id_user2Id: {
          user1Id: sortedUser1Id,
          user2Id: sortedUser2Id,
        },
      },
    });

    if (!streak) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastChatDate: null,
      };
    }

    // Check if streak is still valid (not broken)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const dayBeforeYesterday = new Date(today);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);

    let currentStreak = streak.currentStreak;
    
    // If last chat was more than 1 day ago, streak is broken
    if (streak.lastChatDate) {
      const lastChatDay = new Date(streak.lastChatDate);
      lastChatDay.setHours(0, 0, 0, 0);
      
      if (lastChatDay < dayBeforeYesterday) {
        currentStreak = 0;
        // Update the database to reflect broken streak
        await prisma.streak.update({
          where: {
            user1Id_user2Id: {
              user1Id: sortedUser1Id,
              user2Id: sortedUser2Id,
            },
          },
          data: {
            currentStreak: 0,
          },
        });
      }
    }

    return {
      currentStreak,
      longestStreak: streak.longestStreak,
      lastChatDate: streak.lastChatDate,
    };
  } catch (error) {
    console.error("Error getting streak:", error);
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastChatDate: null,
    };
  }
} 