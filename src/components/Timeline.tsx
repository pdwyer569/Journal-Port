import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { JournalEntry, OperationType } from '../types';
import { getMoodId } from '../lib/moodId';

export default function Timeline({ user }: { user: User }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'users', user.uid, 'entries'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
      const docs = snapshot.docs.map(doc => {
        const data = doc.data();
        let createdAt = new Date();
        let updatedAt = new Date();
        
        if (data.createdAt?.toDate) createdAt = data.createdAt.toDate();
        if (data.updatedAt?.toDate) updatedAt = data.updatedAt.toDate();
        
        return {
          id: doc.id,
          ...data,
          createdAt,
          updatedAt
        } as JournalEntry;
      });
      
      setEntries(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/entries`);
    });

    return unsubscribe;
  }, [user.uid]);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Syncing timeline...</div>;
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-[#2C313A] rounded-2xl bg-[#15181C]/50 mt-8">
        <h3 className="text-xl font-medium mb-2">No entries yet</h3>
        <p className="text-slate-400 max-w-sm">Capture your thoughts, memories, and reflections to start your timeline.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 mt-8">
      {entries.map((entry) => {
        const mood = getMoodId(entry.text);
        const isPending = !entry.id; // Or if pending write flag from metadata
        
        return (
          <article key={entry.id || entry.createdAt.getTime()} className="p-6 rounded-2xl bg-[#15181C] border border-[#2C313A] relative group">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
                style={{ backgroundColor: `${mood.color}15`, color: mood.color }}
              >
                {mood.emoji}
              </div>
              <div>
                <div className="font-medium capitalize text-slate-200">{mood.id}</div>
                <time className="text-sm text-slate-500">
                  {entry.createdAt.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </time>
              </div>
            </div>
            
            <p className="whitespace-pre-wrap text-slate-300 leading-relaxed text-[17px]">
              {entry.text}
            </p>
            
            {entry.tags && entry.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {entry.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 text-xs rounded-md bg-[#2C313A] text-slate-300">#{tag}</span>
                ))}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
