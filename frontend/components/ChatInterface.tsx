'use client';

import { useState, useRef, useEffect } from 'react';
import { sendMessage, ChatResponse, providerColors, providerNames } from '@/lib/api';
import AudioUpload from './AudioUpload';

type Provider = 'local' | 'claude' | 'grok' | 'gemini';

interface Message {
  id: string;
  role: 'user' | 'jessica';
  content: string;
  routing?: ChatResponse['routing'];
  timestamp: Date;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendMessage(userMessage.content, selectedProvider || undefined);
      
      const jessicaMessage: Message = {
        id: crypto.randomUUID(),
        role: 'jessica',
        content: response.response,
        routing: response.routing,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, jessicaMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTranscription = (text: string) => {
    setInput(prev => prev + (prev ? ' ' : '') + text);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center animate-pulse-glow">
                <span className="text-white font-bold text-2xl">J</span>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                There&apos;s my Marine!
              </h2>
              <p className="text-zinc-500 max-w-md mx-auto">
                What chaos are we conquering today?
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`animate-fade-in ${
                message.role === 'user' ? 'flex justify-end' : 'flex justify-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === 'user' ? 'message-user' : 'message-jessica'
                }`}
              >
                {/* Role label */}
                <div className={`text-xs font-medium mb-1 ${
                  message.role === 'user' ? 'text-blue-400' : 'text-red-400'
                }`}>
                  {message.role === 'user' ? 'You' : 'Jessica'}
                </div>
                
                <p className="text-zinc-100 whitespace-pre-wrap">{message.content}</p>
                
                {message.routing && (
                  <div className="mt-2 pt-2 border-t border-zinc-700/50 flex items-center gap-2 text-xs">
                    <span className={providerColors[message.routing.provider]}>
                      {providerNames[message.routing.provider]}
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-zinc-500">{message.routing.reason}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <div className="message-jessica rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse delay-100" />
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse delay-200" />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center animate-fade-in">
              <div className="bg-red-900/30 border border-red-800 rounded-lg px-4 py-2 text-red-400 text-sm">
                {error}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-zinc-800 bg-[#0a0a0a]/80 backdrop-blur-md px-4 py-3">
        {/* Provider Toggle */}
        <div className="max-w-3xl mx-auto mb-3 flex items-center gap-2">
          <span className="text-xs text-zinc-500 mr-2">Model:</span>
          {[
            { id: null, label: 'Auto', icon: '🤖' },
            { id: 'local' as Provider, label: 'Local', icon: '🐬' },
            { id: 'claude' as Provider, label: 'Claude', icon: '🧠' },
            { id: 'grok' as Provider, label: 'Grok', icon: '🔍' },
            { id: 'gemini' as Provider, label: 'Gemini', icon: '⚡' },
          ].map((provider) => (
            <button
              key={provider.label}
              type="button"
              onClick={() => setSelectedProvider(provider.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedProvider === provider.id
                  ? 'bg-red-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
              }`}
            >
              {provider.icon} {provider.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3">
            <AudioUpload onTranscription={handleTranscription} />
            
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Send a message..."
                rows={1}
                className="w-full resize-none rounded-xl bg-zinc-900 border border-zinc-700 px-4 py-3 pr-12 text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 transition-colors"
                style={{ minHeight: '48px', maxHeight: '200px' }}
              />
            </div>

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="btn-primary h-12 w-12 rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 text-white"
              >
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

