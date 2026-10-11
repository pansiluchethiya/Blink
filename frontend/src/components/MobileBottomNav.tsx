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
    <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-base-100/95 backdrop-blur-lg border border-base-200 shadow-2xl rounded-full flex items-center justify-around px-2 py-2 z-50">
      {tabs.map(({ id, icon: Icon, label, fab }) => {
        if (fab) {
          return (
            <button
              key={id}
              onClick={() => onTab(id)}
              aria-label="Start new chat"
              className="size-12 rounded-full bg-primary text-primary-content flex items-center justify-center shadow-lg active:scale-95 transition-transform"
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
            className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-all duration-200 ${
              isActive ? 'text-primary' : 'text-base-content/50'
            }`}
          >
            <Icon size={22} fill={isActive ? 'currentColor' : 'none'} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
            {isActive && <span className="size-1 rounded-full bg-primary" />}
          </button>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
