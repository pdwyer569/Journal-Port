import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { getMoodId } from '../lib/moodId';
import { OperationType } from '../types';
import { X, Image as ImageIcon } from 'lucide-react';

interface Props {
  user: User;
  onClose: () => void;
}

export default function NewEntryModal({ user, onClose }: Props) {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setIsSubmitting(true);
    
    try {
      const mood = getMoodId(text);
      const entryRef = doc(collection(db, 'users', user.uid, 'entries'));
      
      await setDoc(entryRef, {
        userId: user.uid,
        text: text.trim(),
        moodId: mood.id,
        attachments: [], 
        tags: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/entries`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#15181C] border border-[#2C313A] rounded-2xl max-w-lg w-full flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-[#2C313A]">
          <h2 className="font-medium text-lg">New Entry</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#2C313A] rounded-full transition-colors text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 flex-1">
          <textarea 
            autoFocus
            className="w-full h-40 bg-transparent border-none outline-none resize-none text-lg text-slate-200 placeholder:text-slate-600 focus:ring-0 p-0"
            placeholder="What's on your mind?"
            value={text}
            onChange={e => setText(e.target.value)}
          />
        </div>
        
        <div className="p-4 bg-[#0D0F12] border-t border-[#2C313A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400 hover:text-white hover:bg-[#2C313A] rounded-full transition-colors" title="Attach Image">
              <ImageIcon size={20} />
            </button>
            {text.length > 5 && (
              <span className="text-sm px-2 py-1 rounded-full bg-[#15181C] border border-[#2C313A] flex items-center gap-2">
                {getMoodId(text).emoji} {getMoodId(text).id}
              </span>
            )}
          </div>
          <button 
            disabled={!text.trim() || isSubmitting}
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 disabled:hover:bg-blue-500 text-white rounded-full font-medium transition-colors"
          >
            {isSubmitting ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
      </div>
    </div>
  );
}
