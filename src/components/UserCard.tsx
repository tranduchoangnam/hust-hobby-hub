import Link from "next/link";
import Image from "next/image";
import { Session } from "next-auth";
import { useState } from "react";

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
    <div className="bg-white rounded-[24px] p-6 shadow-md flex flex-col transition-all hover:-translate-y-1 hover:shadow-lg">
      {/* Compatibility Score Badge - Only show when user is logged in */}
      {session && user.compatibilityScore !== undefined && (
        <div className="relative">
          <div className="absolute right-0 top-0">
            {renderCompatibilityBadge(user.compatibilityScore)}
          </div>
        </div>
      )}

      <div className="w-20 h-20 rounded-full bg-[#f5f5f5] mb-4 self-center overflow-hidden border-2 border-white shadow-sm">
        {user.image && (
          <Image
            src={user.image}
            alt={user.name || "User profile"}
            width={80}
            height={80}
            className="object-cover w-full h-full"
          />
        )}
      </div>
      <div>
        <h2 className="text-xl font-semibold text-[#333] mb-2 text-center">
          {user.name}
        </h2>
        {/* Subtitle for browse mode */}
        {isBrowse && isUserWithHobbies(user) && (
          <p className="text-sm text-[#666] mb-4 text-center">
            {user.hobbies.length > 0
              ? `${user.hobbies[0].hobby.name} ${
                  user.hobbies.length > 1 ? "and" : ""
                } ${
                  user.hobbies.length > 1 ? user.hobbies[1].hobby.name : ""
                } enthusiast`
              : "New user"}
          </p>
        )}
        {/* Subtitle for compatibility mode */}
        {!isBrowse && (
          <div className="flex justify-center items-center gap-1 mb-4">
            <span className="text-sm font-medium text-[#FF3366]">
              {user.commonHobbies}
            </span>
            <span className="text-sm text-[#666]">
              {user.commonHobbies === 1
                ? "shared interest"
                : "shared interests"}
            </span>
          </div>
        )}

        {/* Hobbies display */}
        <div className="relative mb-4">
          <div
            className={`flex flex-wrap justify-center gap-2 transition-all ${
              showAllHobbies ? "max-h-none" : "max-h-16 overflow-hidden"
            }`}
            style={{ minHeight: "2.5rem" }}
          >
            {(() => {
              const tags =
                isBrowse && isUserWithHobbies(user)
                  ? user.hobbies.map((uh) => ({
                      key: uh.hobbyId,
                      label: uh.hobby.name,
                    }))
                  : user.hobbies.map((hobby: any) => ({
                      key: hobby.id,
                      label: hobby.name,
                    }));
              if (showAllHobbies || tags.length <= 3) {
                return tags.map((tag) => (
                  <span
                    key={tag.key}
                    className="bg-[#FFF0F3] text-[#FF3366] rounded-2xl px-3 py-1 text-sm font-medium"
                  >
                    {tag.label}
                  </span>
                ));
              } else {
                return [
                  ...tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag.key}
                      className="bg-[#FFF0F3] text-[#FF3366] rounded-2xl px-3 py-1 text-sm font-medium"
                    >
                      {tag.label}
                    </span>
                  )),
                  <button
                    key="more"
                    className="bg-[#FFF0F3] text-[#FF3366] rounded-2xl px-3 py-1 text-sm font-medium focus:outline-none"
                    onClick={() => setShowAllHobbies(true)}
                    type="button"
                  >
                    +{tags.length - 3} more
                  </button>,
                ];
              }
            })()}
          </div>
          {/* Hide button when expanded */}
          {showAllHobbies &&
            ((isBrowse && isUserWithHobbies(user) && user.hobbies.length > 3) ||
              (!isBrowse && user.hobbies.length > 3)) && (
              <div className="flex justify-center mt-2">
                <button
                  className="text-[#FF3366] font-medium text-sm bg-white rounded-full px-4 py-1 shadow"
                  onClick={() => setShowAllHobbies(false)}
                  type="button"
                >
                  Hide
                </button>
              </div>
            )}
        </div>

        {/* Mutual interests (browse mode) */}
        {isBrowse && (
          <div className="flex items-center gap-2 mb-6">
            {session && user.commonHobbies !== undefined ? (
              <>
                <span className="text-sm font-medium text-[#FF3366]">
                  {user.commonHobbies}
                </span>
                <span className="text-sm text-[#666]">
                  {user.commonHobbies === 1
                    ? "shared interest"
                    : "shared interests"}
                </span>
              </>
            ) : (
              <>
                <span className="text-sm text-[#666]">
                  {Math.min(user.hobbies.length, 3)}
                </span>
                <span className="text-sm text-[#666]">mutual interests</span>
              </>
            )}
            <div className="ml-auto">
              {renderMutualDots &&
                (session && user.commonHobbies !== undefined
                  ? renderMutualDots(Math.min(user.commonHobbies, 3))
                  : renderMutualDots(Math.min(user.hobbies.length, 3)))}
            </div>
          </div>
        )}

        {/* Action buttons always at bottom */}
        <div className="flex gap-2 mt-auto">
          <Link
            href={session ? `/users/${user.id}` : "#"}
            onClick={(e) =>
              !session &&
              handleLoginClick &&
              (e.preventDefault(), handleLoginClick())
            }
            className="flex-1 text-center bg-transparent text-[#FF3366] border-2 border-[#FF3366] rounded-2xl py-2 px-4 font-medium transition-all hover:bg-[#FFF0F3]"
          >
            Profile
          </Link>
          <Link
            href={session ? `/chat?userId=${user.id}` : "#"}
            onClick={(e) =>
              !session &&
              handleLoginClick &&
              (e.preventDefault(), handleLoginClick())
            }
            className="flex-1 text-center bg-[#FF3366] text-white border-2 border-[#FF3366] rounded-2xl py-2 px-4 font-medium transition-all hover:bg-[#E62E5C]"
          >
            Chat
          </Link>
        </div>
      </div>
    </div>
  );
}
