import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-xl font-bold text-[#333]">{title}</h2>
          <button
            onClick={onClose}
            className="text-[#666] hover:text-[#FF3366]"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
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
        <div className="p-4 border-b">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name..."
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3366] focus:border-transparent"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
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

        {/* User List */}
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="w-10 h-10 border-4 border-[#FF3366] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 p-4 text-center">
              {searchQuery ? (
                <p className="text-[#666]">
                  No users found matching "{searchQuery}"
                </p>
              ) : (
                <p className="text-[#666]">{emptyMessage}</p>
              )}
            </div>
          ) : (
            <ul className="divide-y">
              {filteredUsers.map((user) => (
                <li key={user.id} className="hover:bg-[#FFF0F3]">
                  <Link
                    href={`/users/${user.id}`}
                    className="flex items-center p-4 gap-3"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#f5f5f5] overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                      {user.image ? (
                        <Image
                          src={user.image}
                          alt={user.name}
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#FF3366] text-white flex items-center justify-center text-lg font-bold">
                          {user.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="flex-grow min-w-0">
                      <h3 className="font-semibold text-[#333] truncate">
                        {user.name}
                      </h3>

                      {user.hobbies.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {user.hobbies.slice(0, 2).map((hobby) => (
                            <span
                              key={hobby.id}
                              className="bg-[#FFF0F3] text-[#FF3366] rounded-full px-2 py-0.5 text-xs"
                            >
                              {hobby.name}
                            </span>
                          ))}
                          {user.hobbies.length > 2 && (
                            <span className="text-[#666] text-xs">
                              +{user.hobbies.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

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
                      className="text-[#999]"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
