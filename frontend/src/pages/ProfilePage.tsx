import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User } from "lucide-react";
import toast from "react-hot-toast";

const MAX_FILE_SIZE_MB = 7;

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile, uploadAvatar } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  
  // Local state for debounced fields
  const [username, setUsername] = useState(authUser?.username || "");
  const [handle, setHandle] = useState(authUser?.handle || "");
  const [bio, setBio] = useState(authUser?.publicProfile?.bio || "");
  
  const isFirstRender = useRef(true);

  // Sync local state with authUser on initial load or if authUser changes from elsewhere
  useEffect(() => {
    if (authUser) {
      setUsername(authUser.username || "");
      setHandle(authUser.handle || "");
      setBio(authUser.publicProfile?.bio || "");
    }
  }, [authUser]);

  // Debounced update for username
  useEffect(() => {
    if (isFirstRender.current) return;
    if (username === authUser?.username) return;

    const timer = setTimeout(() => {
      updateProfile({ username });
    }, 800);

    return () => clearTimeout(timer);
  }, [username, updateProfile, authUser?.username]);

  // Debounced update for handle
  useEffect(() => {
    if (isFirstRender.current) return;
    if (handle === authUser?.handle) return;

    const timer = setTimeout(() => {
      updateProfile({ handle });
    }, 800);

    return () => clearTimeout(timer);
  }, [handle, updateProfile, authUser?.handle]);

  // Debounced update for bio
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (bio === authUser?.publicProfile?.bio) return;

    const timer = setTimeout(() => {
      updateProfile({ publicProfile: { bio } });
    }, 800);

    return () => clearTimeout(timer);
  }, [bio, updateProfile, authUser?.publicProfile?.bio]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`Image must be smaller than ${MAX_FILE_SIZE_MB}MB`);
      e.target.value = "";
      return;
    }

    // Instant local preview; the file itself goes to POST /auth/avatar.
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      setSelectedImg(reader.result as string);
      await uploadAvatar(file);
    };
  };

  return (
    <div className="h-screen pt-20 bg-base-200 transition-colors duration-200 overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-100 border border-base-300 rounded-3xl p-6 sm:p-8 space-y-8 shadow-xl transition-all duration-200">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-base-content">Profile</h1>
            <p className="text-sm text-base-content/60 mt-1 font-semibold">Your profile information</p>
          </div>

          {/* Avatar upload section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={selectedImg || authUser?.profilePic || "/avatar.png"}
                alt="Profile"
                className="size-32 rounded-full object-cover border-4 border-base-300 shadow-md"
              />
              <label
                htmlFor="avatar-upload"
                className={`
                  absolute bottom-0 right-0 
                  bg-primary text-primary-content hover:scale-105
                  p-2.5 rounded-full cursor-pointer 
                  transition-all duration-200 shadow-md
                  ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
                `}
              >
                <Camera className="w-5 h-5 text-base-content" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
            <p className="text-xs text-base-content/60 font-semibold">
              {isUpdatingProfile ? "Uploading..." : "Click the camera icon to update your photo"}
            </p>
          </div>

          <div className="space-y-6">
            {/* Full Name */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-base-content/60 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-xl border border-base-300 font-semibold text-base-content text-sm">
                {authUser?.fullName}
              </p>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-base-content/60 uppercase tracking-wider flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-xl border border-base-300 font-semibold text-base-content text-sm">
                {authUser?.email}
              </p>
            </div>

            {/* Username */}
            <div className="space-y-1.5 mt-4">
              <div className="text-xs font-semibold text-base-content/60 uppercase tracking-wider flex items-center gap-2">
                Username
              </div>
              <input
                type="text"
                value={username}
                maxLength={30}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 bg-base-200 rounded-xl border border-base-300 text-base-content"
              />
            </div>

            {/* Handle */}
            <div className="space-y-1.5 mt-4">
              <div className="text-xs font-semibold text-base-content/60 uppercase tracking-wider flex items-center gap-2">
                Handle
              </div>
              <input
                type="text"
                value={handle}
                maxLength={20}
                onChange={(e) => setHandle(e.target.value)}
                className="w-full px-4 py-2.5 bg-base-200 rounded-xl border border-base-300 text-base-content"
              />
            </div>

            {/* Bio */}
            <div className="space-y-1.5 mt-4">
              <div className="text-xs font-semibold text-base-content/60 uppercase tracking-wider flex items-center gap-2">
                Bio
              </div>
              <textarea
                rows={3}
                value={bio}
                maxLength={500}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-2.5 bg-base-200 rounded-xl border border-base-300 text-base-content"
              />
            </div>

            {/* Private Profile toggle */}
            <div className="space-y-1.5 mt-4">
              <div className="text-xs font-semibold text-base-content/60 uppercase tracking-wider flex items-center gap-2">
                Private Profile
              </div>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={authUser?.privateProfile?.isPrivate || false}
                  onChange={(e) => updateProfile({ privateProfile: { isPrivate: e.target.checked } })}
                  className="form-checkbox h-4 w-4 text-primary bg-base-200 border-base-300 rounded"
                />
                <span className="ml-2 text-sm text-base-content">Enable private profile</span>
              </label>
            </div>

            {/* Account Information */}
            <div className="mt-6 bg-base-200 rounded-2xl border border-base-300/50 p-6">
              <h2 className="text-xs font-bold text-base-content uppercase tracking-wider mb-4">
                Account Information
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-base-300 text-base-content font-medium">
                  <span>Member Since</span>
                  <span className="font-bold">{authUser?.createdAt?.split("T")[0]}</span>
                </div>
                <div className="flex items-center justify-between py-2 text-base-content font-medium">
                  <span>Account Status</span>
                  <span className="text-primary font-bold">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
