const StatusView = ({ onAddStatusClick }) => {
  const mockStories = [
    { name: "Bayu Aji", time: "Just now", text: "Working on new designs...", color: "from-purple-500" },
    { name: "Dajeng Septi", time: "45 mins ago", text: "Sunny day! ☀️", color: "from-amber-400 to-orange-500" },
    { name: "Larry Abraham", time: "2h ago", text: "Coding all night.", color: "to-teal-400" },
  ];

  return (
    <div className="h-full w-full bg-base-100 flex flex-col transition-all duration-200 border-r border-base-300 select-none animate-fadeIn">
      {/* Top Header */}
      <div className="px-5 pt-6 pb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-base-content tracking-tight">Status</h1>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto px-5 space-y-3 pb-6">
        {/* Self Status Card */}
        <div 
          onClick={onAddStatusClick}
          className="flex items-center justify-between p-3.5 bg-base-200/60 border border-base-300 rounded-2xl cursor-pointer hover:bg-base-200 transition-colors shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="relative size-11 rounded-full bg-primary flex items-center justify-center text-base-content font-bold text-xs select-none">
              You
            </div>
            <div>
              <p className="text-sm font-bold text-base-content">My Status</p>
              <p className="text-xs text-base-content/60 font-bold mt-0.5">Tap to add status update</p>
            </div>
          </div>
          <button className="size-8 bg-primary text-base-content flex items-center justify-center rounded-full shadow-md font-extrabold text-sm">
            +
          </button>
        </div>

        <p className="text-[11px] font-bold text-base-content/60 uppercase tracking-widest pt-2.5 mb-2">Recent Updates</p>
        
        {mockStories.map((story, idx) => (
          <div key={idx} className="flex items-center gap-3.5 p-3.5 bg-base-200/60 border border-base-300 rounded-2xl hover:scale-[1.01] transition-transform">
            <div className={`size-11 rounded-full bg-base-200 ${story.color} flex items-center justify-center p-0.5 shadow-sm`}>
              <div className="w-full h-full bg-base-100 rounded-full flex items-center justify-center overflow-hidden">
                <span className="font-extrabold text-xs text-base-content/60">{story.name.charAt(0)}</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-base-content">{story.name}</p>
              <p className="text-xs text-base-content/60 mt-0.5 font-semibold italic">&quot;{story.text}&quot;</p>
              <p className="text-[9px] text-base-content/60 font-extrabold mt-1.5 uppercase tracking-wider">{story.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatusView;
