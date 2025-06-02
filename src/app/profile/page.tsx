"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import LoginModal from "@/components/LoginModal";
import UserList from "@/components/UserList";
import Avatar from "@/components/Avatar";
import { HOBBY_CATEGORIES, getCategoryForHobby } from "@/lib/hobbyCategories";

type Hobby = {
  id: string;
  name: string;
};

// Maximum number of interests a user can select
const MAX_INTERESTS = 10;

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [allHobbies, setAllHobbies] = useState<Hobby[]>([]);
  const [userHobbies, setUserHobbies] = useState<Hobby[]>([]);
  const [selectedHobbyIds, setSelectedHobbyIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // User bio state
  const [bio, setBio] = useState("");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [bioError, setBioError] = useState<string | null>(null);
  const [showFullBio, setShowFullBio] = useState(false);

  // Follower related states
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);
  const [isLoadingFollowing, setIsLoadingFollowing] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("🌈 Tất cả danh mục");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const interestsPerPage = 12; // Show 12 interests per page (3 rows of 4)

  // Derived state for limit check
  const isLimitReached = selectedHobbyIds.length >= MAX_INTERESTS;

  // Filter hobbies based on search query and category
  const filteredHobbies = useMemo(() => {
    return allHobbies.filter((hobby) => {
      const matchesSearch =
        searchQuery === "" ||
        hobby.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "🌈 Tất cả danh mục" ||
        getCategoryForHobby(hobby.name) === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [allHobbies, searchQuery, selectedCategory]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredHobbies.length / interestsPerPage);

  // Get paginated interests
  const paginatedInterests = useMemo(() => {
    const start = (currentPage - 1) * interestsPerPage;
    const end = start + interestsPerPage;
    return filteredHobbies.slice(start, end);
  }, [filteredHobbies, currentPage]);

  // Reset pagination when search or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  // Fetch all available hobbies
  useEffect(() => {
    const fetchHobbies = async () => {
      try {
        const response = await fetch("/api/hobbies");
        if (!response.ok) {
          throw new Error("Failed to fetch hobbies");
        }
        const data = await response.json();
        setAllHobbies(data);
      } catch (error) {
        console.error("Error fetching hobbies:", error);
        setError("Failed to load interests. Please refresh and try again.");
      }
    };

    fetchHobbies();
  }, []);

  // Fetch user's current hobbies when logged in
  useEffect(() => {
    if (!session?.user) {
      setIsLoading(false);
      return;
    }

    const fetchUserHobbies = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/users/profile/hobbies");
        if (!response.ok) {
          throw new Error("Failed to fetch user hobbies");
        }
        const data = await response.json();
        setUserHobbies(data.hobbies || []);
        setSelectedHobbyIds(data.hobbies.map((hobby: Hobby) => hobby.id) || []);
      } catch (error) {
        console.error("Error fetching user hobbies:", error);
        setError(
          "Failed to load your interests. Please refresh and try again."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserHobbies();
  }, [session]);

  // Fetch user's bio and stats
  useEffect(() => {
    if (!session?.user) {
      return;
    }

    const fetchUserBio = async () => {
      try {
        const response = await fetch("/api/users/profile/bio");
        if (!response.ok) {
          throw new Error("Failed to fetch user bio");
        }
        const data = await response.json();
        setBio(data.bio || "");
      } catch (error) {
        console.error("Error fetching user bio:", error);
        setBioError("Failed to load your bio. Please refresh and try again.");
      }
    };

    const fetchUserStats = async () => {
      try {
        const response = await fetch("/api/users/profile/stats");
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

    fetchUserBio();
    fetchUserStats();
  }, [session]);

  // Function to fetch followers
  const fetchFollowers = async () => {
    setIsLoadingFollowers(true);
    try {
      const response = await fetch("/api/users/profile/followers");
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
      const response = await fetch("/api/users/profile/following");
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

  const handleLoginClick = () => {
    setIsLoginModalOpen(true);
  };

  const toggleHobbySelection = (hobbyId: string) => {
    setSelectedHobbyIds((prev) => {
      if (prev.includes(hobbyId)) {
        // Always allow deselection
        return prev.filter((id) => id !== hobbyId);
      } else {
        // Only allow selection if limit not reached
        if (prev.length >= MAX_INTERESTS) {
          return prev; // Return unchanged if limit reached
        }
        return [...prev, hobbyId];
      }
    });
  };

  const saveHobbies = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/users/profile/hobbies", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ hobbyIds: selectedHobbyIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update interests");
      }

      const data = await response.json();
      setUserHobbies(data.hobbies);
      setSuccessMessage("Your interests have been updated successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Error updating hobbies:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update interests"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle bio text change
  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBio(e.target.value);
  };

  // Save user bio
  const saveBio = async () => {
    setIsSavingBio(true);
    setBioError(null);

    try {
      const response = await fetch("/api/users/profile/bio", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bio }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update bio");
      }

      setIsEditingBio(false);
      // Show success message
      setSuccessMessage("Your bio has been updated successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Error updating bio:", error);
      setBioError(
        error instanceof Error ? error.message : "Failed to update bio"
      );
    } finally {
      setIsSavingBio(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F3] to-[#FFE5EA] pb-20 font-['Poppins'] py-6">
      <div className="max-w-[900px] mx-auto p-8 bg-white rounded-[20px] shadow-md">
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.back()}
            className="mr-auto flex items-center gap-2 text-[#666] hover:text-[#FF3366] transition-colors"
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
            Quay lại
          </button>
          <h1 className="text-2xl font-bold text-[#333] flex-grow text-center mr-12">
            Thông tin cá nhân
          </h1>
        </div>

        {!session ? (
          <div className="text-center py-12 bg-[#FFF0F3] rounded-[20px] shadow-sm">
            <h2 className="text-2xl font-semibold text-[#333] mb-4">
              Bạn chưa đăng nhập
            </h2>
            <p className="text-[#666] mb-6 max-w-lg mx-auto">
              Để truy cập trang cá nhân và quản lý sở thích của bạn, vui lòng
              đăng nhập. Chúng tôi sẽ giúp bạn kết nối với những người bạn có
              cùng sở thích.
            </p>
            <button
              onClick={handleLoginClick}
              className="bg-[#FF3366] text-white rounded-2xl py-3 px-8 font-medium transition-all hover:bg-[#E62E5C] shadow-md"
            >
              Đăng nhập
            </button>
          </div>
        ) : isLoading ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 border-4 border-[#FF3366] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#666]">Đang tải thông tin...</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* User Info */}
            <div className="flex flex-col items-center mb-10">
              {/* Large Avatar with enhanced design */}
              <div className="relative mb-6 group">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#FF3366] via-[#FF6B8A] to-[#FFB3C1] rounded-full blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                <div className="relative">
                  <Avatar
                    src={session.user?.image}
                    alt={session.user?.name || "User profile"}
                    size={144}
                    className="border-4 border-white shadow-xl group-hover:scale-105 transition-transform duration-300"
                    showOnlineStatus={true}
                    isOnline={true}
                  />
                  {/* Edit profile picture hint */}
                  <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-[#FF3366]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Name with enhanced typography */}
              <div className="text-center mb-6">
                <h2 className="text-4xl font-bold text-[#333] mb-2 font-poppins">
                  {session.user?.name}
                </h2>

                {/* Email with icon */}
                <div className="flex items-center justify-center gap-2 text-[#666] mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                  <span className="font-medium">{session.user?.email}</span>
                </div>

                {/* Stats with enhanced design */}
                <div className="flex items-center justify-center gap-6">
                  <button
                    onClick={handleOpenFollowers}
                    className="group flex flex-col items-center p-3 rounded-xl hover:bg-gradient-to-br hover:from-[#FF3366]/5 hover:to-[#FF6B8A]/5 transition-all duration-200 hover:scale-105"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-[#FF3366]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.196-2.121M9 20H4v-2a3 3 0 015.196-2.121M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a2 2 0 11-4 0 2 2 0 014 0zM7 2a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      <span className="text-2xl font-bold text-[#333] group-hover:text-[#FF3366] transition-colors">
                        {followerCount}
                      </span>
                    </div>
                    <span className="text-sm text-[#666] group-hover:text-[#FF3366] transition-colors font-medium">
                      {followerCount !== 1 ? "Followers" : "Follower"}
                    </span>
                  </button>

                  <div className="w-px h-12 bg-gradient-to-b from-gray-300 to-transparent"></div>

                  <button
                    onClick={handleOpenFollowing}
                    className="group flex flex-col items-center p-3 rounded-xl hover:bg-gradient-to-br hover:from-[#FF3366]/5 hover:to-[#FF6B8A]/5 transition-all duration-200 hover:scale-105"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-[#FF3366]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                      <span className="text-2xl font-bold text-[#333] group-hover:text-[#FF3366] transition-colors">
                        {followingCount}
                      </span>
                    </div>
                    <span className="text-sm text-[#666] group-hover:text-[#FF3366] transition-colors font-medium">
                      Following
                    </span>
                  </button>
                </div>
              </div>

              {/* Bio Section with enhanced design */}
              <div className="w-full max-w-2xl bg-gradient-to-br from-[#FFF9FB] to-[#FFF0F3] rounded-2xl p-6 mb-8 border border-[#FFE0E9] shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-[#FF3366]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <h3 className="font-bold text-[#333] text-lg">About Me</h3>
                  </div>
                  {!isEditingBio ? (
                    <button
                      onClick={() => setIsEditingBio(true)}
                      className="flex items-center gap-1 text-[#FF3366] text-sm font-medium hover:bg-[#FF3366]/10 px-3 py-1 rounded-lg transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditingBio(false)}
                        className="flex items-center gap-1 text-[#666] text-sm font-medium hover:bg-gray-100 px-3 py-1 rounded-lg transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        Cancel
                      </button>
                      <button
                        onClick={saveBio}
                        disabled={isSavingBio}
                        className={`flex items-center gap-1 text-white text-sm font-medium bg-[#FF3366] hover:bg-[#E62E5C] px-3 py-1 rounded-lg transition-colors ${
                          isSavingBio ? "opacity-70 cursor-not-allowed" : ""
                        }`}
                      >
                        {isSavingBio ? (
                          <>
                            <svg
                              className="animate-spin h-4 w-4"
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
                            Saving...
                          </>
                        ) : (
                          <>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Save
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {bioError && (
                  <div className="flex items-center gap-2 text-red-500 text-sm mb-3 bg-red-50 p-2 rounded-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {bioError}
                  </div>
                )}

                {isEditingBio ? (
                  <textarea
                    value={bio}
                    onChange={handleBioChange}
                    className="w-full p-4 border-2 border-[#FFD9E4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF3366]/20 focus:border-[#FF3366] transition-all duration-200 bg-white/80 backdrop-blur-sm font-medium resize-none"
                    rows={6}
                    placeholder="Tell people about yourself... What are your passions? What makes you unique? 🌟"
                  />
                ) : (
                  <div>
                    {bio ? (
                      <div className="prose max-w-none">
                        {showFullBio || bio.length <= 200 ? (
                          <p className="whitespace-pre-wrap text-[#666] leading-relaxed font-medium">
                            {bio}
                          </p>
                        ) : (
                          <>
                            <p className="whitespace-pre-wrap text-[#666] leading-relaxed font-medium">
                              {bio.substring(0, 200)}...
                            </p>
                            <button
                              onClick={() => setShowFullBio(true)}
                              className="text-[#FF3366] text-sm mt-2 hover:underline font-medium inline-flex items-center gap-1"
                            >
                              Read more
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </button>
                          </>
                        )}

                        {showFullBio && bio.length > 200 && (
                          <button
                            onClick={() => setShowFullBio(false)}
                            className="text-[#FF3366] text-sm mt-2 hover:underline font-medium inline-flex items-center gap-1"
                          >
                            Show less
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 15l7-7 7 7"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-[#999] italic bg-white/50 p-4 rounded-xl border border-dashed border-gray-300">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                        <div>
                          <p className="font-medium">No bio yet</p>
                          <p className="text-sm">
                            Click edit to tell people about yourself!
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Interests Section */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 bg-gradient-to-b from-[#FF3366] to-[#FF6B8A] rounded-full"></div>
                  <h3 className="text-2xl font-bold text-[#333] font-poppins">
                    Sở thích của bạn
                  </h3>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 border border-gray-200 shadow-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 ${
                      isLimitReached ? "text-red-500" : "text-[#FF3366]"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-[#666]">
                    <span
                      className={`font-bold ${
                        isLimitReached ? "text-red-500" : "text-[#FF3366]"
                      }`}
                    >
                      {selectedHobbyIds.length}
                    </span>
                    <span> / {MAX_INTERESTS}</span>
                  </span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-red-500 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-600 p-4 rounded-xl mb-6 flex items-center gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-500 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="font-medium">{successMessage}</span>
                </div>
              )}

              {isLimitReached && (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 p-5 rounded-xl mb-6 flex items-start gap-4">
                  <div className="text-red-500 flex-shrink-0 mt-0.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-6 h-6"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-red-600 font-medium">
                      Tối đa số sở thích đã được chọn
                    </p>
                    <p className="text-red-500 text-sm">
                      Bạn chỉ có thể chọn tối đa {MAX_INTERESTS} sở thích.
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-5 rounded-xl mb-8">
                <div className="flex items-start gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="text-blue-700 font-medium mb-1">
                      Chọn sở thích của bạn!
                    </p>
                    <p className="text-blue-600 text-sm leading-relaxed">
                      Bạn có thể chọn tối đa {MAX_INTERESTS} sở thích. Hãy chọn
                      những sở thích mà bạn yêu thích nhất để kết nối với những
                      người có cùng đam mê. Nhấn vào các sở thích bên dưới để
                      thêm hoặc bỏ chọn.
                    </p>
                  </div>
                </div>
              </div>

              {/* Selected Interests */}
              {selectedHobbyIds.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-[#FF3366]"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    <h4 className="font-bold text-[#333] text-lg">
                      Your Selected Interests
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {userHobbies
                      .filter((hobby) => selectedHobbyIds.includes(hobby.id))
                      .map((hobby, index) => (
                        <div
                          key={hobby.id}
                          className="group bg-gradient-to-r from-[#FF3366] to-[#FF6B8A] text-white px-5 py-3 rounded-full flex items-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 border-2 border-white"
                          style={{
                            animationDelay: `${index * 100}ms`,
                          }}
                        >
                          <span className="text-sm font-medium">
                            #{hobby.name}
                          </span>
                          <button
                            onClick={() => toggleHobbySelection(hobby.id)}
                            className="ml-3 flex items-center justify-center hover:bg-white/20 rounded-full w-6 h-6 transition-colors group-hover:rotate-90 transform transition-transform duration-200"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                              className="w-4 h-4"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Search and Filter */}
              <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="search-interests"
                    className="block text-sm font-bold text-[#333] mb-2 flex items-center gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-[#FF3366]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    Tìm kiếm sở thích
                  </label>
                  <div className="relative">
                    <input
                      id="search-interests"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Nhập sở thích..."
                      className="w-full px-4 py-3 pl-12 pr-10 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF3366]/20 focus:border-[#FF3366] transition-all duration-200 bg-gray-50 focus:bg-white font-medium placeholder:text-gray-400"
                    />
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="category-filter"
                    className="block text-sm font-bold text-[#333] mb-2 flex items-center gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-[#FF3366]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                      />
                    </svg>
                    Lọc theo danh mục
                  </label>
                  <select
                    id="category-filter"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF3366]/20 focus:border-[#FF3366] transition-all duration-200 bg-gray-50 focus:bg-white font-medium"
                  >
                    {HOBBY_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Interests Grid */}
              <div
                className={`rounded-2xl p-6 mb-8 transition-all duration-300 ${
                  isLimitReached
                    ? "border-2 border-red-300 bg-gradient-to-br from-red-50 to-orange-50"
                    : "border-2 border-gray-100 bg-gradient-to-br from-gray-50 to-white"
                }`}
              >
                {filteredHobbies.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-500 font-medium mb-1">
                      Không tìm thấy sở thích nào
                    </p>
                    <p className="text-gray-400 text-sm">
                      Hãy thử điều chỉnh tiêu chí tìm kiếm hoặc lọc của bạn
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {filteredHobbies.map((hobby, index) => {
                      const isSelected = selectedHobbyIds.includes(hobby.id);
                      const isDisabled = !isSelected && isLimitReached;

                      return (
                        <div
                          key={hobby.id}
                          onClick={() =>
                            !isDisabled && toggleHobbySelection(hobby.id)
                          }
                          className={`py-3 px-6 rounded-xl font-medium transition-all duration-200 cursor-pointer group relative overflow-hidden
                            ${
                              isSelected
                                ? "bg-gradient-to-r from-[#FF3366] to-[#FF6B8A] text-white hover:from-[#E62E5C] hover:to-[#FF5577] shadow-lg hover:shadow-xl transform hover:scale-105"
                                : isDisabled
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-300"
                                : "bg-white text-[#666] border-2 border-gray-200 hover:border-[#FF3366] hover:text-[#FF3366] hover:shadow-md transform hover:scale-105 hover:bg-gradient-to-r hover:from-[#FFF0F3] hover:to-[#FFE5EA]"
                            }`}
                          style={{
                            animationDelay: `${index * 50}ms`,
                          }}
                        >
                          <span className="relative z-10">#{hobby.name}</span>
                          {isSelected && (
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-center">
                <button
                  onClick={saveHobbies}
                  disabled={isSaving}
                  className={`bg-gradient-to-r from-[#FF3366] to-[#FF6B8A] text-white rounded-2xl py-4 px-12 font-bold text-lg transition-all duration-200 hover:from-[#E62E5C] hover:to-[#FF5577] shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-3 ${
                    isSaving ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {isSaving ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
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
                      Lưu sở thích...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Save Interests
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Compatibility Info */}
            <div className="bg-gradient-to-br from-[#FFF0F3] via-[#FFF8FA] to-[#FFE5EA] rounded-2xl p-8 mb-8 border border-[#FFD6DD] shadow-sm">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-[#FF3366] to-[#FF6B8A] rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#333] mb-2">
                    Smart Compatibility Matching
                  </h3>
                  <p className="text-[#666] mb-3 leading-relaxed">
                    Thuật toán nâng cao của chúng tôi sử dụng sở thích bạn đã
                    chọn để tìm những người có cùng đam mê và sở thích.
                  </p>
                  <p className="text-[#666] mb-4 leading-relaxed">
                    Bạn chọn càng nhiều sở thích, chúng tôi càng tìm được những
                    kết quả phù hợp và chính xác hơn cho bạn! ✨
                  </p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-[#FF3366] font-bold hover:text-[#E62E5C] transition-colors group"
                  >
                    <span>Khám phá những người phù hợp với bạn</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md shadow-2xl z-20 border-t border-gray-100">
        <ul className="flex justify-around list-none p-4">
          <li className="flex-1">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 text-[#666] no-underline font-medium p-3 rounded-xl transition-all duration-200 hover:bg-gray-100 hover:text-[#FF3366]"
            >
              <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <span className="text-sm">Trang chủ</span>
            </Link>
          </li>
          <li className="flex-1">
            <Link
              href="/profile"
              className="flex items-center justify-center gap-2 text-[#FF3366] font-medium no-underline p-3 rounded-xl transition-all duration-200 hover:bg-[#FF3366]/10"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-[#FF3366] to-[#FF6B8A] rounded-xl flex items-center justify-center shadow-md">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <span className="text-sm font-bold">Hồ sơ</span>
            </Link>
          </li>
          <li className="flex-1">
            <Link
              href="/chat"
              className="flex items-center justify-center gap-2 text-[#666] no-underline font-medium p-3 rounded-xl transition-all duration-200 hover:bg-gray-100 hover:text-[#FF3366]"
              onClick={(e) =>
                !session && (e.preventDefault(), handleLoginClick())
              }
            >
              <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <span className="text-sm">Trò chuyện</span>
            </Link>
          </li>
          <li className="flex-1">
            <Link
              href="/love-note"
              className="flex items-center justify-center gap-2 text-[#666] no-underline font-medium p-3 rounded-xl transition-all duration-200 hover:bg-gray-100 hover:text-[#FF3366]"
              onClick={(e) =>
                !session && (e.preventDefault(), handleLoginClick())
              }
            >
              <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <span className="text-sm">Ghi chú</span>
            </Link>
          </li>
          {session && (
            <li className="flex-1">
              <button
                onClick={() => signOut()}
                className="flex items-center justify-center gap-2 text-gray-500 font-medium hover:text-[#FF3366] p-3 rounded-xl transition-all duration-200 hover:bg-gray-100 w-full"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </div>
                <span className="text-sm">Đăng xuất</span>
              </button>
            </li>
          )}
        </ul>
      </nav>

      {/* Modals */}
      {showFollowers && (
        <UserList
          title="Followers"
          users={followers}
          isLoading={isLoadingFollowers}
          emptyMessage="You don't have any followers yet."
          onClose={() => setShowFollowers(false)}
        />
      )}

      {showFollowing && (
        <UserList
          title="Following"
          users={following}
          isLoading={isLoadingFollowing}
          emptyMessage="You're not following anyone yet."
          onClose={() => setShowFollowing(false)}
        />
      )}

      {isLoginModalOpen && (
        <LoginModal onClose={() => setIsLoginModalOpen(false)} />
      )}

      {/* Custom CSS for glassmorphism effects */}
      <style jsx>{`
        .backdrop-blur-md {
          backdrop-filter: blur(12px);
        }
        .bg-white\\/95 {
          background-color: rgba(255, 255, 255, 0.95);
        }
      `}</style>
    </div>
  );
}
