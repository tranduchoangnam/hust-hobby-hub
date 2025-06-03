import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Avatar from "./Avatar";

type Hobby = {
  id: string;
  name: string;
};

type User = {
  id: string;
  name: string;
  image: string | null;
  hobbies: Hobby[];
  followedAt?: Date;
};

type UserListProps = {
  title: string;
  users: User[];
  isLoading: boolean;
  emptyMessage: string;
  onClose: () => void;
};

export default function UserList({
  title,
  users,
  isLoading,
  emptyMessage,
  onClose,
}: UserListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter users based on search query
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl transform scale-100 animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-gradient-to-b from-[#FF3366] to-[#FF6B8A] rounded-full"></div>
            <h2 className="text-xl font-bold text-[#333] font-montserrat">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#999] hover:text-[#FF3366] transition-colors duration-200 hover:rotate-90 transform transition-transform p-2 rounded-full hover:bg-gray-50"
            aria-label="Close"
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
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-5 border-b border-gray-50">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên..."
              className="w-full px-4 py-3 pl-12 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF3366]/20 focus:border-[#FF3366] transition-all duration-200 bg-gray-50 focus:bg-white font-medium placeholder:text-gray-400"
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

        {/* User List */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center h-48 p-8">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-[#FF3366]/20 border-t-[#FF3366] rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-[#FF6B8A] rounded-full animate-spin animation-delay-150"></div>
              </div>
              <p className="text-[#666] mt-4 font-medium">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
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
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                    />
                  </svg>
                )}
              </div>
              {searchQuery ? (
                <div>
                  <p className="text-[#666] font-medium mb-1">
                    Không có người dùng có sở thích "{searchQuery}"
                  </p>
                  <p className="text-[#999] text-sm">
                    Hãy thử điều chỉnh từ khóa tìm kiếm
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-[#666] font-medium mb-1">{emptyMessage}</p>
                  <p className="text-[#999] text-sm">
                    Kiểm tra lại sau để xem thêm thành viên mới
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-2">
              {filteredUsers.map((user, index) => (
                <div
                  key={user.id}
                  className="group hover:bg-gradient-to-r hover:from-gray-50 hover:to-[#FFF8FA] rounded-xl transition-all duration-200 hover:shadow-sm border border-transparent hover:border-gray-100"
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  <Link
                    href={`/users/${user.id}`}
                    className="flex items-center p-4 gap-4 relative"
                  >
                    <div className="relative">
                      <Avatar
                        src={user.image}
                        alt={user.name}
                        size={52}
                        className="flex-shrink-0 group-hover:scale-105 transition-transform duration-200"
                        showOnlineStatus={Math.random() > 0.5} // Random online status for demo
                        isOnline={Math.random() > 0.3}
                      />
                    </div>

                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-[#333] truncate font-montserrat group-hover:text-[#FF3366] transition-colors duration-200">
                          {user.name}
                        </h3>
                        {user.followedAt && (
                          <div className="flex items-center gap-1 text-[#FF3366]">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                            <span className="text-xs font-medium">
                              Đang theo dõi
                            </span>
                          </div>
                        )}
                      </div>

                      {user.hobbies.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.hobbies.slice(0, 2).map((hobby) => (
                            <span
                              key={hobby.id}
                              className="bg-gradient-to-r from-[#FFF0F3] to-[#FFE5EA] text-[#FF3366] rounded-full px-3 py-1 text-xs font-medium border border-[#FFD6DD] group-hover:from-[#FF3366] group-hover:to-[#FF6B8A] group-hover:text-white transition-all duration-200"
                            >
                              #{hobby.name}
                            </span>
                          ))}
                          {user.hobbies.length > 2 && (
                            <span className="bg-gray-100 text-[#666] rounded-full px-3 py-1 text-xs font-medium group-hover:bg-gray-200 transition-colors duration-200">
                              +{user.hobbies.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-gray-400">
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
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-xs">Không có sở thích</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0 text-gray-300 group-hover:text-[#FF3366] group-hover:translate-x-1 transition-all duration-200">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>

                    {/* Subtle gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FF3366]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none"></div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with user count */}
        {!isLoading && filteredUsers.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-center gap-2 text-sm text-[#666]">
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
                  d="M17 20h5v-2a3 3 0 00-5.196-2.121M9 20H4v-2a3 3 0 015.196-2.121M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a2 2 0 11-4 0 2 2 0 014 0zM7 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span className="font-medium">
                {filteredUsers.length}{" "}
                {filteredUsers.length === 1 ? "user" : "users"}
                {searchQuery && ` matching "${searchQuery}"`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
        .animation-delay-150 {
          animation-delay: 150ms;
        }
        @keyframes slide-in-from-bottom-4 {
          from {
            transform: translateY(16px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-in {
          animation-fill-mode: both;
        }
        .slide-in-from-bottom-4 {
          animation-name: slide-in-from-bottom-4;
        }
        .fade-in {
          animation-name: fade-in;
        }
        .duration-200 {
          animation-duration: 200ms;
        }
        .duration-300 {
          animation-duration: 300ms;
        }
      `}</style>
    </div>
  );
}
