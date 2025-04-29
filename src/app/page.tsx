"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
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
}>;

export default function Home() {
    const { data: session } = useSession();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [hobbies, setHobbies] = useState<{ id: string; name: string }[]>([]);
    const [selectedHobby, setSelectedHobby] = useState<string | null>(null);
    const [users, setUsers] = useState<UserWithHobbies[]>([]);
    const [isLoading, setIsLoading] = useState(false);

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

    // Fetch users when a hobby is selected
    useEffect(() => {
        if (!selectedHobby) return;

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
    }, [selectedHobby]);

    const handleHobbySelect = (hobbyId: string) => {
        setSelectedHobby(hobbyId);
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

                {/* Interest Tags Section */}
                <section className="mb-12">
                    <div className="flex flex-wrap justify-center gap-4">
                        {hobbies.map((hobby) => (
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
                        ))}
                    </div>
                </section>

                {/* User Profiles */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {isLoading ? (
                        <div className="col-span-full text-center py-8">Loading...</div>
                    ) : users.length > 0 ? (
                        users.map((user) => (
                            <div
                                key={user.id}
                                className="bg-white rounded-[24px] p-6 shadow-md flex flex-col transition-all hover:-translate-y-1 hover:shadow-lg"
                            >
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
                                        <span className="text-sm text-[#666]">
                                            {Math.min(user.hobbies.length, 3)}
                                        </span>
                                        <span className="text-sm text-[#666]">
                                            mutual interests
                                        </span>
                                        <div className="ml-auto">
                                            {renderMutualDots(Math.min(user.hobbies.length, 3))}
                                        </div>
                                    </div>

                                    <Link
                                        href={session ? `/chat/${user.id}` : "#"}
                                        onClick={(e) => !session && (e.preventDefault(), handleLoginClick())}
                                        className="block w-full text-center bg-transparent text-[#FF3366] border-2 border-[#FF3366] rounded-2xl py-3 px-4 font-medium transition-all hover:bg-[#FF3366] hover:text-white"
                                    >
                                        Send Message
                                    </Link>
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
