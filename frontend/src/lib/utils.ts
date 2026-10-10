export function formatMessageTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDistanceToNow(date: string | Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export function getUserHandle(user: any): string {
  if (!user) return "";
  if (user.handle) return user.handle;
  if (user.email) {
    const handlePart = user.email.split("@")[0];
    return `@${handlePart.toLowerCase()}`;
  }
  if (user.fullName) {
    const handlePart = user.fullName.replace(/\s+/g, "").toLowerCase();
    return `@${handlePart}`;
  }
  return "@user";
}
