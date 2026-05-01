import Markdown from 'react-markdown';
import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, doc, query, orderBy, onSnapshot, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage, handleFirestoreError } from '../lib/firebase';
import { JournalEntry, OperationType } from '../types';
import { getMoodId } from '../lib/moodId';
import { Trash2, Edit2, Loader2, X, Check, Search } from 'lucide-react';

const MOODS = [
  { id: 'positive', emoji: '✨', color: 'var(--color-mood-positive)' },
  { id: 'negative', emoji: '🌧️', color: 'var(--color-mood-negative)' },
  { id: 'reflective', emoji: '🤔', color: 'var(--color-mood-reflective)' },
  { id: 'neutral', emoji: '📓', color: 'var(--color-mood-neutral)' },
];

export default function Timeline({ user }: { user: User }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMoods, setActiveMoods] = useState<string[]>([]);

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

  const handleDelete = async (entry: JournalEntry) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    
    try {
      if (entry.attachments && entry.attachments.length > 0) {
        for (const url of entry.attachments) {
          try {
            const storageRef = ref(storage, url);
            await deleteObject(storageRef);
          } catch(e) {
            console.error("Failed to delete attachment: ", e);
          }
        }
      }
      await deleteDoc(doc(db, 'users', user.uid, 'entries', entry.id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/entries/${entry.id}`);
    }
  };

  const handleEditInit = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setEditText(entry.text);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleSaveEdit = async (entry: JournalEntry) => {
    if (!editText.trim() || editText === entry.text) {
      handleEditCancel();
      return;
    }
    
    setIsSubmitting(true);
    try {
      const newMoodId = getMoodId(editText).id;
      const entryRef = doc(db, 'users', user.uid, 'entries', entry.id);
      
      await updateDoc(entryRef, {
        text: editText.trim(),
        moodId: newMoodId,
        updatedAt: serverTimestamp()
      });
      
      setEditingId(null);
      setEditText('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/entries/${entry.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch = entry.text.toLowerCase().includes(searchQuery.toLowerCase());
    const moodId = getMoodId(entry.text).id;
    const matchesMood = activeMoods.length === 0 || activeMoods.includes(moodId);
    return matchesSearch && matchesMood;
  });

  return (
    <div className="space-y-6 pb-24 mt-8">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text"
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#15181C] border border-[#2C313A] rounded-xl pl-10 pr-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 sm:overflow-visible" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
          {MOODS.map(mood => {
            const isActive = activeMoods.includes(mood.id);
            return (
              <button
                key={mood.id}
                onClick={() => {
                  setActiveMoods(prev => 
                    prev.includes(mood.id) ? prev.filter(id => id !== mood.id) : [...prev, mood.id]
                  );
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
                  isActive 
                    ? '' 
                    : 'bg-[#15181C] text-slate-500 border-[#2C313A] hover:text-slate-300 hover:border-slate-600'
                }`}
                style={isActive ? { borderColor: mood.color, color: mood.color, backgroundColor: `${mood.color}15` } : {}}
              >
                <span>{mood.emoji}</span>
                <span className="capitalize font-medium text-sm">{mood.id}</span>
              </button>
            )
          })}
        </div>
      </div>

      {filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-[#2C313A] rounded-2xl bg-[#15181C]/50 mt-8">
          <h3 className="text-xl font-medium mb-2">No matching entries found</h3>
          <p className="text-slate-400 max-w-sm">Try adjusting your search or mood filters.</p>
        </div>
      ) : (
      filteredEntries.map((entry) => {
        const mood = getMoodId(entry.text);
        const isEditing = editingId === entry.id;
        
        return (
          <article key={entry.id || entry.createdAt.getTime()} className="p-6 rounded-2xl bg-[#15181C] border border-[#2C313A] relative group">
            
            {/* Action Buttons */}
            {!isEditing && (
              <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                <button 
                  onClick={() => handleEditInit(entry)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-[#2C313A] rounded-full transition-colors"
                  title="Edit entry"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(entry)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors"
                  title="Delete entry"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
                style={{ backgroundColor: `${isEditing ? getMoodId(editText).color : mood.color}15`, color: isEditing ? getMoodId(editText).color : mood.color }}
              >
                {isEditing ? getMoodId(editText).emoji : mood.emoji}
              </div>
              <div>
                <div className="font-medium capitalize text-slate-200">
                  {isEditing ? getMoodId(editText).id : mood.id}
                  {entry.updatedAt.getTime() > entry.createdAt.getTime() + 1000 && !isEditing && (
                    <span className="text-slate-500 text-xs ml-2 font-normal">(edited)</span>
                  )}
                </div>
                <time className="text-sm text-slate-500">
                  {entry.createdAt.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </time>
              </div>
            </div>
            
            {isEditing ? (
              <div className="flex flex-col gap-3">
                <textarea 
                  autoFocus
                  className="w-full h-32 bg-[#0D0F12] border border-[#2C313A] rounded-xl outline-none resize-none text-lg text-slate-200 focus:ring-1 focus:ring-blue-500 p-3"
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  disabled={isSubmitting}
                />
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={handleEditCancel}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-[#2C313A] rounded-full transition-colors flex items-center gap-2"
                  >
                    <X size={16} /> Cancel
                  </button>
                  <button 
                    onClick={() => handleSaveEdit(entry)}
                    disabled={!editText.trim() || isSubmitting}
                    className="px-4 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-400 text-white rounded-full transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="prose prose-invert prose-slate max-w-none text-slate-300 leading-relaxed text-[17px]">
                <Markdown>{entry.text}</Markdown>
              </div>
            )}

            {entry.attachments && entry.attachments.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {entry.attachments.map((url, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden border border-[#2C313A]">
                    <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
            
            {entry.tags && entry.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {entry.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 text-xs rounded-md bg-[#2C313A] text-slate-300">#{tag}</span>
                ))}
              </div>
            )}
          </article>
        );
      })
      )}
    </div>
  );
}
