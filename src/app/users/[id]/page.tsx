"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import LoginModal from "@/components/LoginModal";
import UserList from "@/components/UserList";

type UserCompatibility = {
  compatibility: {
    score: number;
    commonHobbies: Array<{
      id: string;
      name: string;
    }>;
    commonHobbyCount: number;
    userHobbyCount: number;
    targetUserHobbyCount: number;
  };
  targetUser: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    bio?: string | null;
    hobbies: Array<{
      id: string;
      name: string;
    }>;
  };
};

export default function UserProfilePage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [userCompatibility, setUserCompatibility] =
    useState<UserCompatibility | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [showFullBio, setShowFullBio] = useState(false);

  // Followers/following state
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);
  const [isLoadingFollowing, setIsLoadingFollowing] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      setIsLoading(false);
      return;
    }

    const fetchUserCompatibility = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/users/${userId}/compatibility`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("User not found");
          } else {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }
        }
        const data = await response.json();
        setUserCompatibility(data);
      } catch (error) {
        console.error("Error fetching user compatibility:", error);
        setError(
          error instanceof Error ? error.message : "An unknown error occurred"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserCompatibility();
  }, [session, userId]);

  // Fetch follow status and stats
  useEffect(() => {
    if (!session?.user || !userId) {
      return;
    }

    const fetchFollowStatus = async () => {
      try {
        const response = await fetch(`/api/users/${userId}/follow`);
        if (!response.ok) {
          throw new Error("Failed to fetch follow status");
        }
        const data = await response.json();
        setIsFollowing(data.isFollowing || false);
        setFollowerCount(data.followerCount || 0);
      } catch (error) {
        console.error("Error fetching follow status:", error);
      }
    };

    const fetchUserStats = async () => {
      try {
        const response = await fetch(`/api/users/${userId}/stats`);
        if (!response.ok) {
          throw new Error("Failed to fetch user stats");
        }
        const data = await response.json();
        setFollowerCount(data.followerCount || 0);
        setFollowingCount(data.followingCount || 0);
      } catch (error) {
        console.error("Error fetching user stats:", error);
      }
    };

    fetchFollowStatus();
    fetchUserStats();
  }, [session, userId]);

  const handleLoginClick = () => {
    setIsLoginModalOpen(true);
  };

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!session?.user) {
      setIsLoginModalOpen(true);
      return;
    }

    setIsFollowLoading(true);

    try {
      const method = isFollowing ? "DELETE" : "POST";
      const response = await fetch(`/api/users/${userId}/follow`, {
        method,
      });

      if (!response.ok) {
        throw new Error(
          `Failed to ${isFollowing ? "unfollow" : "follow"} user`
        );
      }

      // Update states
      setIsFollowing(!isFollowing);
      setFollowerCount((prevCount) =>
        isFollowing ? prevCount - 1 : prevCount + 1
      );
    } catch (error) {
      console.error(
        `Error ${isFollowing ? "unfollowing" : "following"} user:`,
        error
      );
    } finally {
      setIsFollowLoading(false);
    }
  };

  // Function to render compatibility badge
  const renderCompatibilityBadge = (score: number) => {
    let color = "bg-gray-200 text-gray-700";
    let text = "Low Match";

    if (score >= 80) {
      color = "bg-green-100 text-green-800";
      text = "Perfect Match";
    } else if (score >= 60) {
      color = "bg-blue-100 text-blue-800";
      text = "Great Match";
    } else if (score >= 40) {
      color = "bg-yellow-100 text-yellow-700";
      text = "Good Match";
    } else if (score >= 20) {
      color = "bg-orange-100 text-orange-700";
      text = "Fair Match";
    } else {
      color = "bg-red-100 text-red-700";
      text = "Low Match";
    }

    return (
      <div
        className={`px-4 py-2 rounded-full text-sm font-semibold ${color} flex items-center justify-center gap-2`}
      >
        <span className="font-bold text-lg">{score}%</span>
        <span>{text}</span>
      </div>
    );
  };

  // Function to fetch followers
  const fetchFollowers = async () => {
    setIsLoadingFollowers(true);
    try {
      const response = await fetch(`/api/users/${userId}/followers`);
      if (!response.ok) {
        throw new Error("Failed to fetch followers");
      }
      const data = await response.json();
      setFollowers(data);
    } catch (error) {
      console.error("Error fetching followers:", error);
    } finally {
      setIsLoadingFollowers(false);
    }
  };

  // Function to fetch following
  const fetchFollowing = async () => {
    setIsLoadingFollowing(true);
    try {
      const response = await fetch(`/api/users/${userId}/following`);
      if (!response.ok) {
        throw new Error("Failed to fetch following");
      }
      const data = await response.json();
      setFollowing(data);
    } catch (error) {
      console.error("Error fetching following:", error);
    } finally {
      setIsLoadingFollowing(false);
    }
  };

  // Handle opening followers modal
  const handleOpenFollowers = () => {
    setShowFollowers(true);
    fetchFollowers();
  };

  // Handle opening following modal
  const handleOpenFollowing = () => {
    setShowFollowing(true);
    fetchFollowing();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F3] to-[#FFE5EA] pb-20 font-['Poppins']">
      <div className="max-w-[900px] mx-auto p-8 bg-white rounded-[20px] shadow-md my-6">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-[#666] hover:text-[#FF3366] transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {!session ? (
          <div className="text-center py-12 bg-[#FFF0F3] rounded-[20px] shadow-sm">
            <h2 className="text-2xl font-semibold text-[#333] mb-4">
              Sign In Required
            </h2>
            <p className="text-[#666] mb-6 max-w-lg mx-auto">
              Please sign in to view user profiles and compatibility details.
            </p>
            <button
              onClick={handleLoginClick}
              className="bg-[#FF3366] text-white rounded-2xl py-3 px-8 font-medium transition-all hover:bg-[#E62E5C] shadow-md"
            >
              Sign In
            </button>
          </div>
        ) : isLoading ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 border-4 border-[#FF3366] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#666]">Loading user profile...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-red-50 rounded-[20px] shadow-sm">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => router.back()}
              className="bg-[#FF3366] text-white rounded-2xl py-2 px-6 font-medium transition-all hover:bg-[#E62E5C]"
            >
              Go Back
            </button>
          </div>
        ) : userCompatibility ? (
          <div className="flex flex-col">
            {/* User Info Section */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8">
              {/* Large Avatar */}
              <div className="w-36 h-36 rounded-full bg-[#f5f5f5] overflow-hidden border-4 border-[#FFE0E9] shadow-lg flex-shrink-0 hover:scale-105 transition-transform">
                {userCompatibility.targetUser.image && (
                  <Image
                    src={userCompatibility.targetUser.image}
                    alt={userCompatibility.targetUser.name || "User profile"}
                    width={144}
                    height={144}
                    className="object-cover w-full h-full"
                  />
                )}
              </div>

              <div className="flex-grow text-center md:text-left">
                {/* User Name */}
                <h1 className="text-3xl font-bold text-[#333] mb-2">
                  {userCompatibility.targetUser.name}
                </h1>

                {/* Follower Count and Compatibility */}
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div className="inline-block">
                    {renderCompatibilityBadge(
                      userCompatibility.compatibility.score
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleOpenFollowers}
                      className="text-[#666] hover:text-[#FF3366] hover:underline transition-colors"
                    >
                      <span className="font-medium">{followerCount}</span>{" "}
                      follower{followerCount !== 1 ? "s" : ""}
                    </button>
                    <span className="w-1 h-1 bg-[#999] rounded-full"></span>
                    <button
                      onClick={handleOpenFollowing}
                      className="text-[#666] hover:text-[#FF3366] hover:underline transition-colors"
                    >
                      <span className="font-medium">{followingCount}</span>{" "}
                      following
                    </button>
                  </div>
                </div>

                {/* Bio Section */}
                {userCompatibility.targetUser.bio && (
                  <div className="bg-[#FFF9FB] rounded-xl p-4 mb-6 text-left shadow-sm">
                    <h3 className="font-semibold text-[#333] mb-2">Bio</h3>
                    <div className="prose text-[#666]">
                      {showFullBio ||
                      userCompatibility.targetUser.bio.length <= 200 ? (
                        <p className="whitespace-pre-wrap">
                          {userCompatibility.targetUser.bio}
                        </p>
                      ) : (
                        <>
                          <p className="whitespace-pre-wrap">
                            {userCompatibility.targetUser.bio.substring(0, 200)}
                            ...
                          </p>
                          <button
                            onClick={() => setShowFullBio(true)}
                            className="text-[#FF3366] text-sm mt-1 hover:underline"
                          >
                            Read more
                          </button>
                        </>
                      )}

                      {showFullBio &&
                        userCompatibility.targetUser.bio.length > 200 && (
                          <button
                            onClick={() => setShowFullBio(false)}
                            className="text-[#FF3366] text-sm mt-1 hover:underline"
                          >
                            Show less
                          </button>
                        )}
                    </div>
                  </div>
                )}

                {/* Interests as tags/chips */}
                <div className="flex flex-wrap gap-3 mb-6">
                  {userCompatibility.targetUser.hobbies.map((hobby) => (
                    <span
                      key={hobby.id}
                      className={`px-4 py-2 rounded-full text-sm font-medium shadow-sm ${
                        userCompatibility.compatibility.commonHobbies.some(
                          (h) => h.id === hobby.id
                        )
                          ? "bg-[#FFE0E9] text-[#FF3366] border-2 border-[#FF3366]"
                          : "bg-[#F5F5F5] text-[#666]"
                      }`}
                    >
                      {hobby.name}
                    </span>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex flex-wrap gap-4 justify-center md:justify-start">
                  {/* Follow/Unfollow Button */}
                  {session.user.id !== userId && (
                    <button
                      onClick={handleFollowToggle}
                      disabled={isFollowLoading}
                      className={`${
                        isFollowing
                          ? "bg-white text-[#666] border-2 border-[#666]"
                          : "bg-[#FF3366] text-white"
                      } rounded-2xl py-2 px-6 font-medium transition-all hover:opacity-90 shadow-sm flex items-center gap-2`}
                    >
                      {isFollowLoading ? (
                        <span className="flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        </span>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          {isFollowing ? (
                            <path d="M17 7l-10 10M7 7l10 10" />
                          ) : (
                            <path d="M12 5v14M5 12h14" />
                          )}
                        </svg>
                      )}
                      {isFollowing ? "Unfollow" : "Follow"}
                    </button>
                  )}

                  <Link
                    href={`/chat/${userCompatibility.targetUser.id}`}
                    className="bg-[#FF3366] text-white rounded-2xl py-2 px-6 font-medium transition-all hover:bg-[#E62E5C]"
                  >
                    Send Message
                  </Link>
                  <Link
                    href={`/love-note/new?recipient=${userCompatibility.targetUser.id}`}
                    className="bg-transparent text-[#FF3366] border-2 border-[#FF3366] rounded-2xl py-2 px-6 font-medium transition-all hover:bg-[#FFF0F3]"
                  >
                    Send Love Note
                  </Link>
                </div>
              </div>
            </div>

            {/* Compatibility Details */}
            <div className="bg-[#FFF0F3] rounded-[20px] p-6 mb-8">
              <h2 className="text-xl font-semibold text-[#333] mb-4">
                Compatibility Details
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[#666]">Compatibility Score</span>
                  <span className="font-bold text-[#FF3366]">
                    {userCompatibility.compatibility.score}%
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#666]">Shared Interests</span>
                  <span className="font-bold text-[#FF3366]">
                    {userCompatibility.compatibility.commonHobbyCount}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#666]">Your Interests</span>
                  <span className="font-bold text-[#666]">
                    {userCompatibility.compatibility.userHobbyCount}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#666]">
                    {userCompatibility.targetUser.name}'s Interests
                  </span>
                  <span className="font-bold text-[#666]">
                    {userCompatibility.compatibility.targetUserHobbyCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Shared Interests Section */}
            {userCompatibility.compatibility.commonHobbyCount > 0 && (
              <div className="bg-white rounded-[20px] border border-[#FFE0E9] p-6">
                <h2 className="text-xl font-semibold text-[#333] mb-4">
                  Shared Interests
                </h2>

                <div className="flex flex-wrap gap-3">
                  {userCompatibility.compatibility.commonHobbies.map(
                    (hobby) => (
                      <div
                        key={hobby.id}
                        className="bg-[#FFE0E9] text-[#FF3366] rounded-full px-5 py-2 text-sm font-medium shadow-sm"
                      >
                        {hobby.name}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-white shadow-md z-10">
        <ul className="flex justify-around list-none p-4">
          <li>
            <Link href="/" className="text-[#666] font-medium no-underline">
              Browse
            </Link>
          </li>
          <li>
            <Link
              href="/compatibility"
              className="text-[#666] no-underline font-medium"
            >
              Matches
            </Link>
          </li>
          <li>
            <Link
              href="/chat"
              className="text-[#666] no-underline font-medium"
              onClick={(e) =>
                !session && (e.preventDefault(), handleLoginClick())
              }
            >
              Chat
            </Link>
          </li>
          <li>
            <Link
              href="/love-note"
              className="text-[#666] no-underline font-medium"
              onClick={(e) =>
                !session && (e.preventDefault(), handleLoginClick())
              }
            >
              Love Note
            </Link>
          </li>
        </ul>
      </nav>

      {/* Modals */}
      {showFollowers && userCompatibility && (
        <UserList
          title={`${userCompatibility.targetUser.name}'s Followers`}
          users={followers}
          isLoading={isLoadingFollowers}
          emptyMessage="This user doesn't have any followers yet."
          onClose={() => setShowFollowers(false)}
        />
      )}

      {showFollowing && userCompatibility && (
        <UserList
          title={`${userCompatibility.targetUser.name} is Following`}
          users={following}
          isLoading={isLoadingFollowing}
          emptyMessage="This user isn't following anyone yet."
          onClose={() => setShowFollowing(false)}
        />
      )}

      {isLoginModalOpen && (
        <LoginModal onClose={() => setIsLoginModalOpen(false)} />
      )}
    </div>
  );
}
