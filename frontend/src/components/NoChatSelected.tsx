import { MessageSquare, Zap } from "lucide-react";

const NoChatSelected = () => {
  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-16 bg-base-100">
      <div className="max-w-md text-center flex flex-col items-center">
        {/* Animated Icon Display */}
        <div className="relative mb-8">
          <div className="size-24 rounded-[28px] bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
            <Zap className="size-12 text-primary-content fill-primary-content/20" />
          </div>
          <div className="absolute -bottom-2 -right-2 size-10 rounded-2xl bg-base-100 border border-base-200 shadow-lg flex items-center justify-center">
            <MessageSquare className="size-5 text-primary" />
          </div>
        </div>

        {/* Welcome Text */}
        <h2 className="text-[28px] font-bold tracking-tight text-base-content mb-3">
          Welcome to Blink
        </h2>
        <p className="text-base-content/60 text-[16px] leading-relaxed max-w-[280px]">
          Select a conversation from the sidebar to start messaging your friends
        </p>

        <div className="mt-8 flex gap-2">
          <div className="px-4 py-2 rounded-full bg-base-200 text-[13px] font-medium text-base-content/60">
            Securely encrypted
          </div>
          <div className="px-4 py-2 rounded-full bg-base-200 text-[13px] font-medium text-base-content/60">
            Fast delivery
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoChatSelected;
