import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { formatMessageTime, getUserHandle } from "../lib/utils";
import { Link } from "react-router-dom";

import { Paperclip, Check, CheckCheck, MoreVertical, Pin, ChevronDown } from "lucide-react";
import MessageReactions from "./MessageReactions";
import QuotedMessage from "./QuotedMessage";
import ViewOnceMedia from "./ViewOnceMedia";
import LinkPreview from "./LinkPreview";
import Avatar from "./Avatar";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MessageItem = ({
  message,
  index,
  messagesLength,
  messages,
  selectedUser,
  activeMessageMenu,
  openMessageMenu = () => {},
  closeMessageMenu = () => {},
  handleLongPressStart = () => {},
  handleLongPressEnd = () => {},
  addReaction,
  removeReaction,
  markViewOnceOpened
}) => {
  const { authUser } = useAuthStore();
  const { setLightboxImage } = useChatStore();
  const isSelf = message.senderId === authUser._id;

  const handleDoubleClick = message.isDeleted ? undefined : () => {
    const hasHeart = message.reactions?.["❤️"]?.includes(authUser._id);
    if (hasHeart) {
      removeReaction(message._id, "❤️");
    } else {
      addReaction(message._id, "❤️");
    }
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    if (activeMessageMenu === message._id) {
      closeMessageMenu();
    } else {
      openMessageMenu(message._id, rect);
    }
  };

  const isNextSameSender = Array.isArray(messages) && index < messagesLength - 1 &&
    messages[index + 1] &&
    messages[index + 1].senderId === message.senderId &&
    !messages[index + 1].isDeleted;

  const isPrevSameSender = Array.isArray(messages) && index > 0 &&
    messages[index - 1] &&
    messages[index - 1].senderId === message.senderId &&
    !messages[index - 1].isDeleted;

  const showAvatar = !isSelf && !isNextSameSender;
  const showNameHeader = !isSelf && (!isPrevSameSender || message.isDeleted);
  const bubbleRoundness = isSelf
    ? "rounded-2xl rounded-tr-sm"
    : "rounded-2xl rounded-tl-sm";

  const commonBubbleClasses = `relative flex flex-col select-text px-4 py-2.5 shadow-sm transition-all no-callout group/bubble ${bubbleRoundness} message-bubble ${
    message.isDeleted
      ? "bg-base-200/50 text-base-content/40 italic font-normal border border-base-300"
      : isSelf
        ? "message-bubble-self chat-bubble chat-bubble-primary bg-primary text-primary-content border border-primary"
        : "message-bubble-other bg-base-200 text-base-content border border-base-300"
  } hover:cursor-pointer`;

  const marginBottom = isNextSameSender ? "mb-1" : "mb-4";

  return (
    <div
      data-context="message"
      data-message-id={message._id}
      className={`flex flex-col ${isSelf ? "items-end" : "items-start"} w-full message-item group/msg ${marginBottom}`}
      style={{
        animation: `messageEntry 0.25s cubic-bezier(0.16, 1, 0.3, 1) ${Math.min(index * 0.015, 0.3)}s both`,
      }}
    >
      {!isSelf && (
        <div className={`flex gap-2 items-end w-full ${showAvatar ? "" : "ml-[44px]"} msg-bubble-container`}>
          {showAvatar && (
            <div className="flex-shrink-0 select-none mb-0">
              <Avatar
                user={selectedUser}
                className="size-9 border border-base-300"
              />
            </div>
          )}
          <div className="flex flex-col items-start min-w-0 flex-1">
             <MessageContent
               isSelf={isSelf}
               message={message}
               selectedUser={selectedUser}
               showNameHeader={showNameHeader}
               handleDoubleClick={handleDoubleClick}
               handleLongPressStart={handleLongPressStart}
               handleLongPressEnd={handleLongPressEnd}
               handleMenuClick={handleMenuClick}
               markViewOnceOpened={markViewOnceOpened}
               commonBubbleClasses={commonBubbleClasses}
               openMessageMenu={openMessageMenu}
               setLightboxImage={setLightboxImage}
             />
          </div>
        </div>
      )}

      {isSelf && (
        <div className="msg-bubble-container">
          <MessageContent
            isSelf={isSelf}
            message={message}
            selectedUser={selectedUser}
            showNameHeader={false}
            handleDoubleClick={handleDoubleClick}
            handleLongPressStart={handleLongPressStart}
            handleLongPressEnd={handleLongPressEnd}
            handleMenuClick={handleMenuClick}
            markViewOnceOpened={markViewOnceOpened}
            commonBubbleClasses={commonBubbleClasses}
            openMessageMenu={openMessageMenu}
            setLightboxImage={setLightboxImage}
          />
        </div>
      )}
    </div>
  );
};

