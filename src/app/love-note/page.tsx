"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import LoginModal from "@/components/LoginModal";
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

  // Check authentication
  useEffect(() => {
    if (status === "unauthenticated") {
      setIsLoginModalOpen(true);
    }
  }, [status]);

  // Fetch all love notes for the current user
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
        console.error("Error fetching love notes:", error);
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
        const updatedLoveNote = await response.json();

        // Update love notes list
        setLoveNotes((prev) =>
          prev.map((note) =>
            note.id === updatedLoveNote.id ? updatedLoveNote : note
          )
        );

        // Update selected love note
        setSelectedLoveNote(updatedLoveNote);
        setLoveNoteAnswer("");
      }
    } catch (error) {
      console.error("Error answering love note:", error);
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
    <main className="min-h-screen bg-gradient-to-br from-[#FFF0F3] to-[#FFE5EA] pb-20 font-['Poppins']">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-8 h-8 text-[#FF3366]"
            >
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[#FF3366] mb-2 font-poppins">
            Daily Love Notes
          </h1>
          <p className="text-gray-600 max-w-md mx-auto font-poppins">
            Meaningful questions to help you connect more deeply with your loved
            ones
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="font-poppins text-gray-600">Loading love notes...</p>
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
                  <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                    {getPartnerImage(loveNote) ? (
                      <Image
                        src={getPartnerImage(loveNote) as string}
                        alt={getPartnerName(loveNote)}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        {getPartnerName(loveNote).charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium font-poppins">
                      {getPartnerName(loveNote)}
                    </h3>
                    <p className="text-xs text-gray-500 font-poppins">
                      {new Date(loveNote.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <p className="text-gray-700 mb-3 font-medium font-poppins">
                  {loveNote.question}
                </p>

                <div className="flex justify-between text-sm">
                  <span
                    className={`px-2 py-1 rounded font-poppins ${
                      getUserAnswer(loveNote)
                        ? "bg-pink-50 text-[#FF3366]"
                        : "bg-gray-50 text-gray-500"
                    }`}
                  >
                    {getUserAnswer(loveNote) ? "You answered" : "Not answered"}
                  </span>
                  <span
                    className={`px-2 py-1 rounded font-poppins ${
                      getPartnerAnswer(loveNote)
                        ? "bg-pink-50 text-[#FF3366]"
                        : "bg-gray-50 text-gray-500"
                    }`}
                  >
                    {getPartnerAnswer(loveNote)
                      ? "They answered"
                      : "Waiting for answer"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 shadow-md text-center">
            <p className="text-gray-600 mb-4 font-poppins">
              You don't have any love notes yet. Start a conversation with
              someone to receive your first love note.
            </p>
            <Link
              href="/chat"
              className="text-[#FF3366] hover:underline font-poppins"
            >
              Go to messages
            </Link>
          </div>
        )}
      </div>

      {/* Selected Love Note Modal */}
      {selectedLoveNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md mx-4">
            <div className="text-center mb-6">
              <div className="bg-pink-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-8 h-8 text-[#FF3366]"
                >
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-[#FF3366] font-poppins">
                Daily Love Note
              </h2>
              <p className="text-gray-700 mt-2 font-poppins">
                {selectedLoveNote.question}
              </p>
              <p className="text-sm text-gray-500 mt-1 font-poppins">
                With {getPartnerName(selectedLoveNote)} •{" "}
                {new Date(selectedLoveNote.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* My Answer */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1 font-poppins">
                Your Answer
              </label>
              {getUserAnswer(selectedLoveNote) ? (
                <p className="bg-pink-50 p-3 rounded-lg text-gray-800 font-poppins">
                  {getUserAnswer(selectedLoveNote)}
                </p>
              ) : (
                <div>
                  <textarea
                    value={loveNoteAnswer}
                    onChange={(e) => setLoveNoteAnswer(e.target.value)}
                    placeholder="Take a moment to reflect..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3366] font-poppins"
                    rows={4}
                  />
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!loveNoteAnswer.trim()}
                    className="mt-2 bg-[#FF3366] text-white rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50 font-poppins"
                  >
                    Share Answer
                  </button>
                </div>
              )}
            </div>

            {/* Partner's Answer */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1 font-poppins">
                {getPartnerName(selectedLoveNote)}'s Answer
              </label>
              {getPartnerAnswer(selectedLoveNote) ? (
                <p className="bg-pink-50 p-3 rounded-lg text-gray-800 font-poppins">
                  {getPartnerAnswer(selectedLoveNote)}
                </p>
              ) : (
                <div className="bg-gray-100 p-3 rounded-lg text-gray-400 flex items-center justify-center space-x-2 font-poppins">
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
                  <span>Waiting for response...</span>
                </div>
              )}
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => setSelectedLoveNote(null)}
                className="text-gray-500 rounded-xl px-6 py-2 font-medium font-poppins"
              >
                Close
              </button>

              <Link
                href={`/chat?userId=${
                  selectedLoveNote.sender.id === session?.user?.id
                    ? selectedLoveNote.recipient.id
                    : selectedLoveNote.sender.id
                }`}
                className="ml-3 bg-[#FF3366] text-white rounded-xl px-6 py-2 font-medium font-poppins"
              >
                Go to Chat
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-white shadow-md z-10">
        <ul className="flex justify-around list-none p-4">
          <li>
            <Link href="/" className="text-[#666] no-underline font-medium">
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
            <Link href="/chat" className="text-[#666] no-underline font-medium">
              Chat
            </Link>
          </li>
          <li>
            <Link
              href="/love-note"
              className="text-[#BE185D] no-underline font-medium"
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
    </main>
  );
}
