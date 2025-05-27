"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import LoginModal from "@/components/LoginModal";
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

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

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
        selectedCategory === "All Categories" ||
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
            Back
          </button>
          <h1 className="text-2xl font-bold text-[#333] flex-grow text-center mr-12">
            Your Profile
          </h1>
        </div>

        {!session ? (
          <div className="text-center py-12 bg-[#FFF0F3] rounded-[20px] shadow-sm">
            <h2 className="text-2xl font-semibold text-[#333] mb-4">
              Sign In Required
            </h2>
            <p className="text-[#666] mb-6 max-w-lg mx-auto">
              Please sign in to view and edit your profile.
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
            <p className="text-[#666]">Loading your profile...</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* User Info */}
            <div className="flex flex-col items-center mb-10">
              <div className="w-24 h-24 rounded-full bg-[#f5f5f5] overflow-hidden border-2 border-white shadow-sm mb-4">
                {session.user?.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User profile"}
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                )}
              </div>
              <h2 className="text-xl font-semibold text-[#333] mb-1">
                {session.user?.name}
              </h2>
              <p className="text-sm text-[#666]">{session.user?.email}</p>
            </div>

            {/* Interests Section */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-[#333]">
                  Your Interests
                </h3>
                <div className="text-sm text-[#666] font-medium">
                  <span
                    className={isLimitReached ? "text-red-500 font-bold" : ""}
                  >
                    {selectedHobbyIds.length}
                  </span>
                  <span> / {MAX_INTERESTS}</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6">
                  {successMessage}
                </div>
              )}

              {isLimitReached && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6 flex items-center">
                  <div className="text-red-500 mr-3">
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
                      Maximum limit reached
                    </p>
                    <p className="text-red-500 text-sm">
                      You can select up to {MAX_INTERESTS} interests. Please
                      deselect an interest before selecting another one.
                    </p>
                  </div>
                </div>
              )}

              <p className="text-[#666] mb-6">
                Select your interests below. This will help us match you with
                people who share similar passions.
              </p>

              {/* Selected Interests */}
              {selectedHobbyIds.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-[#333] mb-3">
                    Your Selected Interests
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {userHobbies
                      .filter((hobby) => selectedHobbyIds.includes(hobby.id))
                      .map((hobby) => (
                        <div
                          key={hobby.id}
                          className="bg-[#FF3366] text-white px-4 py-1 rounded-full flex items-center"
                        >
                          <span>{hobby.name}</span>
                          <button
                            onClick={() => toggleHobbySelection(hobby.id)}
                            className="ml-2 flex items-center justify-center hover:bg-[#ff1a53] rounded-full w-5 h-5"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                              className="w-3 h-3"
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
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="search-interests"
                    className="block text-sm font-medium text-[#666] mb-1"
                  >
                    Search Interests
                  </label>
                  <div className="relative">
                    <input
                      id="search-interests"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Type to search..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF3366] focus:border-transparent"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                </div>
                <div>
                  <label
                    htmlFor="category-filter"
                    className="block text-sm font-medium text-[#666] mb-1"
                  >
                    Filter by Category
                  </label>
                  <select
                    id="category-filter"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF3366] focus:border-transparent"
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
              {/* Interest Selection */}
              <div
                className={`flex flex-wrap gap-3 mb-8 p-4 rounded-lg ${
                  isLimitReached ? "border-2 border-red-400 bg-red-50/20" : ""
                }`}
              >
                {filteredHobbies.length === 0 ? (
                  <div className="w-full text-center py-4 text-gray-500">
                    No interests found matching your search criteria
                  </div>
                ) : (
                  filteredHobbies.map((hobby) => {
                    const isSelected = selectedHobbyIds.includes(hobby.id);
                    const isDisabled = !isSelected && isLimitReached;

                    return (
                      <div
                        key={hobby.id}
                        onClick={() =>
                          !isDisabled && toggleHobbySelection(hobby.id)
                        }
                        className={`py-2 px-6 rounded-[20px] shadow-sm transition-all 
                          ${
                            isSelected
                              ? "bg-[#FF3366] text-white hover:-translate-y-[2px] hover:shadow-md"
                              : isDisabled
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-300"
                              : "bg-white text-[#666] border border-[#ddd] hover:-translate-y-[2px] hover:shadow-md cursor-pointer"
                          }`}
                      >
                        {hobby.name}
                      </div>
                    );
                  })
                )}
              </div>

              <button
                onClick={saveHobbies}
                disabled={isSaving}
                className={`bg-[#FF3366] text-white rounded-2xl py-3 px-8 font-medium transition-all hover:bg-[#E62E5C] shadow-md ${
                  isSaving ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isSaving ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  </span>
                ) : (
                  "Save Interests"
                )}
              </button>
            </div>

            {/* Compatibility Info */}
            <div className="bg-[#FFF0F3] rounded-[20px] p-6 mb-4">
              <h3 className="text-lg font-semibold text-[#333] mb-4">
                Compatibility Matching
              </h3>
              <p className="text-[#666] mb-2">
                Your selected interests will be used to find people who share
                similar passions.
              </p>
              <p className="text-[#666] mb-2">
                The more interests you select, the better matches we can find
                for you.
              </p>
              <Link
                href="/"
                className="text-[#FF3366] font-medium hover:underline inline-flex items-center mt-2"
              >
                Go to browse matches
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
              href="/profile"
              className="text-[#BE185D] no-underline font-medium"
            >
              Profile
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
          {session && (
            <li>
              <button
                onClick={() => signOut()}
                className="text-gray-500 font-poppins hover:text-[#FF3366]"
              >
                Log out
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
