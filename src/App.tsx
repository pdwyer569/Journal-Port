import React, { useState } from 'react';
import Auth from './components/Auth';
import Timeline from './components/Timeline';
import MoodMap from './components/MoodMap';
import MemoriesGallery from './components/MemoriesGallery';
import NewEntryModal from './components/NewEntryModal';
import { auth } from './lib/firebase';
import { Plus, Book, BarChart2, Image as ImageIcon, LogOut } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'timeline' | 'moodmap' | 'gallery'>('timeline');
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <Auth>
      {(user) => (
        <div className="min-h-screen bg-[#0D0F12] text-[#E2E8F0] font-sans selection:bg-blue-500/30 selection:text-blue-200">
          
          <header className="fixed top-0 left-0 right-0 h-16 bg-[#0D0F12]/80 backdrop-blur-md border-b border-[#15181C] z-30 flex items-center justify-between px-4 sm:px-6 md:px-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white font-bold text-lg">P</div>
              <h1 className="text-lg font-medium tracking-tight">Pixel 10 Journal</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-400 hidden sm:block">{user.email}</span>
              <button 
                onClick={() => auth.signOut()} 
                className="p-2 text-slate-400 hover:text-white hover:bg-[#15181C] rounded-full transition-colors"
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </header>

          <main className="max-w-2xl mx-auto px-4 pt-24 pb-32">
            
            <nav className="flex items-center gap-2 mb-8 bg-[#15181C] p-1.5 rounded-xl border border-[#2C313A]">
              <TabButton 
                active={activeTab === 'timeline'} 
                onClick={() => setActiveTab('timeline')} 
                icon={<Book size={18} />} 
                label="Timeline" 
              />
              <TabButton 
                active={activeTab === 'moodmap'} 
                onClick={() => setActiveTab('moodmap')} 
                icon={<BarChart2 size={18} />} 
                label="Mood Map" 
              />
              <TabButton 
                active={activeTab === 'gallery'} 
                onClick={() => setActiveTab('gallery')} 
                icon={<ImageIcon size={18} />} 
                label="Gallery" 
              />
            </nav>

            {activeTab === 'timeline' && <Timeline user={user} />}
            {activeTab === 'moodmap' && <MoodMap user={user} />}
            {activeTab === 'gallery' && <MemoriesGallery user={user} />}

          </main>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="fixed bottom-8 right-8 w-14 h-14 bg-blue-500 hover:bg-blue-400 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-blue-500/25 hover:-translate-y-1 transition-all z-40 active:scale-95"
            title="New Entry"
          >
            <Plus size={24} />
          </button>

          {isModalOpen && (
            <NewEntryModal user={user} onClose={() => setIsModalOpen(false)} />
          )}

        </div>
      )}
    </Auth>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
        active 
          ? 'bg-[#2C313A] text-white shadow-sm' 
          : 'text-slate-400 hover:text-slate-200 hover:bg-[#2C313A]/50'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
