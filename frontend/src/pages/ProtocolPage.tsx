import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useChatStore } from "../store/useChatStore";

/**
 * Handles `web+blink://chat/<userId>` links (protocol_handlers).
 * Finds the conversation and drops the user into it.
 */
export default function ProtocolPage() {
  const navigate = useNavigate();
  const { search } = useLocation();

  useEffect(() => {
    const raw = new URLSearchParams(search).get("url") ?? "";
    const m = raw.match(/(?:web\+)?blink:\/\/chat\/([A-Za-z0-9_-]+)/i);
    const id = m ? m[1] : raw.trim() || null;
    if (!id) {
      navigate("/", { replace: true });
      return;
    }
    const go = async () => {
      try {
        await useChatStore.getState().getUsers();
      } catch {
        /* offline — fall through to home */
      }
      const user = useChatStore.getState().users.find((u) => u._id === id);
      if (user) useChatStore.getState().setSelectedUser(user);
      navigate("/", { replace: true });
    };
    void go();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return null;
}
