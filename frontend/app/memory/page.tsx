'use client';

import { useState, useEffect } from 'react';
import { searchMemories, getAllMemories, MemorySearchResult } from '@/lib/api';

interface Memory {
  memory: string;
  score?: number;
  metadata?: Record<string, unknown>;
}

export default function MemoryPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'all' | 'search'>('all');

  const loadAllMemories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAllMemories();
      setMemories(result.results || []);
      setMode('all');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load memories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadAllMemories();
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await searchMemories(searchQuery);
      setMemories(result.results || []);
      setMode('search');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllMemories();
  }, []);

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Memory Bank</h1>
          <p className="text-zinc-400">
            Browse and search Jessica&apos;s cloud memories (Mem0)
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memories..."
              className="flex-1 rounded-xl bg-zinc-900 border border-zinc-700 px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary px-6 py-3 rounded-xl font-medium text-white disabled:opacity-50"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
            {mode === 'search' && (
              <button
                type="button"
                onClick={loadAllMemories}
                className="px-4 py-3 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-800 rounded-xl p-4 text-red-400">
            <p>{error}</p>
          </div>
        )}

        {/* Results info */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            {mode === 'search' 
              ? `Found ${memories.length} memories matching "${searchQuery}"`
              : `${memories.length} total memories`
            }
          </p>
          <button
            onClick={loadAllMemories}
            disabled={isLoading}
            className="text-sm text-red-500 hover:text-red-400 transition-colors disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {/* Memory list */}
        <div className="space-y-3">
          {isLoading && memories.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-zinc-500">Loading memories...</p>
            </div>
          ) : memories.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900/50 rounded-xl border border-zinc-800">
              <p className="text-zinc-500">No memories found</p>
              {mode === 'search' && (
                <p className="text-sm text-zinc-600 mt-2">
                  Try a different search term
                </p>
              )}
            </div>
          ) : (
            memories.map((memory, index) => (
              <div
                key={index}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors animate-fade-in"
              >
                <p className="text-zinc-200 whitespace-pre-wrap text-sm">
                  {memory.memory}
                </p>
                {memory.score !== undefined && (
                  <div className="mt-3 pt-3 border-t border-zinc-800">
                    <span className="text-xs text-zinc-600">
                      Relevance: {(memory.score * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
                {memory.metadata && Object.keys(memory.metadata).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(memory.metadata).map(([key, value]) => (
                      <span
                        key={key}
                        className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded"
                      >
                        {key}: {String(value)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Info */}
        <div className="mt-8 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-3">About Memories</h2>
          <div className="text-sm text-zinc-400 space-y-2">
            <p>
              Jessica stores conversations in two places:
            </p>
            <ul className="list-disc list-inside space-y-1 text-zinc-500">
              <li><strong className="text-zinc-400">Local ChromaDB:</strong> Fast vector storage on your machine</li>
              <li><strong className="text-zinc-400">Mem0 Cloud:</strong> Cross-device sync (shown here)</li>
            </ul>
            <p className="text-zinc-600 mt-4">
              Both are queried when you chat, and relevant context is included automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

