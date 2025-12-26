"use client";

import { useEffect, useState } from "react";

interface ActivityStatusProps {
  lastActive: string | null | undefined;
}

export default function ActivityStatus({ lastActive }: ActivityStatusProps) {
  const [timeAgo, setTimeAgo] = useState<string>("");
  const [status, setStatus] = useState<"green" | "yellow" | "grey">("grey");

  useEffect(() => {
    const updateStatus = () => {
      if (!lastActive) {
        setStatus("grey");
        setTimeAgo("");
        return;
      }

      const now = new Date().getTime();
      const lastActiveTime = new Date(lastActive).getTime();
      const diffMinutes = Math.floor((now - lastActiveTime) / (1000 * 60));

      // Determine status color
      if (diffMinutes < 2) {
        setStatus("green");
      } else if (diffMinutes < 60) {
        setStatus("yellow");
      } else {
        setStatus("grey");
      }

      // Format time ago
      if (diffMinutes < 1) {
        setTimeAgo("just now");
      } else if (diffMinutes === 1) {
        setTimeAgo("1 minute ago");
      } else if (diffMinutes < 60) {
        setTimeAgo(`${diffMinutes} minutes ago`);
      } else {
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours === 1) {
          setTimeAgo("1 hour ago");
        } else if (diffHours < 24) {
          setTimeAgo(`${diffHours} hours ago`);
        } else {
          const diffDays = Math.floor(diffHours / 24);
          if (diffDays === 1) {
            setTimeAgo("1 day ago");
          } else if (diffDays < 30) {
            setTimeAgo(`${diffDays} days ago`);
          } else {
            const diffMonths = Math.floor(diffDays / 30);
            if (diffMonths === 1) {
              setTimeAgo("1 month ago");
            } else {
              setTimeAgo(`${diffMonths} months ago`);
            }
          }
        }
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [lastActive]);

  // Don't render if lastActive is null or empty
  if (!lastActive) {
    return null;
  }

  const statusColors = {
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    grey: "bg-gray-400"
  };

  return (
    <div className="relative group inline-block">
      <div
        className={`w-3 h-3 rounded-full ${statusColors[status]} ring-2 ring-white dark:ring-gray-900 shadow-sm`}
        title={`Active ${timeAgo}`}
      />
      {/* Tooltip */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg border border-border whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-50">
        Active {timeAgo}
        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-border" />
      </div>
    </div>
  );
}
