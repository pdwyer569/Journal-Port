import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { JournalEntry, OperationType } from '../types';
import { Image as ImageIcon } from 'lucide-react';

export default function MemoriesGallery({ user }: { user: User }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users', user.uid, 'entries'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as JournalEntry;
      });
      // Filter entries to only those with attachments (if any)
      setEntries(docs.filter(entry => entry.attachments && entry.attachments.length > 0));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/entries`));
    return unsubscribe;
  }, [user.uid]);

  if (loading) return <div className="p-8 text-center text-slate-400">Loading Memories...</div>;

  return (
    <div className="mt-8 flex flex-col">
      <div className="flex items-center gap-3 mb-6 px-2">
        <ImageIcon className="text-blue-500" />
        <h2 className="text-xl font-medium">Memories Gallery</h2>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-[#2C313A] rounded-2xl bg-[#15181C]/50">
          <div className="w-16 h-16 rounded-full bg-[#2C313A]/50 flex items-center justify-center mb-4">
            <ImageIcon size={24} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-medium mb-1">No attached memories</h3>
          <p className="text-slate-400 text-sm max-w-sm">When you attach photos and media to your entries, they will appear here in a beautiful grid.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {entries.map(entry => (
            <div key={entry.id} className="aspect-[16/9] bg-[#15181C] border border-[#2C313A] rounded-xl overflow-hidden relative group">
              <div className="absolute inset-0 flex items-center justify-center text-slate-500 bg-[#0D0F12]">
                {/* Placeholder for actual image: Use first attachment */}
                {entry.attachments[0]}
                <span className="text-xs">Image</span>
              </div>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <p className="text-white text-sm line-clamp-2">{entry.text}</p>
                <time className="text-slate-300 text-xs mt-1">{entry.createdAt.toLocaleDateString()}</time>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
