import { MessageSquare, Users, Bell, Settings } from 'lucide-react';

const MobileBottomNav = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'chats', icon: MessageSquare, label: 'Chats' },
    { id: 'users', icon: Users, label: 'Friends' },
    { id: 'notifications', icon: Bell, label: 'Alerts' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface/90 backdrop-blur-lg border-t border-border flex items-center justify-around px-2 z-50">
      {tabs.map(({ id, icon: Icon, label }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center gap-1 transition-all duration-200 ${
              isActive ? 'text-primary scale-110' : 'text-base-content/60 hover:text-base-content/60'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-primary/10' : ''}`}>
              <Icon size={22} fill={isActive ? 'currentColor' : 'none'} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
