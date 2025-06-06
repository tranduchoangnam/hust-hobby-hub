"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import LoginModal from "@/components/LoginModal";
import Avatar from "@/components/Avatar";
import { LoveNote } from "@/types/models";
import { signOut } from "next-auth/react";

export default function LoveNotePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loveNotes, setLoveNotes] = useState<LoveNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLoveNote, setSelectedLoveNote] = useState<LoveNote | null>(
    null
  );
  const [loveNoteAnswer, setLoveNoteAnswer] = useState("");

  // Kiểm tra xác thực
  useEffect(() => {
    if (status === "unauthenticated") {
      setIsLoginModalOpen(true);
    }
  }, [status]);

  // Lấy tất cả ghi chú cho người dùng hiện tại
  useEffect(() => {
    if (!session?.user) return;

    const fetchLoveNotes = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/love-notes/all");
        if (response.ok) {
          const data = await response.json();
          setLoveNotes(data);
        }
      } catch (error) {
        console.error("Lỗi khi lấy ghi chú:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoveNotes();
  }, [session]);

  const handleSubmitAnswer = async () => {
    if (!loveNoteAnswer.trim() || !selectedLoveNote) return;

    try {
      const isRecipient = selectedLoveNote.recipient.id === session?.user?.id;

      const response = await fetch("/api/love-notes/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          loveNoteId: selectedLoveNote.id,
          answer: loveNoteAnswer,
          isRecipient,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const updatedLoveNote = data.loveNote || data; // Handle both new and old response formats

        // Cập nhật danh sách ghi chú
        setLoveNotes((prev) =>
          prev.map((note) =>
            note.id === updatedLoveNote.id ? updatedLoveNote : note
          )
        );

        // Cập nhật ghi chú đang chọn
        setSelectedLoveNote(updatedLoveNote);
        setLoveNoteAnswer("");

        // Show success message that the answer was sent as a message
        if (data.message) {
          // Could add a toast notification here if desired
          console.log("Answer sent as message to chat!");
        }
      }
    } catch (error) {
      console.error("Lỗi khi trả lời ghi chú:", error);
    }
  };

  const getPartnerName = (loveNote: LoveNote) => {
    const isUserSender = loveNote.sender.id === session?.user?.id;
    return isUserSender ? loveNote.recipient.name : loveNote.sender.name;
  };

  const getPartnerImage = (loveNote: LoveNote) => {
    const isUserSender = loveNote.sender.id === session?.user?.id;
    return isUserSender ? loveNote.recipient.image : loveNote.sender.image;
  };

  const getUserAnswer = (loveNote: LoveNote) => {
    const isUserSender = loveNote.sender.id === session?.user?.id;
    return isUserSender ? loveNote.senderAnswer : loveNote.recipientAnswer;
  };

  const getPartnerAnswer = (loveNote: LoveNote) => {
    const isUserSender = loveNote.sender.id === session?.user?.id;
    return isUserSender ? loveNote.recipientAnswer : loveNote.senderAnswer;
  };

  if (!session && status !== "loading") {
    return (
      <LoginModal
        onClose={() => {
          setIsLoginModalOpen(false);
          router.push("/");
        }}
      />
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FFF0F3] to-[#FFE5EA] pb-20 font-['Montserrat']">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-8 h-8 text-[#FF3366]"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <circle cx="12" cy="17" r="1" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[#FF3366] mb-2 font-montserrat">
            Câu Hỏi Hàng Ngày
          </h1>
          <p className="text-gray-600 max-w-md mx-auto font-montserrat">
            Câu hỏi hàng ngày giúp bạn bắt đầu cuộc trò chuyện và tìm hiểu nhau
            tốt hơn
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="font-montserrat text-gray-600">Đang tải câu hỏi...</p>
          </div>
        ) : loveNotes.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {loveNotes.map((loveNote) => (
              <div
                key={loveNote.id}
                className="bg-white rounded-xl p-6 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedLoveNote(loveNote)}
              >
                <div className="flex items-center mb-4">
                  <Avatar
                    src={getPartnerImage(loveNote)}
                    alt={getPartnerName(loveNote)}
                    size={48}
                    className=""
                    showOnlineStatus={true}
                    isOnline={Math.random() > 0.5} // Random online status for demo
                  />
                  <div className="ml-3">
                    <h3 className="font-medium font-montserrat">
                      {getPartnerName(loveNote)}
                    </h3>
                    <p className="text-xs text-gray-500 font-montserrat">
                      {new Date(loveNote.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <p className="text-gray-700 mb-3 font-medium font-montserrat">
                  {loveNote.question}
                </p>

                <div className="flex justify-between text-sm">
                  <span
                    className={`px-2 py-1 rounded font-montserrat ${
                      getUserAnswer(loveNote)
                        ? "bg-pink-50 text-[#FF3366]"
                        : "bg-gray-50 text-gray-500"
                    }`}
                  >
                    {getUserAnswer(loveNote)
                      ? "Câu trả lời của bạn"
                      : "Chưa trả lời"}
                  </span>
                  <span
                    className={`px-2 py-1 rounded font-montserrat ${
                      getPartnerAnswer(loveNote)
                        ? "bg-pink-50 text-[#FF3366]"
                        : "bg-gray-50 text-gray-500"
                    }`}
                  >
                    {getPartnerAnswer(loveNote) ? "Phản hồi" : "Chờ phản hồi"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 shadow-md text-center">
            <p className="text-gray-600 mb-4 font-montserrat">
              Chưa có câu hỏi hàng ngày nào! Bắt đầu cuộc trò chuyện với ai đó
              và bạn sẽ nhận được câu hỏi đầu tiên để phá vỡ bức tường băng.
            </p>
            <Link
              href="/"
              className="text-[#FF3366] hover:underline font-montserrat font-medium"
            >
              Tìm người để trò chuyện
            </Link>
          </div>
        )}
      </div>

      {/* Selected Note Modal */}
      {selectedLoveNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md mx-4">
            <div className="text-center mb-6">
              <div className="bg-pink-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-8 h-8 text-[#FF3366]"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <circle cx="12" cy="17" r="1" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-[#FF3366] font-montserrat">
                Câu Hỏi Hàng Ngày
              </h2>
              <p className="text-gray-700 mt-2 font-montserrat">
                {selectedLoveNote.question}
              </p>
              <p className="text-sm text-gray-500 mt-1 font-montserrat">
                với {getPartnerName(selectedLoveNote)} •{" "}
                {new Date(selectedLoveNote.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Câu trả lời của bạn */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1 font-montserrat">
                Câu trả lời của bạn
              </label>
              {getUserAnswer(selectedLoveNote) ? (
                <p className="bg-pink-50 p-3 rounded-lg text-gray-800 font-montserrat">
                  {getUserAnswer(selectedLoveNote)}
                </p>
              ) : (
                <div>
                  <textarea
                    value={loveNoteAnswer}
                    onChange={(e) => setLoveNoteAnswer(e.target.value)}
                    placeholder="Hãy dành một chút thời gian để suy ngẫm..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3366] font-montserrat"
                    rows={4}
                  />
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!loveNoteAnswer.trim()}
                    className="mt-2 bg-[#FF3366] text-white rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50 font-montserrat"
                  >
                    Chia sẻ
                  </button>
                </div>
              )}
            </div>

            {/* Câu trả lời của {đối phương} */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1 font-montserrat">
                Câu trả lời của {getPartnerName(selectedLoveNote)}
              </label>
              {getPartnerAnswer(selectedLoveNote) ? (
                <p className="bg-pink-50 p-3 rounded-lg text-gray-800 font-montserrat">
                  {getPartnerAnswer(selectedLoveNote)}
                </p>
              ) : (
                <div className="bg-gray-100 p-3 rounded-lg text-gray-400 flex items-center justify-center space-x-2 font-montserrat">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Chờ phản hồi...</span>
                </div>
              )}
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => setSelectedLoveNote(null)}
                className="text-gray-500 rounded-xl px-6 py-2 font-medium font-montserrat"
              >
                Đóng
              </button>

              <Link
                href={`/chat?userId=${
                  selectedLoveNote.sender.id === session?.user?.id
                    ? selectedLoveNote.recipient.id
                    : selectedLoveNote.sender.id
                }`}
                className="ml-3 bg-[#FF3366] text-white rounded-xl px-6 py-2 font-medium font-montserrat"
              >
                Trò chuyện
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Thanh điều hướng dưới cùng */}
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
              <span className="text-sm">Trang chủ</span>
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
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <span className="text-sm font-bold">Câu Hỏi Hàng Ngày</span>
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

      {/* CSS tùy chỉnh cho hiệu ứng glassmorphism */}
      <style jsx>{`
        .backdrop-blur-md {
          backdrop-filter: blur(12px);
        }
        .bg-white\\/95 {
          background-color: rgba(255, 255, 255, 0.95);
        }
      `}</style>
    </main>
  );
}