const MessageContent = ({
  isSelf,
  message,
  selectedUser,
  showNameHeader,
  handleDoubleClick,
  handleLongPressStart,
  handleLongPressEnd,
  handleMenuClick,
  markViewOnceOpened,
  commonBubbleClasses,
  openMessageMenu,
  setLightboxImage,
}) => {
  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    openMessageMenu(message._id, { top: e.clientY, left: e.clientX });
  };

  const fileKind = message.file?.kind;
  const isSticker = fileKind === "sticker";
  const stickerSrc = message.image || (isSticker ? message.file?.url : undefined);
  const stickerAlt = message.file?.alt || "Sticker";
  const bubbleClasses = isSticker && stickerSrc && !message.isDeleted
    ? `relative flex flex-col select-text px-1 py-1 bg-transparent border-none shadow-none ${isSelf ? "rounded-2xl rounded-tr-sm" : "rounded-2xl rounded-tl-sm"} message-bubble group/bubble`
    : commonBubbleClasses;

  return (
    <>
      {/* Header: Sender name */}
      {showNameHeader && !message.isDeleted && (
        <div className="flex items-center gap-2 mb-1 px-1 text-[12px] text-primary font-bold select-none">
          <span>{selectedUser?.fullName}</span>
          <Link
            to={`/u/${getUserHandle(selectedUser).replace("@", "")}`}
            className="text-[11px] text-base-content/40 font-normal hover:underline cursor-pointer transition-opacity hover:opacity-85"
            onClick={(e) => e.stopPropagation()}
          >
            {getUserHandle(selectedUser)}
          </Link>
        </div>
      )}

      {/* Quoted Message */}
      {message.replyTo && !message.isDeleted && (
        <div className="mb-1">
          <QuotedMessage replyTo={message.replyTo} />
        </div>
      )}

      {/* Bubble Row */}
      <div className={`flex gap-2 items-end ${isSelf ? "justify-end" : ""}`}>
        <div
          className={`${bubbleClasses}`}
          onDoubleClick={handleDoubleClick}
          onTouchStart={message.isDeleted ? undefined : (e) => { e.stopPropagation(); handleLongPressStart?.(message._id); }}
          onTouchEnd={message.isDeleted ? undefined : handleLongPressEnd}
          onTouchMove={message.isDeleted ? undefined : handleLongPressEnd}
          title={message.isDeleted ? undefined : "Double-tap to ❤️"}
        >
          {/* Menu Trigger Overlay */}
          {!message.isDeleted && (
            <div className={`absolute top-2 ${isSelf ? "right-2" : "right-2"} opacity-0 group-hover/bubble:opacity-100 transition-all duration-200 z-10`}>
              <button
                onClick={handleMenuClick}
                className={`p-1 rounded-full backdrop-blur-md transition-all ${
                  isSelf
                    ? "bg-black/10 hover:bg-black/20 text-primary-content"
                    : "bg-base-200 hover:bg-base-300 text-base-content/50"
                }`}
              >
                <ChevronDown size={14} />
              </button>
            </div>
          )}

          {message.viewOnce && !message.viewedOnce ? (
            <ViewOnceMedia
              message={message}
              onOpened={() => markViewOnceOpened(message._id)}
            />
          ) : isSticker && stickerSrc ? (
            <>
              <img
                src={stickerSrc}
                alt={stickerAlt}
                loading="lazy"
                decoding="async"
                className="w-40 h-40 object-contain bg-transparent drop-shadow-lg cursor-zoom-in"
                onClick={(e) => { e.stopPropagation(); setLightboxImage(stickerSrc); }}
              />
              {message.text && (
                <div className="flex flex-col">
                  <div className="text-[15px] leading-[1.5] break-words font-medium pr-4 prose max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.text}
                    </ReactMarkdown>
                    {message.isEdited && !message.isDeleted && (
                      <span className="text-[10px] opacity-70 ml-1.5 font-normal">edited</span>
                    )}
                  </div>
                  {!message.isDeleted && (() => {
                    const urlRegex = /(https?:\/\/[^\s<]+[^.,:;"'!)\]\s])/;
                    const match = message.text.match(urlRegex);
                    if (match) {
                      return <LinkPreview url={match[0]} isSelf={isSelf} />;
                    }
                    return null;
                  })()}
                </div>
              )}
            </>
          ) : (
            <>
              {message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  loading="lazy"
                  decoding="async"
                  className="max-w-full sm:max-w-[300px] rounded-xl mb-1 object-cover shadow-sm cursor-zoom-in"
                  onClick={(e) => { e.stopPropagation(); setLightboxImage(message.image); }}
                />
              )}
              {message.file && message.file.url && fileKind !== "gif" && fileKind !== "sticker" && (
                <div className="mb-1">
                  {message.file.type?.startsWith("image/") ? (
                    <img
                      src={message.file.url}
                      alt={message.file.name}
                      loading="lazy"
                      decoding="async"
                      className="max-w-full sm:max-w-[300px] rounded-xl object-cover shadow-sm cursor-zoom-in"
                      onClick={(e) => { e.stopPropagation(); setLightboxImage(message.file.url); }}
                    />
                  ) : message.file.type?.startsWith("video/") ? (
                    <video controls className="max-w-full sm:max-w-[300px] rounded-xl shadow-sm">
                      <source src={message.file.url} type={message.file.type} />
                    </video>
                  ) : message.file.type?.startsWith("audio/") ? (
                    <div className={`p-2 rounded-xl min-w-[200px] ${isSelf ? "bg-black/10" : "bg-base-300/50"}`}>
                      <audio controls className="w-full h-8">
                        <source src={message.file.url} type={message.file.type} />
                      </audio>
                    </div>
                  ) : (
                    <a
                      href={message.file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        isSelf
                          ? "bg-black/10 hover:bg-black/20 text-primary-content"
                          : "bg-base-300/50 hover:bg-base-300 text-base-content"
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${isSelf ? "bg-black/10" : "bg-primary/10 text-primary"}`}>
                        <Paperclip size={16} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold truncate max-w-[150px]">{message.file.name}</span>
                        <span className="text-[10px] opacity-70">
                          {((message.file.size ?? 0) / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    </a>
                  )}
                </div>
              )}
              {message.text && (
                <div className="flex flex-col">
                  <div className="text-[15px] leading-[1.5] break-words font-medium pr-4 prose max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.text}
                    </ReactMarkdown>
                    {message.isEdited && !message.isDeleted && (
                      <span className="text-[10px] opacity-70 ml-1.5 font-normal">edited</span>
                    )}
                  </div>
                  {!message.isDeleted && (() => {
                    const urlRegex = /(https?:\/\/[^\s<]+[^.,:;"'!)\]\s])/;
                    const match = message.text.match(urlRegex);
                    if (match) {
                      return <LinkPreview url={match[0]} isSelf={isSelf} />;
                    }
                    return null;
                  })()}
                </div>
              )}
            </>
          )}

          <div className={`flex items-center gap-1.5 mt-1.5 -mb-0.5 ${isSelf ? "justify-end" : "justify-start"}`}>
            <span className={`text-[11px] font-medium ${isSelf ? "text-primary-content/70" : "text-base-content/40"}`}>
              {formatMessageTime(message.createdAt)}
            </span>
            {message.isPinned && !message.isDeleted && (
              <Pin size={10} className="text-primary fill-primary" />
            )}
            {isSelf && !message.isDeleted && (
              message.isSending ? (
                <span className="text-[9px] text-primary-content/60 italic animate-pulse tracking-wide select-none">sending</span>
              ) : message.isRead ? (
                <CheckCheck size={14} className="text-primary-content" />
              ) : message.deliveredAt ? (
                <Check size={14} className="text-primary-content/60" />
              ) : null
            )}
          </div>
        </div>
      </div>

      {!message.isDeleted && (
        <div className={`mt-1 ${isSelf ? "pr-1" : "pl-1"}`}>
          <MessageReactions message={message} />
        </div>
      )}
    </>
  );
};

export default MessageItem;
