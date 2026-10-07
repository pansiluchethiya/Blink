import { useEffect, useState } from "react";
import { axiosInstance } from "../lib/axios";
import { ExternalLink } from "lucide-react";

const LinkPreview = ({ url, isSelf }) => {
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await axiosInstance.get(`/messages/link-preview?url=${encodeURIComponent(url)}`);
        setMetadata(res.data);
      } catch (error) {
        console.error("Failed to fetch link preview:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [url]);

  if (loading) return null;
  if (!metadata) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block mt-2 rounded-xl overflow-hidden border transition-all hover:scale-[1.01] active:scale-[0.99] ${
        isSelf 
          ? "bg-white/10 border-white/20 text-white" 
          : "bg-base-200 border-base-300 text-base-content"
      }`}
    >
      {metadata.image && (
        <img src={metadata.image} alt={metadata.title} className="w-full h-32 object-cover border-b border-inherit" />
      )}
      <div className="p-3">
        <h4 className="text-xs font-bold truncate mb-1">{metadata.title}</h4>
        <p className="text-[10px] opacity-75 line-clamp-2 leading-relaxed mb-2">{metadata.description}</p>
        <div className="flex items-center gap-1 opacity-60 text-[9px] font-bold uppercase tracking-wider">
          <ExternalLink size={10} />
          <span className="truncate">{new URL(url).hostname}</span>
        </div>
      </div>
    </a>
  );
};

export default LinkPreview;
