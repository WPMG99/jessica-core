'use client';

import { useState, useEffect } from 'react';
import { getStatus, StatusResponse } from '@/lib/api';

interface ServiceStatus {
  name: string;
  key: keyof StatusResponse;
  description: string;
  port?: number;
}

const services: ServiceStatus[] = [
  { 
    name: 'Ollama (Dolphin)', 
    key: 'local_ollama', 
    description: 'Local LLM for standard tasks',
    port: 11434
  },
  { 
    name: 'Memory Server', 
    key: 'local_memory', 
    description: 'ChromaDB vector storage',
    port: 5001
  },
  { 
    name: 'Claude API', 
    key: 'claude_api', 
    description: 'Complex reasoning tasks'
  },
  { 
    name: 'Grok API', 
    key: 'grok_api', 
    description: 'Research and real-time info'
  },
  { 
    name: 'Gemini API', 
    key: 'gemini_api', 
    description: 'Quick lookups and documents'
  },
  { 
    name: 'Mem0 API', 
    key: 'mem0_api', 
    description: 'Cloud memory sync'
  },
];

function StatusCard({ service, status }: { service: ServiceStatus; status: boolean | null }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium text-white">{service.name}</h3>
        <div className="flex items-center gap-2">
          {status === null ? (
            <div className="w-3 h-3 rounded-full bg-zinc-600 animate-pulse" />
          ) : status ? (
            <div className="w-3 h-3 rounded-full status-online" />
          ) : (
            <div className="w-3 h-3 rounded-full status-offline" />
          )}
          <span className={`text-xs font-medium ${
            status === null ? 'text-zinc-500' : 
            status ? 'text-green-400' : 'text-red-400'
          }`}>
            {status === null ? 'Checking...' : status ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
      <p className="text-sm text-zinc-500">{service.description}</p>
      {service.port && (
        <p className="text-xs text-zinc-600 mt-1">Port: {service.port}</p>
      )}
    </div>
  );
}

export default function StatusPage() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkStatus = async () => {
    setError(null);
    try {
      const result = await getStatus();
      setStatus(result);
      setLastChecked(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check status');
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const onlineCount = status 
    ? Object.values(status).filter(Boolean).length 
    : 0;
  const totalCount = services.length;

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">System Status</h1>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-zinc-400">
              {onlineCount} of {totalCount} services online
            </span>
            {lastChecked && (
              <span className="text-zinc-600">
                Last checked: {lastChecked.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={checkStatus}
              className="text-red-500 hover:text-red-400 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-800 rounded-xl p-4 text-red-400">
            <p className="font-medium">Connection Error</p>
            <p className="text-sm mt-1">{error}</p>
            <p className="text-xs text-red-500 mt-2">
              Make sure the backend is running at http://localhost:8000
            </p>
          </div>
        )}

        {/* Status grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((service) => (
            <StatusCard
              key={service.key}
              service={service}
              status={status ? status[service.key] : null}
            />
          ))}
        </div>

        {/* Architecture info */}
        <div className="mt-8 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Routing Architecture</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-emerald-400 font-mono w-24 shrink-0">Local</span>
              <span className="text-zinc-400">Standard tasks → Dolphin (dolphin-llama3:8b)</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-orange-400 font-mono w-24 shrink-0">Claude</span>
              <span className="text-zinc-400">Complex reasoning → analyze, strategy, plan, architecture</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-400 font-mono w-24 shrink-0">Grok</span>
              <span className="text-zinc-400">Research → current events, news, web lookups</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-purple-400 font-mono w-24 shrink-0">Gemini</span>
              <span className="text-zinc-400">Quick lookups → definitions, document summaries</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-zinc-600 text-sm">
          <p>Jessica Core v2.0 • For the forgotten 99%, we rise.</p>
        </div>
      </div>
    </div>
  );
}

