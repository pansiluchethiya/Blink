import { useThemeStore, BLINK_LIGHT, BLINK_DARK } from "../store/useThemeStore";
import { useAuthStore } from "../store/useAuthStore";
import { useNotificationStore } from "../store/useNotificationStore";
import { Send, MessageSquare, Users, AtSign, Shield, Sun, Moon, Laptop } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

const ChatSendToggle = () => {
  const sendOnEnter = useChatStore(state => state.chatSettings?.sendOnEnter ?? true);
  const setChatSetting = useChatStore(state => state.setChatSetting);
  return (
    <button
      type="button"
      onClick={() => setChatSetting('sendOnEnter', !sendOnEnter)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 ease-in-out focus:outline-none ${sendOnEnter ? "bg-primary" : "bg-base-300"}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-base-100 shadow ring-0 transition duration-200 ease-in-out ${sendOnEnter ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
};

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How's it going?", isSent: false },
  { id: 2, content: "I'm doing great! Just working on some new features.", isSent: true },
];

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();
  const { authUser } = useAuthStore();
  const { updatePreferences } = useNotificationStore();

  const handlePreferenceChange = (key, value) => {
    const currentPrefs = authUser?.notificationPreferences || {
      directMessage: true,
      groupMessage: true,
      mention: true,
      friendRequest: true,
      system: true,
    };
    updatePreferences({ ...currentPrefs, [key]: value });
  };

  return (
    <div data-context="settings" className="h-screen bg-base-200 pt-20 transition-colors duration-200 overflow-y-auto pb-20">
      <div className="container mx-auto px-4 max-w-4xl space-y-8">
        
        {/* Header Title */}
        <div>
          <h1 className="text-3xl font-bold text-base-content">Settings</h1>
          <p className="text-sm text-base-content/60 mt-1 font-semibold">Customize your Blink chat experience</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left/Middle Column: Preferences & Themes */}
          <div className="md:col-span-2 space-y-8">
            
            {/* Theme Section */}
            <section className="bg-base-100 border border-base-300 rounded-3xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-bold text-base-content flex items-center gap-2">
                  Appearance
                </h2>
                <p className="text-xs text-base-content/60 font-semibold mt-1">Choose your preferred style for the interface</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Light Theme Option Card */}
                <button
                  type="button"
                  onClick={() => setTheme(BLINK_LIGHT)}
                  className={`flex flex-col items-center justify-between p-4 rounded-2xl border text-left transition-all duration-200 ${
                    theme === BLINK_LIGHT
                      ? "border-primary bg-primary/5"
                      : "border-base-300 bg-base-200/50 hover:bg-base-200"
                  }`}
                >
                  <div className="flex items-center gap-3 w-full mb-3">
                    <div className="size-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                      <Sun className="size-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-base-content">Light</p>
                      <p className="text-[10px] text-base-content/60 font-semibold truncate max-w-[80px]">Soft colors</p>
                    </div>
                  </div>
                  {/* Miniature mockup light chat list */}
                  <div className="w-full bg-base-100 border border-base-300 rounded-xl p-2.5 space-y-1.5 pointer-events-none">
                    <div className="h-2 w-12 bg-base-200 rounded" />
                    <div className="h-2.5 w-full bg-base-200 rounded" />
                    <div className="h-2 w-2/3 bg-base-200 rounded" />
                  </div>
                </button>

                {/* Dark Theme Option Card */}
                <button
                  type="button"
                  onClick={() => setTheme(BLINK_DARK)}
                  className={`flex flex-col items-center justify-between p-4 rounded-2xl border text-left transition-all duration-200 ${
                    theme === BLINK_DARK
                      ? "border-primary bg-primary/5"
                      : "border-base-300 bg-base-200/50 hover:bg-base-200"
                  }`}
                >
                  <div className="flex items-center gap-3 w-full mb-3">
                    <div className="size-10 rounded-xl bg-base-300 text-primary flex items-center justify-center">
                      <Moon className="size-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-base-content">Dark</p>
                      <p className="text-[10px] text-base-content/60 font-semibold truncate max-w-[80px]">Pure black</p>
                    </div>
                  </div>
                  {/* Miniature mockup dark chat list */}
                  <div className="w-full bg-base-200 border border-base-300 rounded-xl p-2.5 space-y-1.5 pointer-events-none">
                    <div className="h-2 w-12 bg-base-300 rounded" />
                    <div className="h-2.5 w-full bg-base-300 rounded" />
                    <div className="h-2 w-2/3 bg-base-300 rounded" />
                  </div>
                </button>

                {/* System Theme Option Card */}
                <button
                  type="button"
                  onClick={() => setTheme("system")}
                  className={`flex flex-col items-center justify-between p-4 rounded-2xl border text-left transition-all duration-200 ${
                    theme === "system"
                      ? "border-primary bg-primary/5"
                      : "border-base-300 bg-base-200/50 hover:bg-base-200"
                  }`}
                >
                  <div className="flex items-center gap-3 w-full mb-3">
                    <div className="size-10 rounded-xl bg-base-200 text-base-content/60 flex items-center justify-center">
                      <Laptop className="size-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-base-content">System</p>
                      <p className="text-[10px] text-base-content/60 font-semibold truncate max-w-[80px]">Sync with OS</p>
                    </div>
                  </div>
                  {/* Miniature mockup system chat list */}
                  <div className="w-full bg-base-200 border border-base-300 rounded-xl p-2.5 space-y-1.5 pointer-events-none relative overflow-hidden">
                    <div className="absolute inset-0 bg-base-200 from-white/40 to-black/40" />
                    <div className="h-2 w-12 bg-base-200 rounded relative z-10" />
                    <div className="h-2.5 w-full bg-base-200 rounded relative z-10" />
                    <div className="h-2 w-2/3 bg-base-200 rounded relative z-10" />
                  </div>
                </button>
              </div>
            </section>

            {/* Notification Preferences Section */}
            {authUser && (
              <section className="bg-base-100 border border-base-300 rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-base-content flex items-center gap-2">
                    Notifications
                  </h2>
                  <p className="text-xs text-base-content/60 font-semibold mt-1">Configure how you want to be notified</p>
                </div>

                <div className="space-y-4">
                  {/* DM Switch */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <MessageSquare className="size-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-base-content">Direct Messages</p>
                        <p className="text-xs text-base-content/60 font-semibold">Notifications for new private messages</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePreferenceChange("directMessage", !(authUser.notificationPreferences?.directMessage ?? true))}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 ease-in-out focus:outline-none ${
                        (authUser.notificationPreferences?.directMessage ?? true) ? "bg-primary" : "bg-base-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-base-100 shadow ring-0 transition duration-200 ease-in-out ${
                          (authUser.notificationPreferences?.directMessage ?? true) ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Group switch */}
                  <div className="flex items-center justify-between border-t border-base-300 pt-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Users className="size-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-base-content">Group Messages</p>
                        <p className="text-xs text-base-content/60 font-semibold">Notifications for new messages in groups</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePreferenceChange("groupMessage", !(authUser.notificationPreferences?.groupMessage ?? true))}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 ease-in-out focus:outline-none ${
                        (authUser.notificationPreferences?.groupMessage ?? true) ? "bg-primary" : "bg-base-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-base-100 shadow ring-0 transition duration-200 ease-in-out ${
                          (authUser.notificationPreferences?.groupMessage ?? true) ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Mentions switch */}
                  <div className="flex items-center justify-between border-t border-base-300 pt-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <AtSign className="size-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-base-content">Mentions & Replies</p>
                        <p className="text-xs text-base-content/60 font-semibold">When someone mentions you or replies to you</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePreferenceChange("mention", !(authUser.notificationPreferences?.mention ?? true))}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 ease-in-out focus:outline-none ${
                        (authUser.notificationPreferences?.mention ?? true) ? "bg-primary" : "bg-base-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-base-100 shadow ring-0 transition duration-200 ease-in-out ${
                          (authUser.notificationPreferences?.mention ?? true) ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* System alerts switch */}
                  <div className="flex items-center justify-between border-t border-base-300 pt-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                        <Shield className="size-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-base-content">System & Security</p>
                        <p className="text-xs text-base-content/60 font-semibold">Important account and security alerts</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePreferenceChange("system", !(authUser.notificationPreferences?.system ?? true))}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 ease-in-out focus:outline-none ${
                        (authUser.notificationPreferences?.system ?? true) ? "bg-primary" : "bg-base-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-base-100 shadow ring-0 transition duration-200 ease-in-out ${
                          (authUser.notificationPreferences?.system ?? true) ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Chat preferences: Send on Enter */}
                  <div className="flex items-center justify-between border-t border-base-300 pt-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-base-200 text-base-content/60 flex items-center justify-center">
                        <Send className="size-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-base-content">Send on Enter</p>
                        <p className="text-xs text-base-content/60 font-semibold">Press Enter to send messages (Shift+Enter for newline)</p>
                      </div>
                    </div>
                    <ChatSendToggle />
                  </div>

                  <div className="border-t border-base-300 pt-4 mt-6">
                    <button
                      className="w-full py-2.5 bg-base-200 hover:bg-base-200 border border-base-300 text-base-content rounded-xl font-bold text-xs transition-all active:scale-[0.98]"
                      onClick={() => useNotificationStore.getState().subscribeToPushNotifications()}
                    >
                      Enable Push Notifications
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Right Column: Preview Pane */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-base-content/60 uppercase tracking-wider pl-1">Live Preview</h3>
            
            <div className="rounded-3xl border border-base-300 overflow-hidden bg-base-200 shadow-xl max-w-sm w-full mx-auto">
              <div className="p-3 bg-base-200 border-b border-base-300/50">
                <div className="bg-base-100 border border-base-300/80 rounded-2xl shadow-sm overflow-hidden">
                  
                  {/* Preview Chat Header */}
                  <div className="px-4 py-3 border-b border-base-300 bg-base-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-base-content font-bold text-sm shadow-sm">
                        J
                      </div>
                      <div>
                        <h3 className="font-bold text-xs text-base-content leading-tight">John Doe</h3>
                        <p className="text-[10px] text-primary font-bold mt-0.5">Online</p>
                      </div>
                    </div>
                  </div>

                  {/* Preview Chat Messages */}
                  <div className="p-4 space-y-3 min-h-[160px] max-h-[160px] overflow-y-auto bg-base-200">
                    {PREVIEW_MESSAGES.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isSent ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`
                            max-w-[80%] rounded-2xl px-3.5 py-2 shadow-sm text-xs font-medium
                            ${message.isSent 
                              ? "bg-base-200 text-base-content rounded-tr-none" 
                              : "bg-base-100 text-base-content border border-base-300/40 rounded-tl-none"
                            }
                          `}
                        >
                          <p className="leading-relaxed">{message.content}</p>
                          <p
                            className={`
                              text-[8px] mt-1 text-right font-bold uppercase tracking-wider
                              ${message.isSent ? "text-base-content/60" : "text-base-content/60"}
                            `}
                          >
                            12:00 PM
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Preview Chat Input */}
                  <div className="p-3 border-t border-base-300 bg-base-100">
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        className="flex-1 text-xs px-3 py-2 bg-base-200 border border-base-300 rounded-xl text-base-content placeholder:text-base-content/40 focus:outline-none"
                        placeholder="Type a message..."
                        value="This is a preview"
                        readOnly
                      />
                      <button className="size-8 rounded-xl bg-primary text-base-content flex items-center justify-center shadow-sm" disabled>
                        <Send size={14} />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
export default SettingsPage;

