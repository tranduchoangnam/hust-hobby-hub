"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Prisma } from "@prisma/client";
import LoginModal from "@/components/LoginModal";
import { HOBBY_CATEGORIES, getCategoryForHobby } from "@/lib/hobbyCategories";
import UserCard from "../components/UserCard";
import Avatar from "../components/Avatar";

// Type for users with their hobbies
type UserWithHobbies = Prisma.UserGetPayload<{
  include: {
    hobbies: {
      include: {
        hobby: true;
      };
    };
  };
}> & {
  compatibilityScore?: number;
  commonHobbies?: number;
};

// Type for compatible user
type CompatibleUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  hobbies: {
    id: string;
    name: string;
  }[];
  commonHobbies: number;
  compatibilityScore: number;
};

export default function Home() {
  const { data: session } = useSession();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [hobbies, setHobbies] = useState<{ id: string; name: string }[]>([]);
  const [userHobbies, setUserHobbies] = useState<
    { id: string; name: string }[]
  >([]);
  const [selectedHobby, setSelectedHobby] = useState<string | null>(null);
  const [users, setUsers] = useState<UserWithHobbies[]>([]);
  const [compatibleUsers, setCompatibleUsers] = useState<CompatibleUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"browse" | "compatibility">(
    "browse"
  );
  const [showOnlyUserInterests, setShowOnlyUserInterests] =
    useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] =
    useState("🌈 Tất cả danh mục");

  // Pagination state for users
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const usersPerPage = 10;

  // Pagination state for interests
  const [currentInterestPage, setCurrentInterestPage] = useState(1);
  const interestsPerPage = 15;

  // Pagination state for compatible users
  const [currentCompatiblePage, setCurrentCompatiblePage] = useState(1);
  const compatibleUsersPerPage = 6;
  const totalCompatiblePages = Math.ceil(
    compatibleUsers.length / compatibleUsersPerPage
  );
  const paginatedCompatibleUsers = useMemo(() => {
    const start = (currentCompatiblePage - 1) * compatibleUsersPerPage;
    const end = start + compatibleUsersPerPage;
    return compatibleUsers.slice(start, end);
  }, [compatibleUsers, currentCompatiblePage]);
  useEffect(() => {
    setCurrentCompatiblePage(1);
  }, [viewMode, compatibleUsers.length]);

  // Fetch hobbies on mount
  useEffect(() => {
    const fetchHobbies = async () => {
      try {
        const response = await fetch("/api/hobbies");
        const data = await response.json();
        setHobbies(data);
      } catch (error) {
        console.error("Error fetching hobbies:", error);
      }
    };

    fetchHobbies();
  }, []);

  // Fetch user's hobbies when logged in
  useEffect(() => {
    if (!session?.user) return;

    const fetchUserHobbies = async () => {
      try {
        const response = await fetch("/api/users/profile/hobbies");
        if (!response.ok) {
          throw new Error("Failed to fetch user hobbies");
        }
        const data = await response.json();
        setUserHobbies(data.hobbies || []);
      } catch (error) {
        console.error("Error fetching user hobbies:", error);
      }
    };

    fetchUserHobbies();
  }, [session]);

  // Fetch users when a hobby is selected
  useEffect(() => {
    if (!selectedHobby || viewMode !== "browse") return;

    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/users?hobbyId=${selectedHobby}&page=${currentPage}&limit=${usersPerPage}`
        );
        const data = await response.json();
        setUsers(data.users);
        setTotalPages(data.pagination.pages);
        setTotalUsers(data.pagination.total);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [selectedHobby, viewMode, currentPage]);

  // Fetch compatibility users when in compatibility mode
  useEffect(() => {
    if (!session?.user || viewMode !== "compatibility") return;

    const fetchCompatibleUsers = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/users/compatibility");
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        setCompatibleUsers(data.users || []);
      } catch (error) {
        console.error("Error fetching compatible users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompatibleUsers();
  }, [session, viewMode]);

  // Cập nhật displayedHobbies để lọc theo category
  const displayedHobbies = useMemo(() => {
    let filteredHobbies = hobbies;

    // Filter theo interests của user nếu bật
    if (session && showOnlyUserInterests && userHobbies.length > 0) {
      const userHobbiesIds = userHobbies.map((hobby) => hobby.id);
      filteredHobbies = hobbies.filter((hobby) =>
        userHobbiesIds.includes(hobby.id)
      );
    }

    // Filter theo search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filteredHobbies = filteredHobbies.filter((hobby) =>
        hobby.name.toLowerCase().includes(query)
      );
    }

    // Filter theo category
    if (selectedCategory !== "🌈 Tất cả danh mục") {
      filteredHobbies = filteredHobbies.filter(
        (hobby) => getCategoryForHobby(hobby.name) === selectedCategory
      );
    }

    return filteredHobbies;
  }, [
    hobbies,
    userHobbies,
    showOnlyUserInterests,
    session,
    searchQuery,
    selectedCategory,
  ]);

  // Calculate total pages for interests
  const totalInterestPages = Math.ceil(
    displayedHobbies.length / interestsPerPage
  );

  // Get paginated interests
  const paginatedInterests = useMemo(() => {
    const start = (currentInterestPage - 1) * interestsPerPage;
    const end = start + interestsPerPage;
    return displayedHobbies.slice(start, end);
  }, [displayedHobbies, currentInterestPage]);

  const handleHobbySelect = (hobbyId: string) => {
    setSelectedHobby(hobbyId);
    setViewMode("browse");
  };

  const handleLoginClick = () => {
    if (session) return;
    setIsLoginModalOpen(true);
  };

  // Generate dots for mutual interests
  const renderMutualDots = (count: number) => {
    return (
      <div className="flex gap-1">
        {Array.from({ length: count }).map((_, index) => (
          <span
            key={index}
            className="w-2 h-2 rounded-full bg-[#FF3366]"
          ></span>
        ))}
      </div>
    );
  };

  // Function to render compatibility badges
  const renderCompatibilityBadge = (score: number) => {
    let color = "bg-gray-200 text-gray-700";

    if (score >= 80) {
      color = "bg-green-100 text-green-800";
    } else if (score >= 60) {
      color = "bg-blue-100 text-blue-800";
    } else if (score >= 40) {
      color = "bg-yellow-100 text-yellow-700";
    } else if (score >= 20) {
      color = "bg-orange-100 text-orange-700";
    } else {
      color = "bg-red-100 text-red-700";
    }

    return (
      <div className={`px-3 py-1 rounded-full text-sm font-semibold ${color}`}>
        {score}% Điểm
      </div>
    );
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#FFF0F3] to-[#FFE5EA] pb-20 font-['Poppins'] py-6"
      id="home-screen"
    >
      <div className="max-w-[1200px] mx-auto p-8 bg-white rounded-[20px] shadow-md">
        {/* Header */}
        <header className="text-center mb-10">
          <div className="relative mb-6">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-[#FF3366] via-[#FF6B98] to-[#FFB3C1] text-transparent bg-clip-text mb-4 font-poppins">
              Tìm kiếm Bạn Bè
            </h1>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-[#FF3366] to-[#FF6B8A] rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-1 -left-3 w-6 h-6 bg-gradient-to-r from-[#FFB3C1] to-[#FF6B8A] rounded-full opacity-30 animate-pulse animation-delay-1s"></div>
          </div>
          <p className="text-xl text-[#666] mb-8 font-medium">
            Khám phá những người có cùng sở thích với bạn ✨
          </p>

          {/* Status indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-[#666] font-medium">
              {session
                ? `Welcome back, ${session.user?.name?.split(" ")[0]}!`
                : "Ready to connect"}
            </span>
          </div>
        </header>

        {/* View Toggle */}
        {session && (
          <div className="flex justify-center mb-10">
            <div className="flex rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 p-1.5 w-fit shadow-sm border border-gray-200">
              <button
                className={`px-8 py-3 rounded-xl transition-all duration-300 font-medium flex items-center gap-2 ${
                  viewMode === "browse"
                    ? "bg-gradient-to-r from-[#FF3366] to-[#FF6B8A] text-white shadow-lg transform scale-105"
                    : "text-[#666] hover:text-[#FF3366] hover:bg-white/50"
                }`}
                onClick={() => setViewMode("browse")}
              >
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
                Khám Phá Theo Sở Thích
              </button>
              <button
                className={`px-8 py-3 rounded-xl transition-all duration-300 font-medium flex items-center gap-2 ${
                  viewMode === "compatibility"
                    ? "bg-gradient-to-r from-[#FF3366] to-[#FF6B8A] text-white shadow-lg transform scale-105"
                    : "text-[#666] hover:text-[#FF3366] hover:bg-white/50"
                }`}
                onClick={() => setViewMode("compatibility")}
              >
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
                Tương Thích
              </button>
            </div>
          </div>
        )}

        {/* Notification for users with no interests */}
        {session &&
          viewMode === "compatibility" &&
          compatibleUsers.length === 0 && (
            <div className="bg-gradient-to-r from-[#FFF0F3] to-[#FFE5EA] rounded-2xl p-6 mb-10 flex items-start gap-4 border border-[#FFD6DD] shadow-sm">
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
                    d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                  />
                </svg>
              </div>
              <div className="flex-grow">
                <h3 className="font-semibold text-[#333] mb-1">
                  Thêm sở thích để tìm kiếm những người bạn
                </h3>
                <p className="text-sm text-[#666] mb-2">
                  Để tìm kiếm những người bạn tuyệt vời, hãy thêm sở thích vào
                  hồ sơ của bạn.
                </p>
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-2 text-[#FF3366] font-bold hover:text-[#E62E5C] transition-colors group"
                >
                  <span>Hoàn thành hồ sơ</span>
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
          )}

        {viewMode === "browse" && (
          <>
            {/* Search and Filter Controls */}
            <div className="flex flex-col md:flex-row justify-center items-center gap-6 mb-10">
              {/* Search Input */}
              <div className="relative w-full max-w-md">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm theo sở thích..."
                  className="w-full px-6 py-4 pl-14 pr-12 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FF3366]/20 focus:border-[#FF3366] transition-all duration-200 bg-gray-50 focus:bg-white font-medium placeholder:text-gray-400 shadow-sm"
                />
                <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
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

              {/* Category Filter */}
              <div className="w-full max-w-xs">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FF3366]/20 focus:border-[#FF3366] transition-all duration-200 bg-gray-50 focus:bg-white font-medium shadow-sm"
                >
                  {HOBBY_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* My Interests Toggle */}
              {session && userHobbies.length > 0 && (
                <button
                  onClick={() => {
                    setShowOnlyUserInterests(!showOnlyUserInterests);
                    setSelectedHobby(null);
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-medium transition-all duration-200 whitespace-nowrap shadow-sm border-2 ${
                    showOnlyUserInterests
                      ? "bg-gradient-to-r from-[#FF3366] to-[#FF6B8A] text-white border-[#FF3366] shadow-lg"
                      : "bg-white text-[#FF3366] border-[#FF3366] hover:bg-[#FFF0F3]"
                  }`}
                >
                  {showOnlyUserInterests ? (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-5 h-5"
                      >
                        <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                        <path
                          fillRule="evenodd"
                          d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Sở thích của tôi</span>
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 100-12 6 6 0 000 12z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Tất cả sở thích</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Interests Grid with Pagination */}
            <section className="mb-10">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-8 bg-gradient-to-b from-[#FF3366] to-[#FF6B8A] rounded-full"></div>
                  <h2 className="text-2xl font-bold text-[#333] font-poppins">
                    {session && showOnlyUserInterests
                      ? "Your Interests"
                      : "Explore Interests"}
                  </h2>
                </div>
                <p className="text-[#666] font-medium">
                  {session && showOnlyUserInterests
                    ? "Click on any of your interests to find like-minded people"
                    : "Choose an interest to discover people who share your passion"}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {paginatedInterests.map((hobby, index) => (
                  <button
                    key={hobby.id}
                    onClick={() => {
                      handleHobbySelect(hobby.id);
                      setCurrentPage(1);
                    }}
                    className={`group p-6 rounded-2xl text-center transition-all duration-200 border-2 font-medium relative overflow-hidden
                      ${
                        selectedHobby === hobby.id
                          ? "bg-gradient-to-r from-[#FF3366] to-[#FF6B8A] text-white border-[#FF3366] shadow-xl transform scale-105"
                          : "bg-white hover:bg-gradient-to-r hover:from-[#FFF0F3] hover:to-[#FFE5EA] text-[#333] border-gray-200 hover:border-[#FF3366] hover:shadow-lg hover:scale-105"
                      }`}
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    <span className="relative z-10 text-sm">#{hobby.name}</span>
                    {selectedHobby === hobby.id && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                    )}

                    {/* Subtle glow effect for selected hobby */}
                    {selectedHobby === hobby.id && (
                      <div className="absolute -inset-1 bg-gradient-to-r from-[#FF3366] to-[#FF6B8A] rounded-2xl blur opacity-30 -z-10"></div>
                    )}
                  </button>
                ))}
              </div>

              {/* Interest Pagination Controls */}
              {totalInterestPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                  <button
                    onClick={() =>
                      setCurrentInterestPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentInterestPage === 1}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#FF3366] border-2 border-[#FF3366] font-medium transition-all duration-200 hover:bg-[#FFF0F3] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
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
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Trước
                  </button>

                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl">
                    <span className="text-[#666] font-medium">
                      Trang {currentInterestPage} / {totalInterestPages}
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      setCurrentInterestPage((prev) =>
                        Math.min(prev + 1, totalInterestPages)
                      )
                    }
                    disabled={currentInterestPage === totalInterestPages}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#FF3366] border-2 border-[#FF3366] font-medium transition-all duration-200 hover:bg-[#FFF0F3] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                  >
                    Sau
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              )}

              {/* No Results Message */}
              {displayedHobbies.length === 0 && (
                <div className="text-center w-full py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl mt-6 border border-gray-200">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    {searchQuery ? (
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
                    ) : (
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
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    )}
                  </div>

                  {searchQuery ? (
                    <div>
                      <p className="text-[#666] mb-3 font-medium">
                        Không có sở thích "{searchQuery}".
                      </p>
                      <p className="text-[#999] text-sm">
                        Hãy thử tìm kiếm khác hoặc chọn một sở thích từ danh
                        sách.
                      </p>
                    </div>
                  ) : session && showOnlyUserInterests ? (
                    <div>
                      <p className="text-[#666] mb-4 font-medium">
                        You haven't selected any interests yet.
                      </p>
                      <Link
                        href="/profile"
                        className="inline-flex items-center gap-2 text-[#FF3366] font-bold hover:text-[#E62E5C] transition-colors group"
                      >
                        <span>Thêm sở thích vào hồ sơ của bạn</span>
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
                  ) : (
                    <div>
                      <p className="text-[#666] mb-3 font-medium">
                        Không có sở thích nào phù hợp với bộ lọc hiện tại.
                      </p>
                      <p className="text-[#999] text-sm">
                        Hãy thử chọn một sở thích khác hoặc xóa bộ lọc để xem
                        tất cả sở thích.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* User Profiles with Pagination */}
            {selectedHobby && (
              <section>
                {isLoading ? (
                  <div className="text-center py-20">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 border-4 border-[#FF3366]/20 border-t-[#FF3366] rounded-full animate-spin mx-auto"></div>
                      <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-[#FF6B8A] rounded-full animate-spin animation-delay-150 mx-auto"></div>
                    </div>
                    <h3 className="text-lg font-semibold text-[#333] mb-2">
                      Đang tải người dùng...
                    </h3>
                    <p className="text-[#666] font-medium">
                      Vui lòng đợi trong giây lát, chúng tôi đang tìm kiếm những
                      người dùng có sở thích này.
                    </p>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-16 bg-gradient-to-br from-[#FFF0F3] to-[#FFE5EA] rounded-2xl shadow-sm border border-[#FFD6DD]">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-10 w-10 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M17 20h5v-2a3 3 0 00-5.196-2.121M9 20H4v-2a3 3 0 015.196-2.121M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a2 2 0 11-4 0 2 2 0 014 0zM7 2a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-[#333] mb-3">
                      Không có người dùng nào có sở thích này
                    </h2>
                    <p className="text-[#666] mb-6 max-w-lg mx-auto leading-relaxed">
                      Hiện tại không có người dùng nào chia sẻ sở thích này. Hãy
                      thử chọn một sở thích khác hoặc thêm sở thích của bạn để
                      tìm kiếm những người bạn mới.
                    </p>
                    <button
                      onClick={() => setSelectedHobby(null)}
                      className="bg-gradient-to-r from-[#FF3366] to-[#FF6B8A] text-white px-6 py-3 rounded-xl font-medium transition-all hover:from-[#E62E5C] hover:to-[#FF5577] shadow-lg hover:shadow-xl"
                    >
                      Quay lại danh sách sở thích
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-8">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-2 h-8 bg-gradient-to-b from-[#FF3366] to-[#FF6B8A] rounded-full"></div>
                        <h2 className="text-2xl font-bold text-[#333] font-poppins">
                          {users.length} Người dùng có sở thích{" "}
                          <span className="text-[#FF3366]">
                            #{selectedHobby}
                          </span>
                        </h2>
                      </div>
                      <p className="text-[#666] font-medium">
                        Đã tìm {totalUsers} người có cùng sở thích này.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {users.map((user, index) => (
                        <div
                          key={user.id}
                          className="group bg-white rounded-3xl p-8 shadow-lg flex flex-col transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border border-gray-100 hover:border-[#FF3366]/20 relative overflow-hidden"
                          style={{
                            animationDelay: `${index * 100}ms`,
                          }}
                        >
                          {/* Compatibility Score Badge - Only show when user is logged in */}
                          {session && user.compatibilityScore !== undefined && (
                            <div className="absolute right-4 top-4 z-10">
                              {renderCompatibilityBadge(
                                user.compatibilityScore
                              )}
                            </div>
                          )}

                          {/* Subtle background gradient */}
                          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-[#FF3366]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                          <div className="relative z-10">
                            <div className="mb-6 self-center flex justify-center">
                              <div className="relative">
                                <Avatar
                                  src={user.image}
                                  alt={user.name || "User profile"}
                                  size={96}
                                  className="shadow-xl group-hover:scale-110 transition-transform duration-300"
                                  showOnlineStatus={Math.random() > 0.5}
                                  isOnline={Math.random() > 0.3}
                                />
                                {/* Subtle glow effect */}
                                <div className="absolute -inset-2 bg-gradient-to-r from-[#FF3366]/20 to-[#FF6B8A]/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg"></div>
                              </div>
                            </div>

                            <div>
                              <h2 className="text-xl font-bold text-[#333] mb-3 text-center group-hover:text-[#FF3366] transition-colors duration-200">
                                {user.name}
                              </h2>

                              <p className="text-sm text-[#666] mb-6 text-center font-medium">
                                {user.hobbies.length > 0
                                  ? `${user.hobbies[0].hobby.name} ${
                                      user.hobbies.length > 1 ? "and" : ""
                                    } ${
                                      user.hobbies.length > 1
                                        ? user.hobbies[1].hobby.name
                                        : ""
                                    } enthusiast`
                                  : "Mới tham gia"}
                              </p>

                              <div className="flex flex-wrap justify-center gap-2 mb-6">
                                {user.hobbies.slice(0, 3).map((uh) => (
                                  <span
                                    key={uh.hobbyId}
                                    className="bg-gradient-to-r from-[#FFF0F3] to-[#FFE5EA] text-[#FF3366] rounded-full px-4 py-1.5 text-sm font-medium border border-[#FFD6DD] group-hover:from-[#FF3366] group-hover:to-[#FF6B8A] group-hover:text-white transition-all duration-200"
                                  >
                                    #{uh.hobby.name}
                                  </span>
                                ))}
                                {user.hobbies.length > 3 && (
                                  <span className="bg-gray-100 text-[#666] rounded-full px-4 py-1.5 text-sm font-medium group-hover:bg-gray-200 transition-colors duration-200">
                                    +{user.hobbies.length - 3}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center justify-center gap-3 mb-8">
                                {session && user.commonHobbies !== undefined ? (
                                  <>
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
                                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                        />
                                      </svg>
                                      <span className="text-sm font-bold text-[#FF3366]">
                                        {user.commonHobbies}
                                      </span>
                                    </div>
                                    <span className="text-sm text-[#666] font-medium">
                                      {user.commonHobbies === 1
                                        ? "sở thích chung"
                                        : "sở thích chung"}
                                    </span>
                                  </>
                                ) : (
                                  <>
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
                                          d="M13 10V3L4 14h7v7l9-11h-7z"
                                        />
                                      </svg>
                                      <span className="text-sm font-bold text-[#FF3366]">
                                        {Math.min(user.hobbies.length, 3)}
                                      </span>
                                    </div>
                                    <span className="text-sm text-[#666] font-medium">
                                      Thể hiện sự quan tâm
                                    </span>
                                  </>
                                )}

                                <div className="ml-auto">
                                  {renderMutualDots(
                                    session && user.commonHobbies !== undefined
                                      ? Math.min(user.commonHobbies, 3)
                                      : Math.min(user.hobbies.length, 3)
                                  )}
                                </div>
                              </div>

                              <div className="flex gap-3 mt-auto">
                                <Link
                                  href={session ? `/users/${user.id}` : "#"}
                                  onClick={(e) =>
                                    !session &&
                                    (e.preventDefault(), handleLoginClick())
                                  }
                                  className="flex-1 text-center bg-transparent text-[#FF3366] border-2 border-[#FF3366] rounded-2xl py-3 px-4 font-bold transition-all duration-200 hover:bg-[#FF3366] hover:text-white hover:shadow-lg flex items-center justify-center gap-2"
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
                                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                  </svg>
                                  Hồ sơ
                                </Link>
                                <Link
                                  href={
                                    session ? `/chat?userId=${user.id}` : "#"
                                  }
                                  onClick={(e) =>
                                    !session &&
                                    (e.preventDefault(), handleLoginClick())
                                  }
                                  className="flex-1 text-center bg-gradient-to-r from-[#FF3366] to-[#FF6B8A] text-white border-2 border-[#FF3366] rounded-2xl py-3 px-4 font-bold transition-all duration-200 hover:from-[#E62E5C] hover:to-[#FF5577] hover:shadow-lg flex items-center justify-center gap-2"
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
                                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                    />
                                  </svg>
                                  Trò chuyện
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* User Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex justify-center items-center gap-4 mt-12">
                        <button
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={currentPage === 1}
                          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#FF3366] border-2 border-[#FF3366] font-medium transition-all duration-200 hover:bg-[#FFF0F3] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
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
                              d="M15 19l-7-7 7-7"
                            />
                          </svg>
                          Trước
                        </button>

                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl">
                          <span className="text-[#666] font-medium">
                            Trang {currentPage} / {totalPages}
                          </span>
                        </div>

                        <button
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages)
                            )
                          }
                          disabled={currentPage === totalPages}
                          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#FF3366] border-2 border-[#FF3366] font-medium transition-all duration-200 hover:bg-[#FFF0F3] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                        >
                          Sau
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
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>
            )}
          </>
        )}

        {viewMode === "compatibility" && (
          <>
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-2 h-8 bg-gradient-to-b from-[#FF3366] to-[#FF6B8A] rounded-full"></div>
                <h2 className="text-3xl font-bold text-[#333] font-poppins">
                  Người phù hợp nhất với bạn
                </h2>
                <div className="w-2 h-8 bg-gradient-to-b from-[#FF6B8A] to-[#FF3366] rounded-full"></div>
              </div>
              <p className="text-[#666] font-medium text-lg">
                Khám phá những người có cùng sở thích với bạn ✨
              </p>
            </div>

            {!session ? (
              <div className="text-center py-16 bg-gradient-to-br from-[#FFF0F3] to-[#FFE5EA] rounded-2xl shadow-sm border border-[#FFD6DD]">
                <div className="w-20 h-20 bg-gradient-to-br from-[#FF3366] to-[#FF6B8A] rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-white"
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
                <h2 className="text-2xl font-bold text-[#333] mb-4">
                  Đăng nhập để tìm người phù hợp
                </h2>
                <p className="text-[#666] mb-8 max-w-lg mx-auto leading-relaxed">
                  Đăng nhập để xem những người dùng có sở thích tương đồng với
                  bạn. Tạo kết nối và khám phá những người bạn mới!
                </p>
                <button
                  onClick={handleLoginClick}
                  className="bg-gradient-to-r from-[#FF3366] to-[#FF6B8A] text-white rounded-2xl py-4 px-8 font-bold transition-all hover:from-[#E62E5C] hover:to-[#FF5577] shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Đăng nhập ngay
                </button>
              </div>
            ) : isLoading ? (
              <div className="text-center py-20">
                <div className="relative mb-6">
                  <div className="w-20 h-20 border-4 border-[#FF3366]/20 border-t-[#FF3366] rounded-full animate-spin mx-auto"></div>
                  <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-[#FF6B8A] rounded-full animate-spin animation-delay-150 mx-auto"></div>
                </div>
                <h3 className="text-lg font-semibold text-[#333] mb-2">
                  Đang tải...
                </h3>
                <p className="text-[#666] font-medium">
                  Phân tích khả năng tương thích dựa trên sở thích của bạn
                </p>
              </div>
            ) : compatibleUsers.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-[#FFF0F3] to-[#FFE5EA] rounded-2xl shadow-sm border border-[#FFD6DD]">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-[#333] mb-4">
                  Không có người dùng phù hợp
                </h2>
                <p className="text-[#666] mb-8 max-w-lg mx-auto leading-relaxed">
                  Hiện tại không có người dùng nào có sở thích tương đồng với
                  bạn. Hãy thử thêm sở thích mới hoặc mời bạn bè tham gia để
                  tăng cơ hội kết nối!
                </p>
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FF3366] to-[#FF6B8A] text-white px-6 py-3 rounded-xl font-bold transition-all hover:from-[#E62E5C] hover:to-[#FF5577] shadow-lg hover:shadow-xl"
                >
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
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Thêm sở thích vào hồ sơ của bạn
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <div className="text-center">
                    <p className="text-[#666] font-medium">
                      Đã tìm thấy {compatibleUsers.length} người phù hợp với bạn
                    </p>
                  </div>
                </div>

                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {paginatedCompatibleUsers.map((user, index) => (
                    <div
                      key={user.id}
                      className="group bg-white rounded-3xl p-8 shadow-lg flex flex-col transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border border-gray-100 hover:border-[#FF3366]/20 relative overflow-hidden"
                      style={{
                        animationDelay: `${index * 100}ms`,
                      }}
                    >
                      <div className="absolute right-4 top-4 z-10">
                        {renderCompatibilityBadge(user.compatibilityScore)}
                      </div>

                      {/* Subtle background gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-[#FF3366]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                      <div className="relative z-10">
                        <div className="mb-6 self-center flex justify-center">
                          <div className="relative">
                            <Avatar
                              src={user.image}
                              alt={user.name || "User profile"}
                              size={96}
                              className="shadow-xl group-hover:scale-110 transition-transform duration-300"
                              showOnlineStatus={Math.random() > 0.5}
                              isOnline={Math.random() > 0.3}
                            />
                            {/* Subtle glow effect */}
                            <div className="absolute -inset-2 bg-gradient-to-r from-[#FF3366]/20 to-[#FF6B8A]/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg"></div>
                          </div>
                        </div>

                        <h2 className="text-xl font-bold text-[#333] mb-4 text-center group-hover:text-[#FF3366] transition-colors duration-200">
                          {user.name}
                        </h2>

                        <div className="flex justify-center items-center gap-3 mb-6">
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
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                              />
                            </svg>
                            <span className="text-sm font-bold text-[#FF3366]">
                              {user.commonHobbies}
                            </span>
                          </div>
                          <span className="text-sm text-[#666] font-medium">
                            {user.commonHobbies === 1
                              ? "sở thích chung"
                              : "sở thích chung"}
                          </span>
                        </div>

                        <div className="flex flex-wrap justify-center gap-2 mb-8">
                          {user.hobbies.slice(0, 3).map((hobby) => (
                            <span
                              key={hobby.id}
                              className="bg-gradient-to-r from-[#FFF0F3] to-[#FFE5EA] text-[#FF3366] rounded-full px-4 py-1.5 text-sm font-medium border border-[#FFD6DD] group-hover:from-[#FF3366] group-hover:to-[#FF6B8A] group-hover:text-white transition-all duration-200"
                            >
                              #{hobby.name}
                            </span>
                          ))}
                          {user.hobbies.length > 3 && (
                            <span className="bg-gray-100 text-[#666] rounded-full px-4 py-1.5 text-sm font-medium group-hover:bg-gray-200 transition-colors duration-200">
                              +{user.hobbies.length - 3} more
                            </span>
                          )}
                        </div>

                        <div className="flex gap-3 mt-auto">
                          <Link
                            href={`/users/${user.id}`}
                            className="flex-1 text-center bg-transparent text-[#FF3366] border-2 border-[#FF3366] rounded-2xl py-3 px-4 font-bold transition-all duration-200 hover:bg-[#FF3366] hover:text-white hover:shadow-lg flex items-center justify-center gap-2"
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
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            Hồ sơ
                          </Link>
                          <Link
                            href={`/chat?userId=${user.id}`}
                            className="flex-1 text-center bg-gradient-to-r from-[#FF3366] to-[#FF6B8A] text-white border-2 border-[#FF3366] rounded-2xl py-3 px-4 font-bold transition-all duration-200 hover:from-[#E62E5C] hover:to-[#FF5577] hover:shadow-lg flex items-center justify-center gap-2"
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
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                              />
                            </svg>
                            Trò chuyện
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </section>

                {/* Pagination controls for best matches */}
                {totalCompatiblePages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-12">
                    <button
                      onClick={() =>
                        setCurrentCompatiblePage((prev) =>
                          Math.max(prev - 1, 1)
                        )
                      }
                      disabled={currentCompatiblePage === 1}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#FF3366] border-2 border-[#FF3366] font-medium transition-all duration-200 hover:bg-[#FFF0F3] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
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
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                      Trước
                    </button>

                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl">
                      <span className="text-[#666] font-medium">
                        Trang {currentCompatiblePage} / {totalCompatiblePages}
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        setCurrentCompatiblePage((prev) =>
                          Math.min(prev + 1, totalCompatiblePages)
                        )
                      }
                      disabled={currentCompatiblePage === totalCompatiblePages}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#FF3366] border-2 border-[#FF3366] font-medium transition-all duration-200 hover:bg-[#FFF0F3] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                    >
                      Sau
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
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md shadow-2xl z-20 border-t border-gray-100">
        <ul className="flex justify-around list-none p-4">
          <li className="flex-1">
            <Link
              href="/"
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <span className="text-sm font-bold">Trang chủ</span>
            </Link>
          </li>
          <li className="flex-1">
            <Link
              href="/profile"
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <span className="text-sm">Hồ sơ</span>
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

      {isLoginModalOpen && (
        <LoginModal onClose={() => setIsLoginModalOpen(false)} />
      )}

      {/* Custom CSS for animations */}
      <style jsx>{`
        .animation-delay-150 {
          animation-delay: 150ms;
        }
        .animation-delay-1s {
          animation-delay: 1s;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        .hover\\:scale-110:hover {
          transform: scale(1.1);
        }
        .hover\\:scale-105:hover {
          transform: scale(1.05);
        }
        .group:hover .group-hover\\:scale-110 {
          transform: scale(1.1);
        }
        .group:hover .group-hover\\:translate-x-1 {
          transform: translateX(0.25rem);
        }
        .group:hover .group-hover\\:rotate-90 {
          transform: rotate(90deg);
        }
        .group:hover .group-hover\\:from-\\[\\#FF3366\\] {
          background: linear-gradient(to right, #ff3366, #ff6b8a);
        }
        .group:hover .group-hover\\:to-\\[\\#FF6B8A\\] {
          background: linear-gradient(to right, #ff3366, #ff6b8a);
        }
        .group:hover .group-hover\\:text-white {
          color: white;
        }
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
