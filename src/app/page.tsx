"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Prisma } from "@prisma/client";
import LoginModal from "@/components/LoginModal";
import { HOBBY_CATEGORIES, getCategoryForHobby } from "@/lib/hobbyCategories";

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
        {score}% Match
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
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#FF3366] to-[#FF6B98] text-transparent bg-clip-text mb-2">
            Tìm kiếm kết nối của bạn
          </h1>
          <p className="text-lg text-[#666] mb-6">
            Khám phá những người có cùng sở thích và kết nối với họ
          </p>
        </header>

        {/* View Toggle */}
        {session && (
          <div className="flex justify-center mb-8">
            <div className="flex rounded-full bg-[#F5F5F5] p-1 w-fit">
              <button
                className={`px-6 py-2 rounded-full transition-all ${
                  viewMode === "browse"
                    ? "bg-[#FF3366] text-white shadow-md"
                    : "text-[#666]"
                }`}
                onClick={() => setViewMode("browse")}
              >
                Sở thích
              </button>
              <button
                className={`px-6 py-2 rounded-full transition-all ${
                  viewMode === "compatibility"
                    ? "bg-[#FF3366] text-white shadow-md"
                    : "text-[#666]"
                }`}
                onClick={() => setViewMode("compatibility")}
              >
                Tương thích
              </button>
            </div>
          </div>
        )}

        {/* Notification for users with no interests */}
        {session &&
          viewMode === "compatibility" &&
          compatibleUsers.length === 0 && (
            <div className="bg-[#FFF0F3] rounded-[20px] p-5 mb-8 flex items-center">
              <div className="bg-[#FFCCD5] rounded-full p-3 mr-4 flex-shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="#FF3366"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
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
                  className="text-[#FF3366] font-medium inline-flex items-center text-sm"
                >
                  Cài đặt
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
                    className="ml-1"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          )}

        {viewMode === "browse" && (
          <>
            {/* Search and Filter Controls */}
            <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-6">
              {/* Search Input */}
              <div className="relative w-full max-w-md">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm sở thích..."
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#FF3366] focus:border-transparent"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
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
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                </div>
              </div>
              {/* Category Filter */}
              <div className="w-full max-w-xs">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#FF3366] focus:border-transparent"
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
                  className="flex items-center gap-2 bg-[#FFF0F3] px-4 py-2 rounded-full text-[#FF3366] hover:bg-[#FFE5EA] transition-colors whitespace-nowrap"
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
            <section className="mb-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {paginatedInterests.map((hobby) => (
                  <button
                    key={hobby.id}
                    onClick={() => {
                      handleHobbySelect(hobby.id);
                      setCurrentPage(1);
                    }}
                    className={`p-4 rounded-[20px] text-center transition-all ${
                      selectedHobby === hobby.id
                        ? "bg-[#FF3366] text-white shadow-lg transform scale-105"
                        : "bg-white hover:bg-[#FFF0F3] text-[#333]"
                    }`}
                  >
                    {hobby.name}
                  </button>
                ))}
              </div>

              {/* Interest Pagination Controls */}
              {totalInterestPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <button
                    onClick={() =>
                      setCurrentInterestPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentInterestPage === 1}
                    className="px-4 py-2 rounded-full bg-white text-[#FF3366] border border-[#FF3366] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>
                  <span className="text-[#666]">
                    Trang {currentInterestPage} of {totalInterestPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentInterestPage((prev) =>
                        Math.min(prev + 1, totalInterestPages)
                      )
                    }
                    disabled={currentInterestPage === totalInterestPages}
                    className="px-4 py-2 rounded-full bg-white text-[#FF3366] border border-[#FF3366] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau
                  </button>
                </div>
              )}

              {/* No Results Message */}
              {displayedHobbies.length === 0 && (
                <div className="text-center w-full py-6 bg-[#FFF0F3] rounded-[20px] mt-4">
                  {searchQuery ? (
                    <p className="text-[#666] mb-3">
                      Không có ai có cùng sở thích&nbsp;&quot;{searchQuery}
                      &quot;.
                    </p>
                  ) : session && showOnlyUserInterests ? (
                    <>
                      <p className="text-[#666] mb-3">
                        Bạn chưa chọn sở thích nào. Hãy thêm sở thích vào hồ sơ
                        của bạn.
                      </p>
                      <Link
                        href="/profile"
                        className="text-[#FF3366] font-medium inline-flex items-center"
                      >
                        Thêm Sở Thích
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
                          className="ml-1"
                        >
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </>
                  ) : (
                    <p className="text-[#666] mb-3">
                      Không có sở thích nào phù hợp với tìm kiếm của bạn. Hãy
                      thử tìm kiếm khác hoặc chọn một sở thích từ danh sách.
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* User Profiles with Pagination */}
            {selectedHobby && (
              <section>
                {isLoading ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 border-4 border-[#FF3366] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[#666]">Loading users...</p>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-12 bg-[#FFF0F3] rounded-[20px] shadow-sm">
                    <h2 className="text-2xl font-semibold text-[#333] mb-4">
                      Không có người dùng nào
                    </h2>
                    <p className="text-[#666] mb-6 max-w-lg mx-auto">
                      Hiện tại không có người dùng nào với sở thích này. Hãy thử
                      chọn sở thích khác hoặc thêm sở thích vào hồ sơ của bạn.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {users.map((user) => (
                        <div
                          key={user.id}
                          className="bg-white rounded-[24px] p-6 shadow-md flex flex-col transition-all hover:-translate-y-1 hover:shadow-lg"
                        >
                          {/* Compatibility Score Badge - Only show when user is logged in */}
                          {session && user.compatibilityScore !== undefined && (
                            <div className="relative">
                              <div className="absolute right-0 top-0">
                                {renderCompatibilityBadge(
                                  user.compatibilityScore
                                )}
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
                            <p className="text-sm text-[#666] mb-4 text-center">
                              {user.hobbies.length > 0
                                ? `${user.hobbies[0].hobby.name} ${
                                    user.hobbies.length > 1 ? "and" : ""
                                  } ${
                                    user.hobbies.length > 1
                                      ? user.hobbies[1].hobby.name
                                      : ""
                                  } enthusiast`
                                : "New user"}
                            </p>

                            <div className="flex flex-wrap justify-center gap-2 mb-4">
                              {user.hobbies.slice(0, 3).map((uh) => (
                                <span
                                  key={uh.hobbyId}
                                  className="bg-[#FFF0F3] text-[#FF3366] rounded-2xl px-3 py-1 text-sm font-medium"
                                >
                                  {uh.hobby.name}
                                </span>
                              ))}
                            </div>

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
                                  <span className="text-sm text-[#666]">
                                    sở thích chung
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

                            <div className="flex gap-2 mt-auto">
                              <Link
                                href={session ? `/users/${user.id}` : "#"}
                                onClick={(e) =>
                                  !session &&
                                  (e.preventDefault(), handleLoginClick())
                                }
                                className="flex-1 text-center bg-transparent text-[#FF3366] border-2 border-[#FF3366] rounded-2xl py-2 px-4 font-medium transition-all hover:bg-[#FFF0F3]"
                              >
                                Thông tin
                              </Link>
                              <Link
                                href={session ? `/chat?userId=${user.id}` : "#"}
                                onClick={(e) =>
                                  !session &&
                                  (e.preventDefault(), handleLoginClick())
                                }
                                className="flex-1 text-center bg-[#FF3366] text-white border-2 border-[#FF3366] rounded-2xl py-2 px-4 font-medium transition-all hover:bg-[#E62E5C]"
                              >
                                Nhắn tin{" "}
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* User Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex justify-center items-center gap-2 mt-8">
                        <button
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={currentPage === 1}
                          className="px-4 py-2 rounded-full bg-white text-[#FF3366] border border-[#FF3366] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Trước
                        </button>
                        <span className="text-[#666]">
                          Trang {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages)
                            )
                          }
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 rounded-full bg-white text-[#FF3366] border border-[#FF3366] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Sau
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
            <h2 className="text-2xl font-semibold text-center text-[#333] mb-8">
              Kết nối hoàn hảo
            </h2>

            {!session ? (
              <div className="text-center py-12 bg-[#FFF0F3] rounded-[20px] shadow-sm">
                <h2 className="text-2xl font-semibold text-[#333] mb-4">
                  Đăng nhập để tìm kiếm kết nối của bạn
                </h2>
                <p className="text-[#666] mb-6 max-w-lg mx-auto">
                  Đăng nhập để xem những người bạn tương thích nhất với sở thích
                  của bạn. Tạo tài khoản miễn phí và bắt đầu kết nối ngay hôm
                  nay!
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
                <p className="text-[#666]">Đang tìm kết nối...</p>
              </div>
            ) : compatibleUsers.length === 0 ? (
              <div className="text-center py-12 bg-[#FFF0F3] rounded-[20px] shadow-sm">
                <h2 className="text-2xl font-semibold text-[#333] mb-4">
                  Không có người dùng phù hợp
                </h2>
                <p className="text-[#666] mb-6 max-w-lg mx-auto">
                  Hiện tại không có người dùng nào phù hợp với sở thích của bạn.
                  Hãy thử chọn sở thích khác hoặc thêm sở thích vào hồ sơ của
                  bạn.
                </p>
              </div>
            ) : (
              <>
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {paginatedCompatibleUsers.map((user) => (
                    <div
                      key={user.id}
                      className="bg-white rounded-[24px] p-6 shadow-md flex flex-col transition-all hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="relative">
                        <div className="absolute right-0 top-0">
                          {renderCompatibilityBadge(user.compatibilityScore)}
                        </div>
                      </div>

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

                      <h2 className="text-xl font-semibold text-[#333] mb-2 text-center">
                        {user.name}
                      </h2>

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

                      <div className="flex flex-wrap justify-center gap-2 mb-6">
                        {user.hobbies.slice(0, 3).map((hobby) => (
                          <span
                            key={hobby.id}
                            className="bg-[#FFF0F3] text-[#FF3366] rounded-2xl px-3 py-1 text-sm font-medium"
                          >
                            {hobby.name}
                          </span>
                        ))}
                        {user.hobbies.length > 3 && (
                          <span className="bg-[#FFF0F3] text-[#FF3366] rounded-2xl px-3 py-1 text-sm font-medium">
                            +{user.hobbies.length - 3} more
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2 mt-auto">
                        <Link
                          href={`/users/${user.id}`}
                          className="flex-1 text-center bg-transparent text-[#FF3366] border-2 border-[#FF3366] rounded-2xl py-2 px-4 font-medium transition-all hover:bg-[#FFF0F3]"
                        >
                          Hồ sơ
                        </Link>
                        <Link
                          href={`/chat?userId=${user.id}`}
                          className="flex-1 text-center bg-[#FF3366] text-white border-2 border-[#FF3366] rounded-2xl py-2 px-4 font-medium transition-all hover:bg-[#E62E5C]"
                        >
                          Trò chuyện
                        </Link>
                      </div>
                    </div>
                  ))}
                </section>
                {/* Pagination controls for best matches */}
                {totalCompatiblePages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      onClick={() =>
                        setCurrentCompatiblePage((prev) =>
                          Math.max(prev - 1, 1)
                        )
                      }
                      disabled={currentCompatiblePage === 1}
                      className="px-4 py-2 rounded-full bg-white text-[#FF3366] border border-[#FF3366] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Trước
                    </button>
                    <span className="text-[#666]">
                      Trang {currentCompatiblePage} of {totalCompatiblePages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentCompatiblePage((prev) =>
                          Math.min(prev + 1, totalCompatiblePages)
                        )
                      }
                      disabled={currentCompatiblePage === totalCompatiblePages}
                      className="px-4 py-2 rounded-full bg-white text-[#FF3366] border border-[#FF3366] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sau
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-white shadow-md z-10">
        <ul className="flex justify-around list-none p-4">
          <li>
            <Link href="/" className="text-[#BE185D] font-medium no-underline">
              Trang chủ
            </Link>
          </li>
          <li>
            <Link
              href="/profile"
              className="text-[#666] no-underline font-medium"
            >
              Hồ sơ
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
              Trò chuyện
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
              Ghi chú
            </Link>
          </li>
          {session && (
            <li>
              <button
                onClick={() => signOut()}
                className="text-gray-500 font-poppins hover:text-[#FF3366]"
              >
                Đăng xuất{" "}
              </button>
            </li>
          )}
        </ul>
      </nav>

      {isLoginModalOpen && (
        <LoginModal onClose={() => setIsLoginModalOpen(false)} />
      )}
    </div>
  );
}
