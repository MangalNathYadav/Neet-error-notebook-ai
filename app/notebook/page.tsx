'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/components/auth/AuthContext';
import { getUserMistakes, MistakeEntry } from '@/lib/firebase/database';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Filter,
  ExternalLink,
  BookOpen
} from 'lucide-react';

export default function NotebookPage() {
  const { user } = useAuth();
  const [mistakes, setMistakes] = useState<MistakeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');

  useEffect(() => {
    if (user) {
      getUserMistakes(user.uid).then(res => {
        setMistakes(res);
        setLoading(false);
      });
    }
  }, [user]);

  const filteredMistakes = mistakes.filter(m => {
    const matchesSearch = m.chapter.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || m.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  // Group by Subject and then Chapter
  const grouped = filteredMistakes.reduce((acc, current) => {
    if (!acc[current.subject]) acc[current.subject] = {};
    if (!acc[current.subject][current.chapter]) acc[current.subject][current.chapter] = [];
    acc[current.subject][current.chapter].push(current);
    return acc;
  }, {} as Record<string, Record<string, MistakeEntry[]>>);

  return (
    <DashboardLayout>
      <header className="mb-10 lg:flex lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-white">Error Notebook</h1>
          <p className="text-neutral-500">Your curated list of concepts to master.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
            <input 
              type="text" 
              placeholder="Search chapters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 w-full lg:w-64 rounded-xl border border-white/5 bg-white/5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
          <select 
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="h-11 rounded-xl border border-white/5 bg-white/5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          >
            <option value="All" className="bg-neutral-900">All Subjects</option>
            <option value="Physics" className="bg-neutral-900">Physics</option>
            <option value="Chemistry" className="bg-neutral-900">Chemistry</option>
            <option value="Botany" className="bg-neutral-900">Botany</option>
            <option value="Zoology" className="bg-neutral-900">Zoology</option>
          </select>
        </div>
      </header>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen className="h-12 w-12 text-neutral-700 mb-4" />
          <h3 className="text-xl font-bold text-neutral-400">Notebook is empty</h3>
          <p className="text-neutral-500 mt-1">Start adding mistakes to see them here.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(grouped).map(([subject, chapters]) => (
            <section key={subject} className="space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${subject === 'Physics' ? 'bg-blue-500' : subject === 'Chemistry' ? 'bg-orange-500' : 'bg-green-500'}`} />
                {subject}
              </h2>
              
              <div className="space-y-4">
                {Object.entries(chapters).map(([chapter, entries]) => (
                  <ChapterCollapse key={chapter} chapter={chapter} entries={entries} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

function ChapterCollapse({ chapter, entries }: { chapter: string, entries: MistakeEntry[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-white/5 bg-white/5 overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-neutral-200">{chapter}</span>
          <span className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 font-bold border border-purple-500/20">
            {entries.length} errors
          </span>
        </div>
        {isOpen ? <ChevronUp size={20} className="text-neutral-500" /> : <ChevronDown size={20} className="text-neutral-500" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden border-t border-white/5"
          >
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {entries.map(entry => (
                <MistakeCard key={entry.id} entry={entry} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MistakeCard({ entry }: { entry: MistakeEntry }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="rounded-3xl border border-white/5 bg-neutral-900/50 p-4 transition-all hover:border-purple-500/30">
      <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 border border-white/10 group">
        <img src={entry.imageBase64} alt="Question" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
        <div className="absolute top-2 left-2 flex gap-2">
          <span className="text-[10px] px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white border border-white/10">
            {entry.mistakeType}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-neutral-500 italic">Added {new Date(entry.createdAt).toLocaleDateString()}</p>
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs font-bold text-purple-400 hover:text-purple-300"
          >
            {showDetails ? 'Hide Logic' : 'View Logic'}
          </button>
        </div>

        <AnimatePresence>
          {showDetails && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 pt-2 border-t border-white/5 text-sm"
            >
              <div>
                <h4 className="font-bold text-white mb-1">AI Solution</h4>
                <p className="text-neutral-400 leading-relaxed whitespace-pre-wrap">{entry.aiAnalysis.solution}</p>
              </div>
              <div>
                <h4 className="font-bold text-white mb-1 uppercase tracking-wider text-[10px]">Concept</h4>
                <p className="text-neutral-400 leading-relaxed">{entry.aiAnalysis.explanation}</p>
              </div>
              {entry.aiAnalysis.ncertReference && (
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                  <h4 className="text-[10px] font-bold text-green-400 uppercase mb-1">NCERT Reference</h4>
                  <p className="text-xs text-green-300/80">
                    <span className="font-bold">{entry.aiAnalysis.ncertReference.chapter}</span>: {entry.aiAnalysis.ncertReference.paragraph}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
