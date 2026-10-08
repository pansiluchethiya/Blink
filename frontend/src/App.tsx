import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import TitleBar from "./components/TitleBar";
import AppLayout from "./AppLayout";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import SharePage from "./pages/SharePage";
import ProtocolPage from "./pages/ProtocolPage";
import NotesPage from "./pages/NotesPage";

import { useAuthStore } from "./store/useAuthStore";
import { useErrorStore } from "./store/useErrorStore";
import { useChatStore } from "./store/useChatStore";
import { useFriendStore } from "./store/useFriendStore";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";
import ErrorModal from "./components/ErrorModal";
import CommandPalette from "./components/CommandPalette";
import ImageLightbox from "./components/ImageLightbox";
import OfflineBar from "./components/OfflineBar";
import UpdatePrompt from "./components/UpdatePrompt";
import InstallPrompt from "./components/InstallPrompt";
import { ContextMenuProvider } from "./components/ContextMenu";
import ThemeProvider from "./lib/ThemeProvider";

interface RequireAuthProps {
  children: React.ReactNode;
}

const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const { authUser, isCheckingAuth } = useAuthStore();
  const location = useLocation();

  if (isCheckingAuth) {
    return null;
  }

  const isPublicRoute = location.pathname === "/login" || location.pathname === "/signup";

  if (!authUser && !isPublicRoute) {
    return <Navigate to="/login" replace />;
  }

  if (authUser && isPublicRoute) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const { authUser, checkAuth, isCheckingAuth, socket } = useAuthStore();
  const { currentError, clearError, retryCurrentError } = useErrorStore();
  const { toggleCommandPalette, setCommandPaletteOpen, setEditingMessage, setReplyingToMessage } = useChatStore();
  const { fetchFriends, fetchRequests, subscribeToFriendEvents, unsubscribeFromFriendEvents } = useFriendStore();
  const { subscribeToMessages, unsubscribeFromMessages, initWorkspaces } = useChatStore();
  const location = useLocation();
  const navigate = useNavigate();

  // PWA file_handlers: files opened with Blink arrive via launchQueue.
  useEffect(() => {
    const lq = (navigator as any)?.launchQueue;
    if (!lq?.setConsumer) return;
    lq.setConsumer(async (params: any) => {
      const files: File[] = [];
      for (const handle of params?.files ?? []) {
        try {
          const f = await handle.getFile();
          if (f) files.push(f);
        } catch {
          /* unreadable file — skip */
        }
      }
      if (files.length === 0) return;
      useChatStore.getState().setIncomingShare({ text: "", files });
      navigate("/share");
    });
  }, [navigate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const isCommandK = (isMac ? (e as any).metaKey : (e as any).ctrlKey) && e.key === "k";
      if (isCommandK) {
        e.preventDefault();
        toggleCommandPalette();
      }
      if ((e as any).key === "Escape") {
        setCommandPaletteOpen(false);
        setEditingMessage(null);
        setReplyingToMessage(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown as any);
    return () => window.removeEventListener("keydown", handleKeyDown as any);
  }, [toggleCommandPalette, setCommandPaletteOpen, setEditingMessage, setReplyingToMessage]);

  // Initial auth check (runs once on mount)
  useEffect(() => {
    checkAuth();
  }, []);

  // Global 401 handler from axios interceptor: clear session without reload loop
  useEffect(() => {
    const onUnauthorized = () => {
      localStorage.removeItem("token");
      useAuthStore.setState({ authUser: null });
    };
    window.addEventListener("blink:unauthorized", onUnauthorized);
    return () => window.removeEventListener("blink:unauthorized", onUnauthorized);
  }, []);

  // Load user data once authenticated
  useEffect(() => {
    if (authUser && socket) {
      fetchFriends();
      fetchRequests();
      subscribeToFriendEvents();
      subscribeToMessages();
      initWorkspaces();
      return () => {
        unsubscribeFromFriendEvents();
        unsubscribeFromMessages();
      };
    }
  }, [authUser, socket, fetchFriends, fetchRequests, subscribeToFriendEvents, unsubscribeFromFriendEvents, subscribeToMessages, unsubscribeFromMessages, initWorkspaces]);

  // Theme handling lives in ThemeProvider (lib/ThemeProvider.tsx).

  // Loading spinner while auth is being verified
  if (isCheckingAuth && !authUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-base-100 text-base-content">
        <Loader className="size-10 animate-spin text-primary" />
      </div>
    );
  }
  const isHomePage = location.pathname === "/";

  return (
    <ThemeProvider>
      <ContextMenuProvider>
        <div className="min-h-screen bg-base-100 text-base-content transition-colors duration-200">
          <TitleBar />
          {!(authUser && isHomePage) && <Navbar />}
          <RequireAuth>
            <Routes>
              <Route path="/" element={<AppLayout />}>
                <Route index element={<SignUpPage />} />
                <Route path="signup" element={<SignUpPage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="share" element={<SharePage />} />
                <Route path="protocol" element={<ProtocolPage />} />
                <Route path="notes" element={<NotesPage />} />
              </Route>
            </Routes>
          </RequireAuth>
          <Toaster />
          <ErrorModal error={currentError?.error} onClose={clearError} onRetry={currentError?.onRetry ? retryCurrentError : null} />
          <CommandPalette />
          <ImageLightbox />
          <OfflineBar />
          <UpdatePrompt />
          <InstallPrompt />
        </div>
      </ContextMenuProvider>
    </ThemeProvider>
  );
};

export default App;
