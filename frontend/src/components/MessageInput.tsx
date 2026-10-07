import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { Send, X, Paperclip, Loader, Mic, Smile, Sticker } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";
import { IconButton } from "./ui";
import EmojiPicker from "./EmojiPicker";
import GifPicker, { type GifPickerPick } from "./GifPicker";
import ReplyPreview from "./ReplyPreview";
import EditingIndicator from "./EditingIndicator";
import { EMOJIS, HELP_CENTER_EMAIL } from "../constants";

const MessageInput = () => {
  const [text, setText] = useState("");
  const sendOnEnter = useChatStore(state => state.chatSettings?.sendOnEnter ?? true);
  const [imagePreview, setImagePreview] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isViewOnce, setIsViewOnce] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [attachmentMeta, setAttachmentMeta] = useState<null | { kind: string; pack?: string; alt?: string; preview?: string }>(null);
  const [emojiSuggestions, setEmojiSuggestions] = useState([]);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const inputRef = useRef(null);

  const { sendMessage, selectedUser, editingMessageId, editMessage, replyingToMessage, drafts, setDraft, pendingAttachment, setPendingAttachment } = useChatStore();
  const { socket, authUser } = useAuthStore();
  const { friends, requests, sentRequests } = useFriendStore();

  useEffect(() => {
    if (pendingAttachment) {
      if (pendingAttachment.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
          setFilePreview(null);
          setAttachmentMeta(null);
        };
        reader.readAsDataURL(pendingAttachment);
      } else {
        setFilePreview(pendingAttachment);
        setImagePreview(null);
        setAttachmentMeta(null);
      }
      setPendingAttachment(null);
    }
  }, [pendingAttachment, setPendingAttachment]);

  useEffect(() => {
    if (selectedUser) {
      const draft = drafts[selectedUser._id] || "";
      setText(draft);
      adjustTextareaHeight();
    }
  }, [selectedUser, drafts]);

  const adjustTextareaHeight = () => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      const newHeight = Math.min(inputRef.current.scrollHeight, 120);
      inputRef.current.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [text]);

  const isSelf = selectedUser?._id === authUser?._id;
  const isFriend = friends.some((f) => String(f._id) === String(selectedUser?._id));
  const hasIncoming = requests.some((r) => r.requesterId && String(r.requesterId._id) === String(selectedUser?._id));
  const hasOutgoing = sentRequests.some((r) => r.receiverId && String(r.receiverId._id) === String(selectedUser?._id));

  const isHelpCenter = selectedUser?.email === HELP_CENTER_EMAIL || authUser?.email === HELP_CENTER_EMAIL;
  const canChat = isSelf || isFriend || isHelpCenter;

  const typingTimeoutRef = useRef(null);
  const sendingDelayRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: "audio/webm" });
        setFilePreview(audioFile);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 50 * 1024 * 1024) { toast.error("File size must be less than 50MB"); return; }
    const reader = new FileReader();
    reader.onloadend = () => { setImagePreview(reader.result); setFilePreview(null); setAttachmentMeta(null); };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file.size > 50 * 1024 * 1024) { toast.error("File size must be less than 50MB"); return; }
    setFilePreview(file);
    setImagePreview(null);
    setAttachmentMeta(null);
  };

  const removeAttachment = () => {
    setImagePreview(null);
    setFilePreview(null);
    setAttachmentMeta(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleGifPick = (pick: GifPickerPick) => {
    setImagePreview(pick.image);
    setFilePreview(null);
    setAttachmentMeta(pick.file);
    setShowGifPicker(false);
    setIsViewOnce(false);
  };

  const handleTextChange = (e) => {
    const newText = e.target.value;
    if (newText.length > 1024) return;
    setText(newText);

    const lastWord = newText.split(" ").pop();
    if (lastWord.startsWith(":") && lastWord.length > 1) {
      const query = lastWord.substring(1).toLowerCase();
      const matches = EMOJIS.filter(e => e.name.includes(query));
      setEmojiSuggestions(matches.slice(0, 5));
    } else {
      setEmojiSuggestions([]);
    }

    if (selectedUser) {
      setDraft(selectedUser._id, newText);
      socket.emit("typing", selectedUser._id);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => socket.emit("stopTyping", selectedUser._id), 2000);
    }
  };

  const selectEmoji = (emojiChar) => {
    const words = text.split(" ");
    words.pop();
    const newText = [...words, emojiChar].join(" ") + " ";
    setText(newText);
    setEmojiSuggestions([]);
    if (selectedUser) setDraft(selectedUser._id, newText);
    inputRef.current?.focus();
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!text.trim() && !imagePreview && !filePreview && !isRecording) return;
    if (isSending) return;
    if (isRecording) { stopRecording(); return; }
    if (selectedUser) socket.emit("stopTyping", selectedUser._id);

    try {
      setIsSending(true);
      const formData = new FormData();
      if (text.trim()) formData.append("text", text.trim());
      if (imagePreview) formData.append("image", imagePreview);
      if (filePreview) formData.append("file", filePreview);
      if (attachmentMeta && imagePreview) formData.append("fileMeta", JSON.stringify(attachmentMeta));
      if (replyingToMessage) formData.append("replyTo", replyingToMessage._id);

      if (editingMessageId) {
        await editMessage(editingMessageId, text.trim());
      } else {
        formData.append("viewOnce", isViewOnce);
        await sendMessage(formData);
      }

      setText("");
      if (selectedUser) setDraft(selectedUser._id, "");
      setImagePreview(null);
      setFilePreview(null);
      setAttachmentMeta(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (imageInputRef.current) imageInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (sendingDelayRef.current) clearTimeout(sendingDelayRef.current);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    };
  }, []);

  const hasContent = text.trim() || imagePreview || filePreview;

  if (selectedUser && !canChat) {
    return (
      <div className="w-full px-4 sm:px-6 py-4 bg-base-100 border-t border-base-300 flex-shrink-0 select-none text-center">
        <div className="max-w-[800px] w-full mx-auto py-3 px-4 bg-base-200 border border-dashed border-base-300 rounded-2xl">
          <p className="text-sm font-semibold text-base-content/50">
            {hasIncoming ? "Accept their friend request to start chatting!" :
             hasOutgoing ? "Waiting for them to accept your friend request..." :
             "You can only chat with users after becoming friends"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-4 bg-base-100 border-t border-base-300 flex-shrink-0 z-20">
      <div className="max-w-[800px] mx-auto relative">

        <ReplyPreview />
        <EditingIndicator />

        {emojiSuggestions.length > 0 && (
          <div className="absolute bottom-full mb-3 left-0 z-50 bg-base-100 border border-base-300 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn w-48">
            {emojiSuggestions.map((emoji) => (
              <button
                key={emoji.name}
                onClick={() => selectEmoji(emoji.char)}
                className="px-4 py-2.5 flex items-center gap-2 hover:bg-base-200 text-[14px] transition-colors"
              >
                <span>{emoji.char}</span>
                <span className="text-base-content/50 text-[12px]">:{emoji.name}:</span>
              </button>
            ))}
          </div>
        )}

        {(imagePreview || filePreview) && (
          <div className="mb-4 flex flex-col gap-2 animate-fadeIn">
            <div className="relative inline-block group">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-2xl border border-base-300 shadow-xl" />
              ) : (
                <div className="w-24 h-24 flex items-center justify-center bg-base-200 rounded-2xl border border-base-300 shadow-xl">
                  <Paperclip size={28} className="text-primary" />
                  <span className="ml-1 text-[10px] truncate max-w-[60px] text-base-content/50">{filePreview?.name}</span>
                </div>
              )}
              <button
                onClick={removeAttachment}
                className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-base-100 text-error border border-base-300 flex items-center justify-center transition-all hover:scale-110 shadow-lg"
              >
                <X className="size-4" />
              </button>
            </div>
            <label className="inline-flex items-center gap-2 text-[12px] text-base-content/50 font-bold cursor-pointer hover:text-base-content transition-colors">
              <input type="checkbox" checked={isViewOnce} onChange={(e) => setIsViewOnce(e.target.checked)} className="w-4 h-4 text-primary border-base-300 rounded focus:ring-primary/20" />
              View once media
            </label>
            {imagePreview && (
              <label className="inline-flex items-center gap-2 text-[12px] text-base-content/50 font-bold cursor-pointer hover:text-base-content transition-colors">
                <input
                  type="checkbox"
                  checked={attachmentMeta?.kind === "sticker"}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setAttachmentMeta((prev) => ({ ...(prev ?? {}), kind: "sticker" }));
                    } else {
                      setAttachmentMeta((prev) => {
                        if (!prev) return null;
                        if (prev.kind === "gif") return prev;
                        return null;
                      });
                    }
                  }}
                  className="w-4 h-4 text-primary border-base-300 rounded focus:ring-primary/20"
                />
                Send as sticker
              </label>
            )}
          </div>
        )}

        {showGifPicker && (
          <GifPicker onPick={handleGifPick} onClose={() => setShowGifPicker(false)} />
        )}

        <div className="flex items-end gap-3">
          {/* Actions Container */}
          <div className="flex items-center gap-1 mb-1">
            <IconButton
              size="lg"
              onClick={() => imageInputRef.current?.click()}
              className="text-base-content/50 hover:text-base-content hover:bg-base-200 rounded-full"
            >
              <Paperclip size={22} />
            </IconButton>
            <IconButton
              size="lg"
              onClick={() => { setShowGifPicker((v) => !v); setShowEmojiPicker(false); }}
              className={`${showGifPicker ? "text-primary" : "text-base-content/50"} hover:text-base-content hover:bg-base-200 rounded-full`}
            >
              <Sticker size={22} />
            </IconButton>
          </div>

          {/* Main Input Area */}
          <div className="flex-1 flex items-end bg-base-200 rounded-full px-4 py-2 transition-all border border-transparent focus-within:border-primary/30">
            {isRecording ? (
              <div className="flex-1 flex items-center gap-3 py-2 text-error font-bold animate-pulse">
                <div className="size-2 rounded-full bg-error" />
                <span className="text-sm">Recording {formatTime(recordingTime)}</span>
              </div>
            ) : (
              <textarea
                ref={inputRef}
                rows={1}
                maxLength={1024}
                className="flex-1 max-h-[150px] resize-none bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-[15px] text-base-content placeholder:text-base-content/40 leading-[1.6] py-2 pr-2"
                placeholder={editingMessageId ? "Edit message..." : "Type a message..."}
                value={text}
                onChange={handleTextChange}
                onKeyDown={(e) => {
                  if (isSending) return;
                  if (sendOnEnter && e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isSending}
              />
            )}

            <div className="flex items-center self-end mb-1">
              <IconButton
                size="md"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`${showEmojiPicker ? "text-primary" : "text-base-content/50"} hover:text-base-content rounded-full`}
                disabled={isSending || isRecording}
              >
                <Smile size={22} />
              </IconButton>
              {showEmojiPicker && <EmojiPicker onSelect={(emoji) => {
                const newText = text + emoji;
                setText(newText);
                if (selectedUser) setDraft(selectedUser._id, newText);
              }} onClose={() => setShowEmojiPicker(false)} />}
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="mb-1">
            {hasContent || isRecording ? (
              <button
                onClick={handleSendMessage}
                disabled={isSending}
                className="btn btn-primary btn-circle size-12 shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {isSending ? <Loader className="animate-spin" size={20} /> : <Send size={20} />}
              </button>
            ) : (
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className="size-12 rounded-full bg-base-200 text-base-content/50 hover:text-base-content hover:bg-base-300 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm border border-base-300"
              >
                <Mic size={22} />
              </button>
            )}
          </div>
        </div>
      </div>

      <input type="file" accept="image/*" className="hidden" ref={imageInputRef} onChange={handleImageChange} disabled={isSending} />
      <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} disabled={isSending} />
    </div>
  );
};

export default MessageInput;
