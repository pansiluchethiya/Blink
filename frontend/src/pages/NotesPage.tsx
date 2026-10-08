import { useEffect, useState } from "react";
import { StickyNote, Plus, Trash2 } from "lucide-react";
import { db, QuickNote } from "../lib/db";

/**
 * Local-only quick notes (note_taking `new_note_url` target).
 * Stored in IndexedDB — no account or backend needed.
 */
export default function NotesPage() {
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [draft, setDraft] = useState("");

  const reload = async () => {
    try {
      setNotes(await db.notes.orderBy("updatedAt").reverse().toArray());
    } catch {
      setNotes([]);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const add = async () => {
    const text = draft.trim();
    if (!text) return;
    const now = new Date().toISOString();
    try {
      await db.notes.add({ text, createdAt: now, updatedAt: now });
      setDraft("");
      await reload();
    } catch {
      /* storage unavailable */
    }
  };

  const remove = async (id: number) => {
    try {
      await db.notes.delete(id);
      await reload();
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-3">
        <StickyNote className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold">Quick notes</h1>
      </div>
      <p className="text-sm text-base-content/60 mb-3">
        Private to this device — notes never leave your browser.
      </p>

      <div className="flex gap-2 mb-4">
        <textarea
          className="textarea textarea-bordered flex-1 text-sm"
          rows={2}
          placeholder="Jot something down…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) void add();
          }}
        />
        <button className="btn btn-primary" onClick={() => void add()} aria-label="Add note">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {notes.length === 0 ? (
        <p className="text-sm text-base-content/50 text-center py-8">
          No notes yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li
              key={n.id}
              className="card bg-base-200 border border-base-300 p-3 flex flex-row items-start gap-2"
            >
              <p className="flex-1 text-sm whitespace-pre-wrap break-words">
                {n.text}
              </p>
              <button
                className="btn btn-ghost btn-xs text-error"
                onClick={() => void remove(n.id!)}
                aria-label="Delete note"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
