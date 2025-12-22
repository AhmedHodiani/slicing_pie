"use client";

import pb from "@/lib/pocketbase";
import { RecordModel } from "pocketbase";
import Avatar from "./avataaars-lib";

interface Contribution extends RecordModel {
  expand?: {
    user: {
      name: string;
      avatar: string;
      avatar_options?: any;
      collectionId: string;
      id: string;
    };
  };
}

interface ActivityFeedProps {
  contributions: Contribution[];
  headerAction?: React.ReactNode;
}

export default function ActivityFeed({ contributions, headerAction }: ActivityFeedProps) {
  // Take only the last 10 items
  const recent = contributions.slice(0, 10);

  return (
    <div className="rounded-lg border border-border bg-card shadow-card">
      <div className="p-6 border-b border-border flex justify-between items-center">
        <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
        {headerAction}
      </div>
      <div className="divide-y divide-border">
        {recent.map((c) => {
          const user = c.expand?.user;
          const isMoney = c.multiplier === 4;
          
          return (
            <div key={c.id} className="flex items-center p-4 hover:bg-muted/20 transition-colors">
              <div className="flex-shrink-0 mr-4 h-10 w-10 rounded-full overflow-hidden flex items-center justify-center">
                {user?.avatar_options ? (
                  <Avatar
                    style={{ width: '100%', height: '100%' }}
                    avatarStyle="Circle"
                    {...user.avatar_options}
                  />
                ) : user?.avatar ? (
                  <img
                    src={pb.files.getUrl(user, user.avatar)}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-sm font-bold text-muted-foreground">
                    {user?.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {user?.name || "Unknown User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  Added {isMoney ? "cash contribution" : "time contribution"}
                </p>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isMoney ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                }`}>
                  +{c.slices.toLocaleString()} slices
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(c.created).toLocaleDateString()}
                </p>
              </div>
            </div>
          );
        })}
        {recent.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No activity yet.
          </div>
        )}
      </div>
    </div>
  );
}
