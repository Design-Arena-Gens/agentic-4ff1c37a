'use client';

import { useState } from 'react';
import EisenhowerMatrix from '@/components/EisenhowerMatrix';
import AIBlueprintOrganizer from '@/components/AIBlueprintOrganizer';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'matrix' | 'blueprint'>('matrix');

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-slate-800">
          Task Matrix & AI Blueprint Organizer
        </h1>

        <div className="flex justify-center mb-6 gap-4">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'matrix'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            Eisenhower Matrix
          </button>
          <button
            onClick={() => setActiveTab('blueprint')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'blueprint'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            AI Blueprint Organizer
          </button>
        </div>

        {activeTab === 'matrix' ? <EisenhowerMatrix /> : <AIBlueprintOrganizer />}
      </div>
    </main>
  );
}
