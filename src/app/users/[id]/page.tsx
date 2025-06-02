"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import LoginModal from "@/components/LoginModal";
import Avatar from "@/components/Avatar";

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

  const handleLoginClick = () => {
    setIsLoginModalOpen(true);
  };

  // Function to render compatibility badge
  const renderCompatibilityBadge = (score: number) => {
    let color = "bg-gray-200 text-gray-700";
    let text = "Kết nối thấp";

    if (score >= 80) {
      color = "bg-green-100 text-green-800";
      text = "Kết nối hoàn hảo";
    } else if (score >= 60) {
      color = "bg-blue-100 text-blue-800";
      text = "Kết nối tuyệt vời";
    } else if (score >= 40) {
      color = "bg-yellow-100 text-yellow-700";
      text = "Kết nối tốt";
    } else if (score >= 20) {
      color = "bg-orange-100 text-orange-700";
      text = "Kết nối trung bình";
    } else {
      color = "bg-red-100 text-red-700";
      text = "Kết nối thấp";
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
          Trước
        </button>

        {!session ? (
          <div className="text-center py-12 bg-[#FFF0F3] rounded-[20px] shadow-sm">
            <h2 className="text-2xl font-semibold text-[#333] mb-4">
              Sign In Required
            </h2>
            <p className="text-[#666] mb-6 max-w-lg mx-auto">
              Hãy đăng nhập để xem thông tin người dùng và tương tác với họ. Bạn
              sẽ có thể gửi tin nhắn, gửi ghi chú và xem các sở thích chung.
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
            <p className="text-[#666]">Đang tải thông tin người dùng</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-red-50 rounded-[20px] shadow-sm">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => router.back()}
              className="bg-[#FF3366] text-white rounded-2xl py-2 px-6 font-medium transition-all hover:bg-[#E62E5C]"
            >
              Quay lại
            </button>
          </div>
        ) : userCompatibility ? (
          <div className="flex flex-col">
            {/* User Info Section */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8">
              {/* Large Avatar */}
              <div className="flex-shrink-0">
                <Avatar
                  src={userCompatibility.targetUser.image}
                  alt={userCompatibility.targetUser.name || "User profile"}
                  size={144}
                  className="border-4 border-[#FFE0E9] shadow-lg hover:scale-105 transition-transform"
                  showOnlineStatus={true}
                  isOnline={Math.random() > 0.5} // Random online status for demo
                />
              </div>

              <div className="flex-grow text-center md:text-left">
                <h1 className="text-3xl font-bold text-[#333] mb-2">
                  {userCompatibility.targetUser.name}
                </h1>

                <div className="inline-block md:block mb-4 mt-2">
                  {renderCompatibilityBadge(
                    userCompatibility.compatibility.score
                  )}
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-6">
                  {userCompatibility.targetUser.hobbies.map((hobby) => (
                    <span
                      key={hobby.id}
                      className={`px-3 py-1 rounded-2xl text-sm font-medium ${
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

                <div className="mt-6 flex gap-4 justify-center md:justify-start">
                  <Link
                    href={`/chat/${userCompatibility.targetUser.id}`}
                    className="bg-[#FF3366] text-white rounded-2xl py-2 px-6 font-medium transition-all hover:bg-[#E62E5C]"
                  >
                    Gửi tin nhắn
                  </Link>
                  <Link
                    href={`/love-note/new?recipient=${userCompatibility.targetUser.id}`}
                    className="bg-transparent text-[#FF3366] border-2 border-[#FF3366] rounded-2xl py-2 px-6 font-medium transition-all hover:bg-[#FFF0F3]"
                  >
                    Gửi câu hỏi
                  </Link>
                </div>
              </div>
            </div>

            {/* Compatibility Details */}
            <div className="bg-[#FFF0F3] rounded-[20px] p-6 mb-8">
              <h2 className="text-xl font-semibold text-[#333] mb-4">
                Thông tin tương thích
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[#666]">Điểm tương thích</span>
                  <span className="font-bold text-[#FF3366]">
                    {userCompatibility.compatibility.score}%
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#666]">Sở thích chung</span>
                  <span className="font-bold text-[#FF3366]">
                    {userCompatibility.compatibility.commonHobbyCount}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#666]">Sở thích của bạn</span>
                  <span className="font-bold text-[#666]">
                    {userCompatibility.compatibility.userHobbyCount}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#666]">
                    Sở thích của {userCompatibility.targetUser.name}
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
                  Chia sẻ sở thích
                </h2>

                <div className="flex flex-wrap gap-2">
                  {userCompatibility.compatibility.commonHobbies.map(
                    (hobby) => (
                      <div
                        key={hobby.id}
                        className="bg-[#FFE0E9] text-[#FF3366] rounded-2xl px-4 py-2 text-sm font-medium"
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
              <span className="text-sm">Khám phá</span>
            </Link>
          </li>
          <li className="flex-1">
            <Link
              href="/profile"
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
              onClick={(e) => !session && (e.preventDefault(), handleLoginClick())}
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
              href="/daily-questions"
              className="flex items-center justify-center gap-2 text-[#666] no-underline font-medium p-3 rounded-xl transition-all duration-200 hover:bg-gray-100 hover:text-[#FF3366]"
              onClick={(e) => !session && (e.preventDefault(), handleLoginClick())}
            >
              <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                >
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <path d="M12 17h.01"/>
                </svg>
              </div>
              <span className="text-sm">Câu hỏi hàng ngày</span>
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
