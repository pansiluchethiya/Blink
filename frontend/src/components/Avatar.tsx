import React, { useState } from "react";

/**
 * Illustrated avatar (DiceBear, seeded by user id so it's stable).
 * Falls back to initials if the artwork can't load.
 * Real uploaded photos (profilePic) always win when present.
 */
const DICEBEAR_STYLE = "adventurer-neutral";

export function dicebearUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/${DICEBEAR_STYLE}/svg?seed=${encodeURIComponent(seed)}`;
}

function initials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

interface AvatarProps {
  user?: { _id?: string; fullName?: string; profilePic?: string } | null;
  seed?: string;
  name?: string;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ user, seed, name, className = "size-10" }) => {
  const [failed, setFailed] = useState(false);
  const seedKey = seed ?? user?._id ?? user?.fullName ?? "blink";
  const displayName = name ?? user?.fullName ?? "User";
  const photo = user?.profilePic && user.profilePic !== "/avatar.png" ? user.profilePic : null;
  const src = photo ?? dicebearUrl(seedKey);

  if (failed || !src) {
    return (
      <div className={`${className} rounded-full bg-base-200 text-base-content flex items-center justify-center font-bold overflow-hidden`} aria-label={displayName}>
        <span className="text-[0.9em]">{initials(displayName)}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={displayName}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`${className} rounded-full object-cover bg-base-200 overflow-hidden`}
    />
  );
};

export default Avatar;
