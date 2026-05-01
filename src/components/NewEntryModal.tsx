import React, { useState, useRef } from 'react';
import { User } from 'firebase/auth';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError } from '../lib/firebase';
import { getMoodId } from '../lib/moodId';
import { OperationType } from '../types';
import { X, Image as ImageIcon, Loader2, Info } from 'lucide-react';

interface Props {
  user: User;
  onClose: () => void;
}

const TEMPLATES = [
  {
    id: 'pm-debrief',
    name: 'PM Debrief',
    content: `### PM Shutdown
- **Site Status:** 
- **RFIs/Submittals Cleared:** 
- **Crew Time Logged:** [ ] Yes [ ] No
- **Blockers:** `
  },
  {
    id: 'energy-accounting',
    name: 'Energy Accounting',
    content: `### Spoon Accounting
- **Current Capacity (1-10):** 
- **Sensory Friction:** 
- **Ghost Iron Executed:** [ ] Yes [ ] No
- **Recovery Protocol:** `
  },
  {
    id: 'morning-alignment',
    name: 'Morning Alignment',
    content: `### 0500hr Alignment
- **Primary Target:** 
- **Known Constraints:** 
- **Cognitive Scaffolding Required:** `
  }
];

export default function NewEntryModal({ user, onClose }: Props) {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setIsSubmitting(true);
    
    try {
      let attachmentUrl = null;
      
      if (selectedFile) {
        const fileRef = ref(storage, `users/${user.uid}/attachments/${Date.now()}_${selectedFile.name}`);
        const uploadResult = await uploadBytes(fileRef, selectedFile);
        attachmentUrl = await getDownloadURL(uploadResult.ref);
      }

      const mood = getMoodId(text);
      const entryRef = doc(collection(db, 'users', user.uid, 'entries'));
      
      await setDoc(entryRef, {
        userId: user.uid,
        text: text.trim(),
        moodId: mood.id,
        attachments: attachmentUrl ? [attachmentUrl] : [], 
        tags: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      onClose();
    } catch (error) {
      // using WRITE for general operation when we also wrote to storage and DB, or CREATE for this spec.
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
        
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-2 -mx-4 px-4 sm:mx-0 sm:px-0" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => setText(prev => prev.trim() ? prev + '\n\n' + t.content : t.content)}
                className="whitespace-nowrap px-3 py-1.5 rounded-full border border-[#2C313A] bg-[#15181C] hover:bg-[#2C313A] text-sm text-slate-300 transition-colors"
                title={`Insert ${t.name} template`}
              >
                {t.name}
              </button>
            ))}
          </div>
          <textarea 
            autoFocus
            className="w-full h-32 bg-transparent border-none outline-none resize-none text-lg text-slate-200 placeholder:text-slate-600 focus:ring-0 p-0"
            placeholder="What's on your mind?"
            value={text}
            onChange={e => setText(e.target.value)}
          />
          
          {previewUrl && (
            <div className="relative mt-4 self-start rounded-xl overflow-hidden border border-[#2C313A] max-h-48">
              <img src={previewUrl} alt="Preview" className="object-cover max-h-48" />
              <button 
                onClick={handleClearFile} 
                className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-md"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-[#0D0F12] border-t border-[#2C313A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className={`p-2 rounded-full transition-colors ${previewUrl ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400 hover:text-white hover:bg-[#2C313A]'}`} 
              title="Attach Image"
            >
              <ImageIcon size={20} />
            </button>
            {text.length > 5 && (
              <span className="text-sm px-2 py-1 rounded-full bg-[#15181C] border border-[#2C313A] flex items-center gap-2">
                {getMoodId(text).emoji} {getMoodId(text).id}
              </span>
            )}
            <span className="text-xs text-slate-500 hidden sm:flex items-center gap-1 ml-2" title="Markdown is supported (bold, italic, lists)">
              <Info size={14} /> Markdown
            </span>
          </div>
          <button 
            disabled={!text.trim() || isSubmitting}
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 disabled:hover:bg-blue-500 text-white rounded-full font-medium transition-colors flex items-center gap-2"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isSubmitting ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
      </div>
    </div>
  );
}
