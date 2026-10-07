import { useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { X, Loader } from "lucide-react";
import toast from "react-hot-toast";

const StatusUpdateModal = ({ onClose }) => {
  const { updateUserStatus } = useChatStore();
  const [status, setStatus] = useState("online");
  const [statusMessage, setStatusMessage] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const statuses = [
    { value: "online", label: "🟢 Online", color: "text-green-500" },
    { value: "away", label: "🟡 Away", color: "text-yellow-500" },
    { value: "dnd", label: "🔴 Do Not Disturb", color: "text-red-500" },
    { value: "offline", label: "⚫ Offline", color: "text-gray-500" },
  ];

  const handleUpdate = async () => {
    if (!status.trim()) {
      toast.error("Please select a status");
      return;
    }

    try {
      setIsUpdating(true);
      await updateUserStatus(status, statusMessage.trim() || "");
      toast.success("Status updated!");
      onClose();
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    const handleClose = () => onClose();
    const handleSubmit = () => handleUpdate();
    window.addEventListener("close-active-modal", handleClose);
    window.addEventListener("submit-active-modal", handleSubmit);
    return () => {
      window.removeEventListener("close-active-modal", handleClose);
      window.removeEventListener("submit-active-modal", handleSubmit);
    };
  }, [onClose, handleUpdate]);

  return (
    <div data-context="modal" className="fixed inset-0 bg-base-200/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-200">
      <div className="bg-base-100 rounded-2xl shadow-xl w-full max-w-md border border-base-300/50 p-6 overflow-hidden animate-fadeIn">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-base-content">Update Status</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-base-200 rounded-xl text-base-content/60 hover:text-base-content/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status options */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-2">
            Status
          </label>
          <div className="space-y-2">
            {statuses.map((s) => (
              <label key={s.value} className="flex items-center gap-3 px-4 py-3 hover:bg-base-200 rounded-xl cursor-pointer transition-all duration-150 border border-base-300/30">
                <input
                  type="radio"
                  name="status"
                  value={s.value}
                  checked={status === s.value}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-4 h-4 text-primary border-base-300 focus:ring-primary bg-transparent cursor-pointer"
                />
                <span className="text-sm font-medium text-base-content/60">{s.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Status message */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-2">
            Status Message (Optional)
          </label>
          <textarea
            className="w-full px-4 py-3 bg-base-200 border border-base-300 rounded-xl text-base-content placeholder:text-base-content/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-sm resize-none h-20"
            placeholder='e.g., "In a meeting", "Away for 2 hours"'
            value={statusMessage}
            onChange={(e) => setStatusMessage(e.target.value.slice(0, 50))}
            maxLength={50}
          />
          <span className="block text-right text-[11px] text-base-content/60 mt-1">
            {statusMessage.length}/50
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-base-200 hover:bg-base-200 text-base-content/60 text-sm rounded-xl font-medium transition-all active:scale-[0.98]"
            disabled={isUpdating}
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            className="px-4 py-2 bg-primary hover:bg-primary text-base-content text-sm rounded-xl font-medium flex items-center gap-1.5 transition-all active:scale-[0.98] shadow-sm"
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <Loader size={15} className="animate-spin" />
                Updating...
              </>
            ) : (
              "Update"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusUpdateModal;
