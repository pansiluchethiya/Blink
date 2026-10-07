import { X, Image as ImageIcon, FileText, Link as LinkIcon, ExternalLink, Play } from 'lucide-react';
import { useState } from 'react';
import Avatar from './Avatar';
import { useChatStore } from '../store/useChatStore';

const UserProfilePanel = ({ user, onClose, isOpen }) => {
  const [activeTab, setActiveTab] = useState<'media' | 'docs'>('media');
  const { messages, setLightboxImage } = useChatStore();

  if (!user || !isOpen) return null;

  // Filter Shared Media (Images, Videos)
  const mediaMessages = messages.filter(msg => 
    !msg.isDeleted && (msg.image || (msg.file && (msg.file.type.startsWith("image/") || msg.file.type.startsWith("video/"))))
  );

  // Filter Shared Docs & Links
  const docMessages = messages.filter(msg => 
    !msg.isDeleted && msg.file && !msg.file.type.startsWith("image/") && !msg.file.type.startsWith("video/")
  );

  const linkRegex = /(https?:\/\/[^\s<]+[^.,:;"'!)\]\s])/;
  const linkMessages = messages.filter(msg => 
    !msg.isDeleted && msg.text && linkRegex.test(msg.text)
  ).map(msg => {
    const match = msg.text.match(linkRegex);
    return {
      _id: msg._id,
      url: match ? match[0] : "",
      createdAt: msg.createdAt
    };
  }).filter(item => item.url !== "");

  return (
    <div className={`fixed inset-y-0 right-0 z-[100] w-full md:w-[360px] bg-surface border-l border-border shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-border bg-base-200/50">
          <h2 className="font-bold text-base-content">Contact Info</h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl hover:bg-base-200 text-base-content/60 hover:text-base-content transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Profile Card */}
        <div className="p-6 flex flex-col items-center border-b border-border bg-base-200">
          <div className="size-20 rounded-full overflow-hidden border-4 border-base-300 mb-3 shadow-md">
            <Avatar user={user} className="w-full h-full" />
          </div>
          <h1 className="text-lg font-bold text-base-content text-center truncate w-full">{user.fullName}</h1>
          <p className="text-base-content/60 mb-4 text-xs font-semibold">{user.email}</p>
          
          <div className="w-full flex gap-2">
            <button 
              onClick={onClose}
              className="flex-1 py-2 bg-primary text-base-content rounded-xl font-bold text-xs transition-all shadow-md active:scale-95"
            >
              Message
            </button>
          </div>
        </div>

        {/* Media, Docs & Links Section */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs Header */}
          <div className="flex border-b border-border p-2 gap-2 bg-base-200/20">
            <button
              onClick={() => setActiveTab('media')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'media'
                  ? 'bg-base-200 text-base-content shadow-sm'
                  : 'text-base-content/60 hover:text-base-content/60'
              }`}
            >
              <ImageIcon size={14} />
              Media ({mediaMessages.length})
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'docs'
                  ? 'bg-base-200 text-base-content shadow-sm'
                  : 'text-base-content/60 hover:text-base-content/60'
              }`}
            >
              <FileText size={14} />
              Docs & Links ({docMessages.length + linkMessages.length})
            </button>
          </div>

          {/* Tab Content Panels */}
          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
            {activeTab === 'media' ? (
              mediaMessages.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {mediaMessages.map((msg) => {
                    const mediaUrl = msg.image || msg.file?.url;
                    const isVideo = msg.file?.type.startsWith("video/");
                    return (
                      <button
                        key={msg._id}
                        onClick={() => mediaUrl && setLightboxImage(mediaUrl)}
                        className="relative aspect-square rounded-lg overflow-hidden border border-base-300 bg-base-200 group hover:opacity-90 active:scale-95 transition-all shadow-sm"
                      >
                        {isVideo ? (
                          <div className="size-full flex items-center justify-center bg-base-300 text-base-content relative">
                            <Play size={16} className="fill-white" />
                            <span className="absolute bottom-1 right-1 text-[8px] font-bold bg-black/60 px-1 rounded">VIDEO</span>
                          </div>
                        ) : (
                          <img 
                            src={mediaUrl} 
                            alt="" 
                            className="size-full object-cover group-hover:scale-105 transition-transform" 
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-base-content/60">
                  <ImageIcon size={28} className="stroke-1.5 mb-2 opacity-50" />
                  <span className="text-xs font-semibold">No shared media</span>
                </div>
              )
            ) : (
              (docMessages.length > 0 || linkMessages.length > 0) ? (
                <div className="space-y-4">
                  {/* Documents Section */}
                  {docMessages.length > 0 && (
                    <div>
                      <h3 className="text-[10px] font-bold text-base-content/60 uppercase tracking-widest mb-2 px-1">Documents</h3>
                      <div className="space-y-1.5">
                        {docMessages.map((msg) => (
                          <a
                            key={msg._id}
                            href={msg.file!.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-2.5 bg-base-200/50 hover:bg-base-200 border border-base-300/40 rounded-xl transition-all group"
                          >
                            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-all flex-shrink-0">
                              <FileText size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-base-content/60 truncate pr-2">
                                {msg.file!.name}
                              </p>
                              <p className="text-[9px] text-base-content/60 font-medium">
                                {(msg.file!.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <ExternalLink size={12} className="text-base-content/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Links Section */}
                  {linkMessages.length > 0 && (
                    <div>
                      <h3 className="text-[10px] font-bold text-base-content/60 uppercase tracking-widest mb-2 px-1">Shared Links</h3>
                      <div className="space-y-1.5">
                        {linkMessages.map((item) => (
                          <a
                            key={item._id}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-2.5 bg-base-200/50 hover:bg-base-200 border border-base-300/40 rounded-xl transition-all group"
                          >
                            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 group-hover:bg-amber-500/20 transition-all flex-shrink-0">
                              <LinkIcon size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-primary truncate pr-2 hover:underline">
                                {item.url}
                              </p>
                              <p className="text-[9px] text-base-content/60 font-medium">
                                {new Date(item.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <ExternalLink size={12} className="text-base-content/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-base-content/60">
                  <FileText size={28} className="stroke-1.5 mb-2 opacity-50" />
                  <span className="text-xs font-semibold">No shared docs or links</span>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePanel;
