import { MessageSquare, Users, Bell, Phone, Plus } from 'lucide-react';
import { useChatStore } from "../store/useChatStore";

const MobileBottomNav = ({ activeTab, setActiveTab }) => {
  const { toggleCommandPalette } = useChatStore();

  const tabs = [
    { id: 'chats', icon: MessageSquare, label: 'Chats' },
    { id: 'calls', icon: Phone, label: 'Calls' },
    { id: '__new__', icon: Plus, label: 'New', fab: true },
    { id: 'users', icon: Users, label: 'Friends' },
    { id: 'notifications', icon: Bell, label: 'Alerts' },
  ];

  const onTab = (id: string) => {
    if (id === '__new__') {
      toggleCommandPalette();
      return;
    }
    setActiveTab(id);
  };

  return (
    <nav className="md:hidden fixed bottom-5 left-5 right-5 bg-base-100/60 backdrop-blur-2xl backdrop-saturate-150 border border-base-content/10 shadow-[0_12px_40px_-8px_rgb(0,0,0,0.25)] rounded-[28px] flex items-center justify-around px-2 py-2 z-50">
      {tabs.map(({ id, icon: Icon, label, fab }) => {
        if (fab) {
          return (
            <button
              key={id}
              onClick={() => onTab(id)}
              aria-label="Start new chat"
              className="size-12 rounded-full bg-primary text-primary-content flex items-center justify-center shadow-[0_8px_20px_-4px_var(--fallback-p,oklch(var(--p)/0.6))] active:scale-95 transition-transform"
            >
              <Icon size={24} strokeWidth={2.5} />
            </button>
          );
        }
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onTab(id)}
            className={`flex flex-col items-center gap-1 px-2 py-1.5 transition-all duration-200 ${
              isActive ? 'text-primary' : 'text-base-content/50'
            }`}
          >
            <span className={`px-5 py-1 rounded-full transition-all duration-200 ${isActive ? 'bg-primary/15' : ''}`}>
              <Icon size={22} fill={isActive ? 'currentColor' : 'none'} />
            </span>
            <span className="text-[11px] font-semibold">{label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
