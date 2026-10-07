import { useState, useEffect } from "react";
import { Download, FileText, FileJson, FileSpreadsheet, Loader } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";

const ExportChatModal = ({ user, onClose }) => {
  const [format, setFormat] = useState('json');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { exportChat } = useChatStore();

  const formatOptions = [
    {
      value: 'json',
      label: 'JSON',
      description: 'Complete data with all metadata',
      icon: <FileJson className="w-5 h-5" />,
    },
    {
      value: 'text',
      label: 'Text',
      description: 'Human-readable text format',
      icon: <FileText className="w-5 h-5" />,
    },
    {
      value: 'csv',
      label: 'CSV',
      description: 'Spreadsheet-compatible format',
      icon: <FileSpreadsheet className="w-5 h-5" />,
    },
  ];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const success = await exportChat(user._id, format, includeDeleted);
      if (success) {
        toast.success(`Chat exported as ${format.toUpperCase()}`);
        onClose();
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    const handleClose = () => onClose();
    const handleSubmit = () => handleExport();
    window.addEventListener("close-active-modal", handleClose);
    window.addEventListener("submit-active-modal", handleSubmit);
    return () => {
      window.removeEventListener("close-active-modal", handleClose);
      window.removeEventListener("submit-active-modal", handleSubmit);
    };
  }, [onClose, handleExport]);

  return (
    <div data-context="modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-base-200/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-base-100 border border-base-300 rounded-3xl shadow-xl max-w-md w-full animate-fadeIn overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-base-300">
          <div>
            <h3 className="text-lg font-bold text-base-content">
              Export Chat
            </h3>
            <p className="text-xs text-base-content/60 font-semibold mt-1">
              Export conversation with {user.fullName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-base-200 text-base-content/60 hover:text-base-content transition-colors"
            disabled={isExporting}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3">
              Export Format
            </label>
            <div className="space-y-2">
              {formatOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                    format === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-base-300 hover:border-base-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="format"
                    value={option.value}
                    checked={format === option.value}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-4 h-4 text-primary border-base-300 focus:ring-primary focus:ring-1 cursor-pointer mr-3"
                  />
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`text-primary ${format === option.value ? '' : 'opacity-60'}`}>
                      {option.icon}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-base-content">
                        {option.label}
                      </div>
                      <div className="text-xs text-base-content/60">
                        {option.description}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Options */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeDeleted}
                onChange={(e) => setIncludeDeleted(e.target.checked)}
                className="w-4 h-4 text-primary border-base-300 rounded bg-transparent focus:ring-primary focus:ring-1 cursor-pointer"
              />
              <div>
                <div className="font-bold text-sm text-base-content">
                  Include deleted messages
                </div>
                <div className="text-xs text-base-content/60 mt-0.5">
                  Include messages that have been deleted
                </div>
              </div>
            </label>
          </div>

          {/* Export Info */}
          <div className="bg-base-200 border border-base-300 rounded-xl p-4">
            <h4 className="font-bold text-xs text-base-content/60 uppercase tracking-wider mb-2">What gets exported:</h4>
            <ul className="text-xs text-base-content/60 space-y-1 font-semibold">
              <li>• Message text and timestamps</li>
              <li>• Images and file attachments</li>
              <li>• Reactions and replies</li>
              <li>• Edit history and pinned messages</li>
              <li>• Forwarded message information</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end p-6 border-t border-base-300">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-base-200 hover:bg-base-200 text-base-content/60 rounded-xl font-semibold text-xs transition-all active:scale-[0.98]"
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-primary hover:bg-primary text-base-content rounded-xl font-semibold text-xs transition-all active:scale-[0.98] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Loader className="w-3.5 h-3.5 mr-1 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 mr-1" />
                Export Chat
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportChatModal;