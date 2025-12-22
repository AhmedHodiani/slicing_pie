"use client";

import pb from "@/lib/pocketbase";
import { RecordModel } from "pocketbase";
import Avatar from "./avataaars-lib";

interface UserWithStats extends RecordModel {
  totalSlices: number;
  equity: number;
  title?: string;
  avatar_options?: any;
}

interface TeamGridProps {
  users: UserWithStats[];
}

export default function TeamGrid({ users }: TeamGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {users.map((user) => (
        <div
          key={user.id}
          className="flex flex-col items-center rounded-lg border border-border bg-card p-6 shadow-card transition-smooth hover:shadow-elegant"
        >
          <div className="mb-4 h-24 w-24 rounded-full overflow-hidden border-4 border-muted bg-muted flex items-center justify-center">
            {user.avatar_options ? (
              <Avatar
                avatarStyle="Circle"
                className="size-27 mb-4 absolute"
                {...user.avatar_options}
              />
            ) : user.avatar ? (
              <img
                src={pb.files.getUrl(user, user.avatar)}
                alt={user.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="text-2xl font-bold text-muted-foreground">
                {user.name?.charAt(0).toUpperCase() || "?"}
              </div>
            )}
          </div>
          
          <h3 className="text-lg font-bold text-foreground text-center">{user.name}</h3>
          {user.title && <p className="text-sm font-medium text-primary mb-1 text-center">{user.title}</p>}
          <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider">{user.role}</p>
          
          <div className="w-full grid grid-cols-2 gap-4 border-t border-border pt-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Equity</p>
              <p className="text-xl font-bold text-primary">{user.equity.toFixed(1)}%</p>
            </div>
            <div className="text-center border-l border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Slices</p>
              <p className="text-lg font-semibold text-foreground">{user.totalSlices.toLocaleString()}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
