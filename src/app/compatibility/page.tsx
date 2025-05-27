"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import LoginModal from "@/components/LoginModal";

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

export default function CompatibilityPage() {
  const { data: session } = useSession();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [compatibleUsers, setCompatibleUsers] = useState<CompatibleUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch compatible users when the user is logged in
  useEffect(() => {
    if (!session?.user) return;

    const fetchCompatibleUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/users/compatibility");
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        setCompatibleUsers(data.users || []);
      } catch (error) {
        console.error("Error fetching compatible users:", error);
        setError(
          "Failed to load compatibility matches. Please try again later."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompatibleUsers();
  }, [session]);

  const handleLoginClick = () => {
    setIsLoginModalOpen(true);
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
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F3] to-[#FFE5EA] pb-20 font-['Poppins']">
      <div className="max-w-[1200px] mx-auto p-8 bg-white rounded-[20px] shadow-md my-6">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#FF3366] to-[#FF6B98] text-transparent bg-clip-text mb-2">
            Compatibility Matches
          </h1>
          <p className="text-lg text-[#666] mb-6">
            People who share your interests and passions
          </p>
        </header>

        {/* Main Content */}
        <main>
          {!session ? (
            <div className="text-center py-12 bg-[#FFF0F3] rounded-[20px] shadow-sm">
              <h2 className="text-2xl font-semibold text-[#333] mb-4">
                Find Your Best Matches
              </h2>
              <p className="text-[#666] mb-6 max-w-lg mx-auto">
                Sign in to see people who share your interests and are most
                compatible with you.
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
          ) : error ? (
            <div className="text-center py-12 bg-red-50 rounded-[20px] shadow-sm">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-[#FF3366] text-white rounded-2xl py-2 px-6 font-medium transition-all hover:bg-[#E62E5C]"
              >
                Try Again
              </button>
            </div>
          ) : compatibleUsers.length === 0 ? (
            <div className="text-center py-12 bg-[#FFF0F3] rounded-[20px] shadow-sm">
              <h2 className="text-2xl font-semibold text-[#333] mb-4">
                No Matches Found
              </h2>
              <p className="text-[#666] mb-6 max-w-lg mx-auto">
                We couldn't find any users who share your interests. Add more
                hobbies to your profile or check back later.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                      View Profile
                    </Link>
                    <Link
                      href={`/chat?userId=${user.id}`}
                      className="flex-1 text-center bg-[#FF3366] text-white border-2 border-[#FF3366] rounded-2xl py-2 px-4 font-medium transition-all hover:bg-[#E62E5C]"
                    >
                      Chat
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
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
              className="text-[#666] no-underline font-medium"
            >
              Profile
            </Link>
          </li>
          <li>
            <Link
              href="/compatibility"
              className="text-[#BE185D] no-underline font-medium"
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
