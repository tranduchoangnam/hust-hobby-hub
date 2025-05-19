"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import LoginModal from "@/components/LoginModal";
import UserList from "@/components/UserList";

type Hobby = {
  id: string;
  name: string;
};

// Categories for grouping interests
const HOBBY_CATEGORIES = [
  "All Categories",
  "Arts & Creativity",
  "Music",
  "Literature & Writing",
  "Performing Arts",
  "Food & Beverages",
  "Sports & Fitness",
  "Travel & Culture",
  "Nature & Outdoors",
  "Technology & Gaming",
  "Media & Entertainment",
  "Wellness & Spirituality",
  "Science & Learning",
  "Collecting & Appreciation",
  "Social Activities",
];

// Function to determine category based on hobby name
const getCategoryForHobby = (hobbyName: string): string => {
  const lowerName = hobbyName.toLowerCase();

  // Arts & Creativity
  if (
    [
      "art",
      "paint",
      "draw",
      "sculpt",
      "digital",
      "illustrat",
      "design",
      "animation",
      "calligraphy",
      "pottery",
      "jewelry",
      "knit",
      "crochet",
      "quilt",
      "sew",
      "embroidery",
      "candle",
      "diy",
      "craft",
    ].some((term) => lowerName.includes(term))
  ) {
    return "Arts & Creativity";
  }

  // Music
  if (
    [
      "music",
      "guitar",
      "piano",
      "drum",
      "violin",
      "sing",
      "song",
      "dj",
      "classical",
      "jazz",
      "rock",
      "pop",
      "hip hop",
      "electronic",
      "country",
      "r&b",
      "opera",
      "choir",
      "musical",
    ].some((term) => lowerName.includes(term))
  ) {
    return "Music";
  }

  // Literature & Writing
  if (
    [
      "book",
      "read",
      "writ",
      "poetry",
      "fiction",
      "non-fiction",
      "screen",
      "play",
      "blog",
      "journal",
      "literary",
      "story",
    ].some((term) => lowerName.includes(term))
  ) {
    return "Literature & Writing";
  }

  // Performing Arts
  if (
    [
      "act",
      "theater",
      "dance",
      "ballet",
      "contemporary",
      "ballroom",
      "salsa",
      "comedy",
      "improv",
      "magic",
      "circus",
    ].some((term) => lowerName.includes(term))
  ) {
    return "Performing Arts";
  }

  // Food & Beverages
  if (
    [
      "cook",
      "bak",
      "mix",
      "bartend",
      "coffee",
      "tea",
      "wine",
      "beer",
      "whiskey",
      "ferment",
      "sourdough",
      "cheese",
      "food",
      "vegetarian",
      "vegan",
      "gluten",
      "barbecue",
      "sushi",
      "italian",
      "french",
      "asian",
      "mexican",
      "middle eastern",
      "indian",
    ].some((term) => lowerName.includes(term))
  ) {
    return "Food & Beverages";
  }

  // Sports & Fitness
  if (
    [
      "yoga",
      "pilates",
      "run",
      "hik",
      "climb",
      "swim",
      "cycl",
      "bik",
      "weight",
      "crossfit",
      "soccer",
      "basketball",
      "tennis",
      "volleyball",
      "badminton",
      "golf",
      "baseball",
      "snow",
      "ski",
      "surf",
      "skat",
      "martial",
      "box",
      "wrestl",
      "fenc",
      "archer",
    ].some((term) => lowerName.includes(term))
  ) {
    return "Sports & Fitness";
  }

  // Travel & Culture
  if (
    [
      "travel",
      "backpack",
      "road trip",
      "camp",
      "cultural",
      "histor",
      "museum",
      "galler",
      "language",
      "anthropology",
      "archaeology",
    ].some((term) => lowerName.includes(term))
  ) {
    return "Travel & Culture";
  }

  // Nature & Outdoors
  if (
    [
      "garden",
      "plant",
      "bird",
      "fish",
      "hunt",
      "forag",
      "wildlife",
      "stargaz",
      "astronom",
      "bee",
      "ecology",
      "conservation",
    ].some((term) => lowerName.includes(term))
  ) {
    return "Nature & Outdoors";
  }

  // Technology & Gaming
  if (
    [
      "program",
      "develop",
      "game",
      "chess",
      "puzzle",
      "vr",
      "robot",
      "electronic",
      "drone",
      "print",
    ].some((term) => lowerName.includes(term))
  ) {
    return "Technology & Gaming";
  }

  // Media & Entertainment
  if (
    [
      "film",
      "documentary",
      "tv",
      "anime",
      "comic",
      "manga",
      "podcast",
      "radio",
    ].some((term) => lowerName.includes(term))
  ) {
    return "Media & Entertainment";
  }

  // Wellness & Spirituality
  if (
    [
      "meditat",
      "mindful",
      "spiritual",
      "tarot",
      "astrology",
      "essential oil",
      "aromatherapy",
      "herbal",
    ].some((term) => lowerName.includes(term))
  ) {
    return "Wellness & Spirituality";
  }

  // Science & Learning
  if (
    [
      "science",
      "physics",
      "chemistry",
      "biology",
      "psychology",
      "neuroscience",
      "history",
      "philosophy",
      "linguistic",
      "math",
    ].some((term) => lowerName.includes(term))
  ) {
    return "Science & Learning";
  }

  // Collecting & Appreciation
  if (
    [
      "collect",
      "antique",
      "coin",
      "stamp",
      "vinyl",
      "vintage",
      "enthusiasm",
      "sneaker",
    ].some((term) => lowerName.includes(term))
  ) {
    return "Collecting & Appreciation";
  }

  // Social Activities
  if (
    [
      "volunteer",
      "community",
      "activism",
      "speak",
      "debate",
      "event plan",
    ].some((term) => lowerName.includes(term))
  ) {
    return "Social Activities";
  }

  return "All Categories";
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
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const interestsPerPage = 12; // Show 12 interests per page (3 rows of 4)
  
  // Derived state for limit check
  const isLimitReached = selectedHobbyIds.length >= MAX_INTERESTS;

  // Filter hobbies based on search query and category
  const filteredHobbies = useMemo(() => {
    return allHobbies.filter(hobby => {
      const matchesSearch = searchQuery === "" || 
        hobby.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === "All Categories" || 
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
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F3] to-[#FFE5EA] pb-20 font-['Poppins']">
      <div className="max-w-[900px] mx-auto p-8 bg-white rounded-[20px] shadow-md my-6">
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
              {/* Large Avatar */}
              <div className="w-36 h-36 rounded-full bg-[#f5f5f5] overflow-hidden border-4 border-[#FFE0E9] shadow-lg mb-6 relative hover:scale-105 transition-transform">
                {session.user?.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User profile"}
                    width={144}
                    height={144}
                    className="object-cover w-full h-full"
                  />
                )}
              </div>

              {/* User Name */}
              <h2 className="text-3xl font-bold text-[#333] mb-2">
                {session.user?.name}
              </h2>

              {/* Email and Stats */}
              <div className="flex items-center gap-4 mb-4 text-sm text-[#666]">
                <span>{session.user?.email}</span>
                <span className="w-1 h-1 bg-[#999] rounded-full"></span>
                <button
                  onClick={handleOpenFollowers}
                  className="text-[#666] hover:text-[#FF3366] hover:underline transition-colors"
                >
                  <span className="font-medium">{followerCount}</span> follower
                  {followerCount !== 1 ? "s" : ""}
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

              {/* Bio Section */}
              <div className="w-full max-w-xl bg-[#FFF9FB] rounded-xl p-5 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-[#333]">Bio</h3>
                  {!isEditingBio ? (
                    <button
                      onClick={() => setIsEditingBio(true)}
                      className="text-[#FF3366] text-sm hover:underline"
                    >
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditingBio(false)}
                        className="text-[#666] text-sm hover:underline"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveBio}
                        disabled={isSavingBio}
                        className={`text-[#FF3366] text-sm hover:underline ${
                          isSavingBio ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        {isSavingBio ? "Saving..." : "Save"}
                      </button>
                    </div>
                  )}
                </div>

                {bioError && (
                  <div className="text-red-500 text-sm mb-2">{bioError}</div>
                )}

                {isEditingBio ? (
                  <textarea
                    value={bio}
                    onChange={handleBioChange}
                    className="w-full p-3 border border-[#FFD9E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3366] focus:border-transparent"
                    rows={5}
                    placeholder="Write something about yourself..."
                  />
                ) : (
                  <div>
                    {bio ? (
                      <div className="prose text-[#666]">
                        {showFullBio || bio.length <= 200 ? (
                          <p className="whitespace-pre-wrap">{bio}</p>
                        ) : (
                          <>
                            <p className="whitespace-pre-wrap">
                              {bio.substring(0, 200)}...
                            </p>
                            <button
                              onClick={() => setShowFullBio(true)}
                              className="text-[#FF3366] text-sm mt-1 hover:underline"
                            >
                              Read more
                            </button>
                          </>
                        )}

                        {showFullBio && bio.length > 200 && (
                          <button
                            onClick={() => setShowFullBio(false)}
                            className="text-[#FF3366] text-sm mt-1 hover:underline"
                          >
                            Show less
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-[#999] italic">
                        No bio yet. Click edit to add something about yourself.
                      </p>
                    )}
                  </div>
                )}
              </div>
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
                  <div className="flex flex-wrap gap-3">
                    {userHobbies
                      .filter((hobby) => selectedHobbyIds.includes(hobby.id))
                      .map((hobby) => (
                        <div
                          key={hobby.id}
                          className="bg-[#FF3366] text-white px-5 py-2 rounded-full flex items-center shadow-sm hover:shadow-md transition-shadow"
                        >
                          <span className="text-md">{hobby.name}</span>
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
    </div>
  );
}
