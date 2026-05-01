import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { JournalEntry, OperationType } from '../types';
import { getMoodId } from '../lib/moodId';
import ActivityHeatmap from './ActivityHeatmap';
import { BarChart2 } from 'lucide-react';

export default function MoodMap({ user }: { user: User }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users', user.uid, 'entries'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as JournalEntry;
      });
      setEntries(docs);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/entries`));
    return unsubscribe;
  }, [user.uid]);

  if (loading) return <div className="p-8 text-center text-slate-400">Loading Insights...</div>;

  return (
    <div className="mt-8 flex flex-col">
      <div className="flex items-center gap-3 mb-6 px-2">
        <BarChart2 className="text-blue-500" />
        <h2 className="text-xl font-medium">Insights Dashboard</h2>
      </div>

      <ActivityHeatmap entries={entries} />

      <div className="w-full bg-[#15181C] border border-[#2C313A] rounded-2xl p-6">
        <h3 className="text-xl font-medium mb-1">Mood Map</h3>
        <p className="text-slate-400 text-sm mb-6">Your emotional journey visualization.</p>
        
        {entries.length === 0 ? (
          <div className="py-12 text-center text-slate-500">No entries yet to form a map.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {entries.map(entry => {
              const mood = getMoodId(entry.text);
              return (
                <div 
                  key={entry.id} 
                  title={`${entry.createdAt.toLocaleDateString()}: ${mood.id}`}
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl cursor-default transition-all hover:scale-110"
                  style={{ backgroundColor: `${mood.color}20`, color: mood.color, border: `1px solid ${mood.color}40` }}
                >
                  {mood.emoji}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
