"use client";

import type { Metadata } from "next";
import React, { useState, useEffect } from "react";
import { useAppSelector } from "@/store/hooks";

// TypeScript interfaces
interface ChatMessage {
  id?: number;
  role: "user" | "assistant";
  content: string;
}

interface SendMessageResponse {
  messageHistoryArray: ChatMessage[];
  conversationId: string;
}

interface ConversationResponse {
  messageHistoryArray: ChatMessage[];
}

interface UserDataFilesResponse {
  files: string[];
}

export default function Home() {
  const token = useAppSelector((state) => state.user.token);

  // ==== Upload state ====
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [userContextDataFilesArray, setUserContextDataFilesArray] = useState<
    string[]
  >([]);

  // ==== Chat state ====
  const [messageHistoryArray, setMessageHistoryArray] = useState<
    ChatMessage[]
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [conversationId, setConversationId] = useState<string>("");

  useEffect(() => {
    fetchUserContextDataFiles();
  }, []);

  const fetchUserContextDataFiles = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/data/user-data-files-list`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed with status ${res.status}`);
      }

      const data: UserDataFilesResponse = await res.json();
      setUserContextDataFilesArray(data?.files || []);
    } catch (err) {
      console.error(err);
      const errorMsg =
        err instanceof Error ? err.message : "Failed to fetch files.";
      setStatus(errorMsg);
      alert("Failed to fetch files. Please try again.");
    }
  };

  const handleDeleteUserContextDataFile = async (filename: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/data/user-data/${filename}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName: filename,
          }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Delete failed with status ${res.status}`);
      }

      const data = await res.json();
      setStatus(data?.message || "Delete successful.");
      const tempData = userContextDataFilesArray.filter(
        (file) => file !== filename
      );
      setUserContextDataFilesArray(tempData);
    } catch (err) {
      console.error(err);
      const errorMsg =
        err instanceof Error ? err.message : "Delete failed.";
      setStatus(errorMsg);
      alert("Delete failed. Please try again.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) setFile(selectedFile);
  };

  const handleUploadContextFile = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setStatus("");

    if (!file) {
      alert("Please select a file to upload.");
      return;
    }

    // Only CSV now
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".csv")) {
      alert("Only .csv files are allowed.");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file, file.name);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/data/receive-user-data`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Upload failed with status ${response.status}`);
      }

      setStatus("Upload successful.");
      setFile(null);
      e.currentTarget.reset();
      fetchUserContextDataFiles();
    } catch (err) {
      console.error(err);
      const errorMsg =
        err instanceof Error ? err.message : "Upload failed.";
      setStatus(errorMsg);
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/chat/langflow`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userMessage: trimmed,
            conversationId: conversationId || null,
            messageHistoryArray: messageHistoryArray,
          }),
        }
      );

      const contentType = response.headers.get("Content-Type");
      let resJson: SendMessageResponse | null = null;

      if (contentType?.includes("application/json")) {
        resJson = await response.json();
      }

      if (response.ok && resJson) {
        setMessageHistoryArray(resJson.messageHistoryArray);
        setConversationId(resJson.conversationId);
        setChatInput("");
      } else {
        const errorMessage =
          (resJson as any)?.error ||
          `There was a server error: ${response.status}`;
        console.error(errorMessage);
        alert(errorMessage);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    }
  };

  const handleRefreshConversation = async () => {
    if (!conversationId) {
      alert("Please enter a conversation ID first.");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/chat/conversation/${conversationId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const contentType = response.headers.get("Content-Type");
      let resJson: ConversationResponse | null = null;

      if (contentType?.includes("application/json")) {
        resJson = await response.json();
      }

      if (response.ok && resJson) {
        setMessageHistoryArray(resJson.messageHistoryArray);
      } else {
        const errorMessage =
          (resJson as any)?.error ||
          `There was a server error: ${response.status}`;
        console.error(errorMessage);
        alert(errorMessage);
      }
    } catch (error) {
      console.error("Error refreshing conversation:", error);
      alert("Failed to refresh conversation. Please try again.");
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl p-4 md:p-6">
      <div className="flex flex-col space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Chat with Samurai
        </h1>

        {/* ===== UPLOAD SECTION ===== */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Upload Form */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              Upload
            </h3>
            <form
              onSubmit={handleUploadContextFile}
              encType="multipart/form-data"
              className="space-y-4"
            >
              <div className="space-y-2">
                <label
                  htmlFor="dbFileUpload"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Upload data file (.csv):
                </label>
                <input
                  id="dbFileUpload"
                  name="file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:file:bg-blue-900 dark:file:text-blue-200"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-600"
                disabled={isUploading || !file}
              >
                {isUploading ? "Uploading…" : "Upload"}
              </button>
            </form>
            {status && (
              <p
                aria-live="polite"
                className="mt-4 text-sm text-gray-600 dark:text-gray-400"
              >
                {status}
              </p>
            )}
          </div>

          {/* User Context Data Files */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              User Context Data Files
            </h3>
            {userContextDataFilesArray.length > 0 ? (
              <ul className="space-y-2">
                {userContextDataFilesArray.map((filename, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-600 dark:bg-gray-700"
                  >
                    <span className="truncate text-sm text-gray-700 dark:text-gray-300">
                      {filename}
                    </span>
                    <button
                      className="ml-4 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-red-600 text-sm font-bold text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      onClick={() => handleDeleteUserContextDataFile(filename)}
                      title="Delete file"
                    >
                      X
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No files uploaded yet.
              </p>
            )}
          </div>
        </div>

        {/* ===== CHAT SECTION ===== */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          {/* Conversation ID Section */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <label
                htmlFor="conversationId"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Conversation ID
              </label>
              <input
                id="conversationId"
                type="text"
                placeholder="Enter or auto-generated on first message"
                value={conversationId}
                onChange={(e) => setConversationId(e.target.value)}
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                className="rounded-md bg-green-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-green-700 dark:hover:bg-green-600"
                onClick={handleRefreshConversation}
                disabled={!conversationId}
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Chat History */}
          <div
            className="mb-6 h-96 space-y-3 overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-900"
            role="log"
            aria-live="polite"
          >
            {messageHistoryArray.length === 0 ? (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                No messages yet. Start a conversation below.
              </p>
            ) : (
              messageHistoryArray.map((m, idx) => {
                const role =
                  typeof m?.role === "string" ? m.role : "assistant";
                const content =
                  typeof m?.content === "string"
                    ? m.content
                    : m?.content != null
                      ? JSON.stringify(m.content)
                      : "";
                const isUser = role === "user";

                return (
                  <div
                    key={m?.id ?? idx}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        isUser
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words text-sm">
                        {content}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
              type="text"
              placeholder="Type a message…"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-600"
              disabled={!chatInput.trim()}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
