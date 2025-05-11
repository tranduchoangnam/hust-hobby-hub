"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Prisma } from "@prisma/client";
import LoginModal from "@/components/LoginModal";

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
    const [userHobbies, setUserHobbies] = useState<{ id: string; name: string }[]>([]);
    const [selectedHobby, setSelectedHobby] = useState<string | null>(null);
    const [users, setUsers] = useState<UserWithHobbies[]>([]);
    const [compatibleUsers, setCompatibleUsers] = useState<CompatibleUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [viewMode, setViewMode] = useState<"browse" | "compatibility">("browse");
    const [showOnlyUserInterests, setShowOnlyUserInterests] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>("");

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
                    `/api/users?hobbyId=${selectedHobby}`,
                );
                const data = await response.json();
                setUsers(data);
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, [selectedHobby, viewMode]);

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

    // Filter hobbies based on user interests and search query
    const displayedHobbies = useMemo(() => {
        let filteredHobbies = hobbies;
        
        // First filter by user interests if enabled
        if (session && showOnlyUserInterests && userHobbies.length > 0) {
            const userHobbiesIds = userHobbies.map(hobby => hobby.id);
            filteredHobbies = hobbies.filter(hobby => userHobbiesIds.includes(hobby.id));
        }
        
        // Then filter by search query if provided
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filteredHobbies = hobbies.filter(hobby => 
                hobby.name.toLowerCase().includes(query)
            );
        }
        
        return filteredHobbies;
    }, [hobbies, userHobbies, showOnlyUserInterests, session, searchQuery]);

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
        <div className="min-h-screen bg-gradient-to-br from-[#FFF0F3] to-[#FFE5EA] pb-20 font-['Poppins']" id="home-screen">
            <div className="max-w-[1200px] mx-auto p-8 bg-white rounded-[20px] shadow-md my-6">
                {/* Header */}
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-[#FF3366] to-[#FF6B98] text-transparent bg-clip-text mb-2">
                        Find Your Connection
                    </h1>
                    <p className="text-lg text-[#666] mb-6">
                        Discover people who share your passions
                    </p>
                </header>

                {/* View Toggle */}
                {session && (
                    <div className="flex justify-center mb-8">
                        <div className="flex rounded-full bg-[#F5F5F5] p-1 w-fit">
                            <button 
                                className={`px-6 py-2 rounded-full transition-all ${viewMode === "browse" ? "bg-[#FF3366] text-white shadow-md" : "text-[#666]"}`}
                                onClick={() => setViewMode("browse")}
                            >
                                Browse by Interest
                            </button>
                            <button 
                                className={`px-6 py-2 rounded-full transition-all ${viewMode === "compatibility" ? "bg-[#FF3366] text-white shadow-md" : "text-[#666]"}`}
                                onClick={() => setViewMode("compatibility")}
                            >
                                Best Matches
                            </button>
                        </div>
                    </div>
                )}

                {/* Notification for users with no interests */}
                {session && viewMode === "compatibility" && compatibleUsers.length === 0 && (
                    <div className="bg-[#FFF0F3] rounded-[20px] p-5 mb-8 flex items-center">
                        <div className="bg-[#FFCCD5] rounded-full p-3 mr-4 flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#FF3366" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                            </svg>
                        </div>
                        <div className="flex-grow">
                            <h3 className="font-semibold text-[#333] mb-1">Set up your interests</h3>
                            <p className="text-sm text-[#666] mb-2">
                                To see your compatibility matches, you need to select your interests in your profile.
                            </p>
                            <Link
                                href="/profile"
                                className="text-[#FF3366] font-medium inline-flex items-center text-sm"
                            >
                                Go to profile settings
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                                    <path d="M5 12h14M12 5l7 7-7 7"/>
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
                                    placeholder="Search for interests..."
                                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#FF3366] focus:border-transparent"
                                />
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                    </svg>
                                </div>
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            {/* Toggle Button - Only show for logged in users */}
                            {session && userHobbies.length > 0 && (
                                <button
                                    onClick={() => {
                                        setShowOnlyUserInterests(!showOnlyUserInterests);
                                        setSelectedHobby(null); // Reset selection when toggling
                                        setSearchQuery(""); // Clear search when toggling
                                    }}
                                    className="flex items-center gap-2 bg-[#FFF0F3] px-4 py-2 rounded-full text-[#FF3366] hover:bg-[#FFE5EA] transition-colors whitespace-nowrap"
                                >
                                    {showOnlyUserInterests ? (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                                <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                                                <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                            </svg>
                                            <span>My Interests</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                            </svg>
                                            <span>All Interests</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Interest Tags Section */}
                        <section className="mb-12">
                            <div className="flex flex-wrap justify-center gap-4">
                                {displayedHobbies.length > 0 ? displayedHobbies.map((hobby) => (
                                    <div
                                        key={hobby.id}
                                        onClick={() => handleHobbySelect(hobby.id)}
                                        className={`py-2 px-6 rounded-[20px] shadow-md cursor-pointer transition-all hover:-translate-y-[3px] hover:shadow-lg ${
                                            selectedHobby === hobby.id 
                                            ? "bg-[#FF3366] text-white" 
                                            : "bg-white text-[#FF3366]"
                                        }`}
                                    >
                                        {hobby.name}
                                    </div>
                                )) : searchQuery ? (
                                    <div className="text-center w-full py-6 bg-[#FFF0F3] rounded-[20px]">
                                        <p className="text-[#666] mb-3">No interests found matching "{searchQuery}".</p>
                                    </div>
                                ) : (session && showOnlyUserInterests) ? (
                                    <div className="text-center w-full py-6 bg-[#FFF0F3] rounded-[20px]">
                                        <p className="text-[#666] mb-3">You haven't selected any interests yet.</p>
                                        <Link
                                            href="/profile"
                                            className="text-[#FF3366] font-medium inline-flex items-center"
                                        >
                                            Go to profile to add interests
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                                                <path d="M5 12h14M12 5l7 7-7 7"/>
                                            </svg>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="text-center w-full py-6 bg-[#FFF0F3] rounded-[20px]">
                                        <p className="text-[#666] mb-3">No interests available. Please try another search.</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* User Profiles - Browse Mode */}
                        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {isLoading ? (
                                <div className="col-span-full text-center py-8">
                                    <div className="w-16 h-16 border-4 border-[#FF3366] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-[#666]">Loading users...</p>
                                </div>
                            ) : users.length > 0 ? (
                                users.map((user) => (
                                    <div
                                        key={user.id}
                                        className="bg-white rounded-[24px] p-6 shadow-md flex flex-col transition-all hover:-translate-y-1 hover:shadow-lg"
                                    >
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
                                            <p className="text-sm text-[#666] mb-4 text-center">
                                                {user.hobbies.length > 0 
                                                    ? `${user.hobbies[0].hobby.name} ${user.hobbies.length > 1 ? 'and' : ''} ${user.hobbies.length > 1 ? user.hobbies[1].hobby.name : ''} enthusiast`
                                                    : 'New user'}
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
                                                            {user.commonHobbies === 1 ? 'shared interest' : 'shared interests'}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="text-sm text-[#666]">
                                                            {Math.min(user.hobbies.length, 3)}
                                                        </span>
                                                        <span className="text-sm text-[#666]">
                                                            mutual interests
                                                        </span>
                                                    </>
                                                )}
                                                <div className="ml-auto">
                                                    {renderMutualDots(session && user.commonHobbies !== undefined 
                                                        ? Math.min(user.commonHobbies, 3) 
                                                        : Math.min(user.hobbies.length, 3))}
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <Link
                                                    href={session ? `/users/${user.id}` : "#"}
                                                    onClick={(e) => !session && (e.preventDefault(), handleLoginClick())}
                                                    className="flex-1 text-center bg-transparent text-[#FF3366] border-2 border-[#FF3366] rounded-2xl py-2 px-4 font-medium transition-all hover:bg-[#FFF0F3]"
                                                >
                                                    Profile
                                                </Link>
                                                <Link
                                                    href={session ? `/chat/${user.id}` : "#"}
                                                    onClick={(e) => !session && (e.preventDefault(), handleLoginClick())}
                                                    className="flex-1 text-center bg-[#FF3366] text-white border-2 border-[#FF3366] rounded-2xl py-2 px-4 font-medium transition-all hover:bg-[#E62E5C]"
                                                >
                                                    Chat
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : selectedHobby ? (
                                <div className="col-span-full text-center py-8">
                                    No users found with this interest.
                                </div>
                            ) : (
                                <div className="col-span-full text-center py-8">
                                    Select an interest to see people.
                                </div>
                            )}
                        </section>
                    </>
                )}

                {viewMode === "compatibility" && (
                    <>
                        <h2 className="text-2xl font-semibold text-center text-[#333] mb-8">
                            Your Best Matches
                        </h2>

                        {!session ? (
                            <div className="text-center py-12 bg-[#FFF0F3] rounded-[20px] shadow-sm">
                                <h2 className="text-2xl font-semibold text-[#333] mb-4">Find Your Best Matches</h2>
                                <p className="text-[#666] mb-6 max-w-lg mx-auto">
                                    Sign in to see people who share your interests and are most compatible with you.
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
                                <p className="text-[#666]">Finding your best matches...</p>
                            </div>
                        ) : compatibleUsers.length === 0 ? (
                            <div className="text-center py-12 bg-[#FFF0F3] rounded-[20px] shadow-sm">
                                <h2 className="text-2xl font-semibold text-[#333] mb-4">No Matches Found</h2>
                                <p className="text-[#666] mb-6 max-w-lg mx-auto">
                                    We couldn't find any users who share your interests. Add more hobbies to your profile or check back later.
                                </p>
                            </div>
                        ) : (
                            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {compatibleUsers.map((user) => (
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
                                                {user.commonHobbies === 1 ? 'shared interest' : 'shared interests'}
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
                                                Profile
                                            </Link>
                                            <Link
                                                href={`/chat/${user.id}`}
                                                className="flex-1 text-center bg-[#FF3366] text-white border-2 border-[#FF3366] rounded-2xl py-2 px-4 font-medium transition-all hover:bg-[#E62E5C]"
                                            >
                                                Chat
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </section>
                        )}
                    </>
                )}
            </div>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 w-full bg-white shadow-md z-10">
                <ul className="flex justify-around list-none p-4">
                    <li>
                        <Link href="/" className="text-[#BE185D] font-medium no-underline">
                            Browse
                        </Link>
                    </li>
                    <li>
                        <Link
                            href="/profile"
                            className="text-[#666] no-underline font-medium"
                        >
                            Profile
                        </Link>
                    </li>
                    <li>
                        <Link
                            href="/chat"
                            className="text-[#666] no-underline font-medium"
                            onClick={(e) => !session && (e.preventDefault(), handleLoginClick())}
                        >
                            Chat
                        </Link>
                    </li>
                    <li>
                        <Link
                            href="/love-note"
                            className="text-[#666] no-underline font-medium"
                            onClick={(e) => !session && (e.preventDefault(), handleLoginClick())}
                        >
                            Love Note
                        </Link>
                    </li>
                </ul>
            </nav>

            {isLoginModalOpen && (
                <LoginModal onClose={() => setIsLoginModalOpen(false)} />
            )}
        </div>
    );
}
