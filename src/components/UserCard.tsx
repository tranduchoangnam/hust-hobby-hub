import Link from "next/link";
import Image from "next/image";
import { Session } from "next-auth";
import { useState } from "react";
import Avatar from "./Avatar";

// User types from page.tsx
export type UserWithHobbies = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  hobbies: {
    hobbyId: string;
    hobby: { id: string; name: string };
  }[];
  compatibilityScore?: number;
  commonHobbies?: number;
};

export type CompatibleUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  hobbies: { id: string; name: string }[];
  commonHobbies: number;
  compatibilityScore: number;
};

type UserCardProps = {
  user: UserWithHobbies | CompatibleUser;
  session: Session | null;
  renderCompatibilityBadge: (score: number) => React.ReactNode;
  renderMutualDots?: (count: number) => React.ReactNode;
  handleLoginClick?: () => void;
  isCompatibility?: boolean;
};

// Type guard to check if user is UserWithHobbies (browse mode)
function isUserWithHobbies(
  user: UserWithHobbies | CompatibleUser
): user is UserWithHobbies {
  return (
    Array.isArray(user.hobbies) &&
    user.hobbies.length > 0 &&
    (user.hobbies[0] as any).hobby !== undefined
  );
}

export default function UserCard({
  user,
  session,
  renderCompatibilityBadge,
  renderMutualDots,
  handleLoginClick,
  isCompatibility = false,
}: UserCardProps) {
  const [showAllHobbies, setShowAllHobbies] = useState(false);

  // Determine if user is from compatibility or browse
  const isBrowse =
    !isCompatibility &&
    "hobbies" in user &&
    Array.isArray(user.hobbies) &&
    user.hobbies[0] &&
    "hobby" in user.hobbies[0];
  return (
    <div className="bg-white rounded-[24px] p-6 shadow-md flex flex-col transition-all hover:-translate-y-1 hover:shadow-lg relative overflow-hidden group">
      {/* Decorative background pattern */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-pink-100 to-transparent rounded-bl-full opacity-50"></div>

      {/* Compatibility Score Badge - Only show when user is logged in */}
      {session && user.compatibilityScore !== undefined && (
        <div className="relative z-10">
          <div className="absolute right-0 top-0">
            {renderCompatibilityBadge(user.compatibilityScore)}
          </div>
        </div>
      )}

      <div className="flex flex-col items-center mb-4 relative z-10">
        <div className="mb-4 transform group-hover:scale-105 transition-transform duration-200">
          <Avatar
            src={user.image}
            alt={user.name || "User profile"}
            size={80}
            className="shadow-lg"
          />
        </div>

        <h2 className="text-xl font-semibold text-[#333] mb-2 text-center font-montserrat">
          {user.name}
        </h2>

        {/* Enhanced compatibility/interests display */}
        {user.compatibilityScore !== undefined ? (
          <div className="flex justify-center items-center gap-2 mb-4">
            <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-pink-100 to-red-100 rounded-full">
              <span className="text-sm font-medium text-[#FF3366]">
                {user.commonHobbies}
              </span>
              <span className="text-sm text-[#666]">
                {user.commonHobbies === 1 ? "sở thích chung" : "sở thích chung"}
              </span>
            </div>
          </div>
        ) : null}

        {/* Enhanced mutual connections display */}
        {renderMutualDots && (
          <div className="mb-4">
            {renderMutualDots(user.commonHobbies ?? 0)}
          </div>
        )}
      </div>

      {/* Enhanced hobbies section */}
      <div className="flex-1 mb-4">
        {isBrowse && user.hobbies && user.hobbies.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-[#666] mb-2 text-center">
              Sở thích
            </h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {(showAllHobbies ? user.hobbies : user.hobbies.slice(0, 3)).map(
                (userHobby: any) => (
                  <span
                    key={userHobby.hobbyId}
                    className="bg-gradient-to-r from-[#FFF0F3] to-[#FFE5EA] text-[#FF3366] rounded-full px-3 py-1 text-xs font-medium transition-all hover:shadow-sm"
                  >
                    {userHobby.hobby.name}
                  </span>
                )
              )}
              {user.hobbies.length > 3 && (
                <button
                  onClick={() => setShowAllHobbies(!showAllHobbies)}
                  className="text-[#666] text-xs hover:text-[#FF3366] transition-colors font-medium"
                >
                  {showAllHobbies
                    ? "Show less"
                    : `+${user.hobbies.length - 3} more`}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced action buttons */}
      <div className="flex gap-2 mt-auto">
        {session ? (
          <>
            <Link
              href={`/users/${user.id}`}
              className="flex-1 bg-gradient-to-r from-[#FF3366] to-[#FF6B8A] text-white text-center py-3 rounded-full font-medium transition-all hover:shadow-lg hover:scale-105 transform font-montserrat"
            >
              Xem hồ sơ
            </Link>
            <Link
              href={`/chat?userId=${user.id}`}
              className="px-4 py-3 bg-white border-2 border-[#FF3366] text-[#FF3366] rounded-full font-medium transition-all hover:bg-[#FF3366] hover:text-white hover:scale-105 transform font-montserrat"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </Link>
          </>
        ) : (
          <button
            onClick={handleLoginClick}
            className="w-full bg-gradient-to-r from-[#FF3366] to-[#FF6B8A] text-white py-3 rounded-full font-medium transition-all hover:shadow-lg hover:scale-105 transform font-montserrat"
          >
            Đăng nhập để tiếp tục
          </button>
        )}
      </div>
    </div>
  );
}
