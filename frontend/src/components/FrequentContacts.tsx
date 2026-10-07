import { Avatar } from './ui/BlinkComponents';
import SharedAvatar from './Avatar';

const FrequentContacts = ({ users, onSelectUser }) => {
  if (!users || users.length === 0) return null;

  return (
    <div className="px-5 py-4 border-b border-base-300">
      <h3 className="text-[12px] font-bold text-base-content/60 uppercase tracking-wider mb-4">Favorites</h3>
      <div className="flex gap-5 overflow-x-auto pb-1 scrollbar-none">
        {users.map((user) => (
          <button
            key={user._id}
            data-context="conversation"
            data-user-id={user._id}
            onClick={() => onSelectUser(user)}
            className="flex flex-col items-center gap-2 group flex-shrink-0"
          >
            <div className="size-[60px] rounded-full bg-base-200 p-[2.5px] shadow-lg shadow-primary/10 transition-transform group-hover:scale-105 group-active:scale-95">
              <div className="size-full rounded-full bg-base-100 p-[2px]">
                <SharedAvatar user={user} className="size-full" />
              </div>
            </div>
            <span className="text-[11px] font-bold text-base-content/60 truncate w-14 text-center">
              {user.fullName ? user.fullName.split(' ')[0] : 'User'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FrequentContacts;
