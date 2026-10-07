const QuotedMessage = ({ replyTo }) => {
  if (!replyTo || replyTo.isDeleted) return null;

  return (
    <div className="bg-base-200 p-2 rounded-md mb-2 border-l-2 border-primary text-sm opacity-75">
      <p className="text-xs text-base-content/50 mb-1">Replying to message</p>
      <p className="line-clamp-2">
        {replyTo.text || (replyTo.image ? "📸 Image" : replyTo.file ? "📎 File" : "No content")}
      </p>
    </div>
  );
};

export default QuotedMessage;
