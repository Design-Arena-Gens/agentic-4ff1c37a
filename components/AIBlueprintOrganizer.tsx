'use client';

import { useState, useEffect } from 'react';
import { Download, Upload, Save, FileText, Database } from 'lucide-react';

interface Blueprint {
  instructionalRuleset: string;
  knowledgeCompendium: string;
  kcsFormat: 'json' | 'jsonl';
}

interface KCSChunk {
  id: string;
  content: string;
  metadata: {
    chunkIndex: number;
    totalChunks: number;
    timestamp: string;
    characterCount: number;
    keywords: string[];
  };
}

export default function AIBlueprintOrganizer() {
  const [blueprint, setBlueprint] = useState<Blueprint>({
    instructionalRuleset: '',
    knowledgeCompendium: '',
    kcsFormat: 'json'
  });

  const [savedBlueprints, setSavedBlueprints] = useState<{ name: string; data: Blueprint }[]>([]);
  const [blueprintName, setBlueprintName] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('ai-blueprints');
    if (saved) {
      setSavedBlueprints(JSON.parse(saved));
    }
  }, []);

  const convertToMarkdown = (text: string): string => {
    let markdown = text;

    // Convert headers
    markdown = markdown.replace(/^###### (.+)$/gm, '###### $1');
    markdown = markdown.replace(/^##### (.+)$/gm, '##### $1');
    markdown = markdown.replace(/^#### (.+)$/gm, '#### $1');
    markdown = markdown.replace(/^### (.+)$/gm, '### $1');
    markdown = markdown.replace(/^## (.+)$/gm, '## $1');
    markdown = markdown.replace(/^# (.+)$/gm, '# $1');

    // Add headers to sections if they don't exist
    if (!markdown.startsWith('#')) {
      markdown = '# AI Model Instructional Ruleset\n\n' + markdown;
    }

    // Convert bullet points
    markdown = markdown.replace(/^- /gm, '- ');
    markdown = markdown.replace(/^\* /gm, '- ');

    // Ensure proper spacing
    markdown = markdown.replace(/\n{3,}/g, '\n\n');

    return markdown;
  };

  const extractKeywords = (text: string): string[] => {
    const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const frequency: { [key: string]: number } = {};

    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  };

  const chunkKCS = (text: string, chunkSize: number = 1000): KCSChunk[] => {
    const chunks: KCSChunk[] = [];
    const paragraphs = text.split(/\n\n+/);
    let currentChunk = '';
    let chunkIndex = 0;

    paragraphs.forEach(paragraph => {
      if ((currentChunk + paragraph).length > chunkSize && currentChunk.length > 0) {
        chunks.push({
          id: `chunk-${chunkIndex}`,
          content: currentChunk.trim(),
          metadata: {
            chunkIndex,
            totalChunks: 0, // Will be updated later
            timestamp: new Date().toISOString(),
            characterCount: currentChunk.length,
            keywords: extractKeywords(currentChunk)
          }
        });
        currentChunk = paragraph;
        chunkIndex++;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    });

    if (currentChunk) {
      chunks.push({
        id: `chunk-${chunkIndex}`,
        content: currentChunk.trim(),
        metadata: {
          chunkIndex,
          totalChunks: 0,
          timestamp: new Date().toISOString(),
          characterCount: currentChunk.length,
          keywords: extractKeywords(currentChunk)
        }
      });
    }

    // Update totalChunks
    chunks.forEach(chunk => {
      chunk.metadata.totalChunks = chunks.length;
    });

    return chunks;
  };

  const saveBlueprint = () => {
    if (!blueprintName.trim()) {
      alert('Please enter a blueprint name');
      return;
    }

    const newBlueprints = [
      ...savedBlueprints.filter(b => b.name !== blueprintName),
      { name: blueprintName, data: blueprint }
    ];

    setSavedBlueprints(newBlueprints);
    localStorage.setItem('ai-blueprints', JSON.stringify(newBlueprints));
    alert('Blueprint saved successfully!');
  };

  const loadBlueprint = (name: string) => {
    const found = savedBlueprints.find(b => b.name === name);
    if (found) {
      setBlueprint(found.data);
      setBlueprintName(name);
    }
  };

  const exportBlueprint = () => {
    const markdownIR = convertToMarkdown(blueprint.instructionalRuleset);
    const chunks = chunkKCS(blueprint.knowledgeCompendium);

    let kcsData: string;
    if (blueprint.kcsFormat === 'json') {
      kcsData = JSON.stringify(chunks, null, 2);
    } else {
      kcsData = chunks.map(chunk => JSON.stringify(chunk)).join('\n');
    }

    // Create markdown file
    const mdBlob = new Blob([markdownIR], { type: 'text/markdown' });
    const mdUrl = URL.createObjectURL(mdBlob);
    const mdLink = document.createElement('a');
    mdLink.href = mdUrl;
    mdLink.download = `${blueprintName || 'blueprint'}-IR.md`;
    mdLink.click();

    // Create KCS file
    const kcsBlob = new Blob([kcsData], { type: 'application/json' });
    const kcsUrl = URL.createObjectURL(kcsBlob);
    const kcsLink = document.createElement('a');
    kcsLink.href = kcsUrl;
    kcsLink.download = `${blueprintName || 'blueprint'}-KCS.${blueprint.kcsFormat}`;
    kcsLink.click();
  };

  const importFile = (type: 'ir' | 'kcs', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (type === 'ir') {
        setBlueprint({ ...blueprint, instructionalRuleset: content });
      } else {
        setBlueprint({ ...blueprint, knowledgeCompendium: content });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl p-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">AI Blueprint Organizer</h2>
      <p className="text-slate-600 mb-6">
        Create and manage AI model blueprints with Instructional Rulesets (IR) and Knowledge Compendium Synthesis (KCS)
      </p>

      <div className="mb-6 flex gap-3">
        <input
          type="text"
          value={blueprintName}
          onChange={(e) => setBlueprintName(e.target.value)}
          placeholder="Blueprint name"
          className="flex-1 px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-purple-500"
        />
        <button
          onClick={saveBlueprint}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <Save size={18} />
          Save
        </button>
        <button
          onClick={exportBlueprint}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Download size={18} />
          Export
        </button>
      </div>

      {savedBlueprints.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-slate-700 mb-2">Saved Blueprints:</h3>
          <div className="flex flex-wrap gap-2">
            {savedBlueprints.map(bp => (
              <button
                key={bp.name}
                onClick={() => loadBlueprint(bp.name)}
                className="px-3 py-1 bg-slate-200 hover:bg-slate-300 rounded-md text-sm transition-colors"
              >
                {bp.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Instructional Ruleset */}
        <div className="border-2 border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText size={20} className="text-purple-600" />
              <h3 className="font-bold text-lg text-slate-800">Instructional Ruleset (IR)</h3>
            </div>
            <label className="cursor-pointer text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1">
              <Upload size={16} />
              Import
              <input
                type="file"
                accept=".txt,.md"
                onChange={(e) => importFile('ir', e)}
                className="hidden"
              />
            </label>
          </div>

          <p className="text-sm text-slate-600 mb-3">
            Define the persona, behavior, and rules for your AI model. Will be converted to Markdown format.
          </p>

          <textarea
            value={blueprint.instructionalRuleset}
            onChange={(e) => setBlueprint({ ...blueprint, instructionalRuleset: e.target.value })}
            placeholder="Enter your AI model's instructional ruleset...&#10;&#10;Example:&#10;# Core Persona&#10;You are a helpful assistant specialized in...&#10;&#10;## Behavior Rules&#10;- Always be polite and professional&#10;- Provide accurate information&#10;- Ask clarifying questions when needed"
            className="w-full h-96 px-3 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-purple-500 font-mono text-sm resize-none"
          />

          <div className="mt-3 text-xs text-slate-500">
            <p>✨ Automatically converted to Markdown on export</p>
            <p>📊 Character count: {blueprint.instructionalRuleset.length}</p>
          </div>
        </div>

        {/* Knowledge Compendium Synthesis */}
        <div className="border-2 border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Database size={20} className="text-blue-600" />
              <h3 className="font-bold text-lg text-slate-800">Knowledge Compendium (KCS)</h3>
            </div>
            <label className="cursor-pointer text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              <Upload size={16} />
              Import
              <input
                type="file"
                accept=".txt,.json,.jsonl"
                onChange={(e) => importFile('kcs', e)}
                className="hidden"
              />
            </label>
          </div>

          <p className="text-sm text-slate-600 mb-3">
            Store your AI model's knowledge base. Will be chunked with metadata mapping.
          </p>

          <textarea
            value={blueprint.knowledgeCompendium}
            onChange={(e) => setBlueprint({ ...blueprint, knowledgeCompendium: e.target.value })}
            placeholder="Enter your knowledge base content...&#10;&#10;Example:&#10;Product Information:&#10;Our flagship product is designed for enterprise users who need scalable solutions.&#10;&#10;Technical Specifications:&#10;- Supports up to 10,000 concurrent users&#10;- 99.9% uptime guarantee&#10;- Built with modern tech stack"
            className="w-full h-64 px-3 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-sm resize-none"
          />

          <div className="mt-3">
            <label className="text-sm font-semibold text-slate-700 block mb-2">Export Format:</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="json"
                  checked={blueprint.kcsFormat === 'json'}
                  onChange={(e) => setBlueprint({ ...blueprint, kcsFormat: 'json' })}
                  className="cursor-pointer"
                />
                <span className="text-sm">JSON</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="jsonl"
                  checked={blueprint.kcsFormat === 'jsonl'}
                  onChange={(e) => setBlueprint({ ...blueprint, kcsFormat: 'jsonl' })}
                  className="cursor-pointer"
                />
                <span className="text-sm">JSONL</span>
              </label>
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-500">
            <p>🔍 Auto-chunks content (~1000 chars per chunk)</p>
            <p>🏷️ Adds metadata: timestamps, keywords, indexing</p>
            <p>📊 Character count: {blueprint.knowledgeCompendium.length}</p>
            <p>📦 Estimated chunks: {Math.ceil(blueprint.knowledgeCompendium.length / 1000)}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-slate-50 rounded-lg">
        <h4 className="font-semibold text-slate-700 mb-2">Preview: Export Structure</h4>
        <div className="text-sm text-slate-600 space-y-1">
          <p>📄 <strong>IR Output:</strong> {blueprintName || 'blueprint'}-IR.md (Markdown format)</p>
          <p>📄 <strong>KCS Output:</strong> {blueprintName || 'blueprint'}-KCS.{blueprint.kcsFormat} (Chunked with metadata)</p>
          <p className="text-xs mt-2 text-slate-500">
            Each KCS chunk includes: id, content, metadata (chunkIndex, totalChunks, timestamp, characterCount, keywords)
          </p>
        </div>
      </div>
    </div>
  );
}
