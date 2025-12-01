"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useProjectsContext } from '@/context/ProjectsContext';
import { useUser } from '@/hooks/useUser';
import { Button } from "@/components/ui/button";
import { 
  Send, 
  Loader2,
  FileCode,
  ChevronDown,
  Lightbulb,
  Code2,
  Search,
  Wand2,
  Check,
  Plus,
  Github
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: {
    fileName: string;
    similarity: number;
    summary: string;
  }[];
  timestamp: Date;
}

const models = [
  { id: 'repodoc-v1', name: 'RepoDoc AI', description: 'Optimized for code analysis' },
  { id: 'repodoc-fast', name: 'RepoDoc Fast', description: 'Quick responses' },
];

const actionButtons = [
  { icon: Lightbulb, label: 'Explain Code', color: 'text-amber-400' },
  { icon: Code2, label: 'Refactor', color: 'text-blue-400' },
  { icon: Search, label: 'Deep Search', color: 'text-purple-400' },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function ChatPage() {
  const { projects, selectedProjectId } = useProjectsContext();
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentProject = projects.find(p => p.id === selectedProjectId);
  const userName = user?.firstName || user?.emailAddress?.split('@')[0] || 'Developer';

  // Auto-scroll to bottom when new messages arrive
  const prevMessagesLengthRef = useRef(messages.length);
  
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || !currentProject || isLoading) {
      return;
    }

    const question = input.trim();
    setInput('');

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Build conversation history
      const conversationHistory = messages.slice(-4).map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: currentProject.id,
          question,
          conversationHistory,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get response');
      }

      const data = await response.json();

      // Add assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error querying codebase:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to get response');

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ Sorry, I encountered an error processing your question. Please try again.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleActionClick = (action: string) => {
    const actionPrompts: Record<string, string> = {
      'Explain Code': 'Explain how the main components work in this project',
      'Refactor': 'Suggest refactoring improvements for the codebase',
      'Deep Search': 'Search through the codebase for authentication patterns',
    };
    setInput(actionPrompts[action] || '');
    inputRef.current?.focus();
  };

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f] px-4">
        <div className="text-center p-6 sm:p-8 max-w-md">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Wand2 className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2 sm:mb-3">No Project Selected</h2>
          <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
            Please select a project from the sidebar to start chatting with your codebase
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f] overflow-hidden">
      {/* Header Bar */}
      <div className="flex-shrink-0 pt-3 sm:pt-4 pb-2 px-3 sm:px-4">
        <div className="flex items-center justify-between sm:justify-center sm:relative gap-2">
          {/* Model Selector - Center on desktop, left on mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="bg-white/5 border-white/10 hover:bg-white/10 text-white shadow-lg rounded-xl px-2.5 sm:px-4 py-2 h-auto gap-1.5 sm:gap-2 backdrop-blur-sm"
              >
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Wand2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                </div>
                <span className="font-medium text-sm sm:text-base">{selectedModel.name}</span>
                <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-[#16161d] border-white/10 shadow-2xl rounded-xl p-1 sm:align-center">
              {models.map((model) => (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => setSelectedModel(model)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-white/5 focus:bg-white/5"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Wand2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm">{model.name}</p>
                    <p className="text-xs text-gray-500">{model.description}</p>
                  </div>
                  {selectedModel.id === model.id && (
                    <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* New Chat Button - Right side */}
          <Button
            variant="outline"
            onClick={() => {
              setMessages([]);
              setInput('');
              toast.success('Started a new chat!');
            }}
            className="sm:absolute sm:right-0 bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-xl px-2.5 sm:px-3 py-2 h-auto gap-1 sm:gap-1.5 backdrop-blur-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-medium">New</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {messages.length === 0 ? (
          /* Empty State - Welcome Screen */
          <div className="flex-1 flex flex-col items-center justify-center px-3 sm:px-4 pb-4 sm:pb-8">
            {/* Decorative Gradient Blob */}
            <div className="relative mb-4 sm:mb-6">
              <div className="w-20 h-20 sm:w-28 md:w-36 sm:h-28 md:h-36 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-600 opacity-70 blur-xl animate-pulse" />
              <div className="absolute inset-0 w-20 h-20 sm:w-28 md:w-36 sm:h-28 md:h-36 rounded-full bg-gradient-to-tr from-blue-500 via-indigo-600 to-purple-600 opacity-50 blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />
              <div className="absolute inset-2 sm:inset-3 md:inset-5 rounded-full bg-gradient-to-br from-indigo-400 via-purple-500 to-blue-500 opacity-90 shadow-lg shadow-purple-500/30" />
            </div>

            {/* Greeting */}
            <div className="text-center mb-6 sm:mb-10 md:mb-12 px-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-1.5 sm:mb-2 tracking-tight">
                {getGreeting()}, {userName}
              </h1>
              <p className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-semibold">
                <span className="text-white">How Can I </span>
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Assist You Today?
                </span>
              </p>
            </div>

            {/* Input Area */}
            <div className="w-full max-w-3xl mx-auto px-2 sm:px-4">
              <form onSubmit={handleSubmit} className="relative">
                <div className="relative bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-2xl shadow-black/20 border border-white/10 overflow-hidden">
                  <div className="flex items-start p-2 sm:p-3">
                    <div className="flex-shrink-0 p-2 sm:p-2.5 mt-0.5">
                      <Github className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                    </div>
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask about your codebase..."
                      disabled={isLoading}
                      rows={1}
                      className="flex-1 bg-transparent border-none outline-none resize-none py-2.5 sm:py-3 px-1 sm:px-2 text-white placeholder:text-gray-500 text-sm sm:text-base min-h-[44px] sm:min-h-[52px] max-h-[120px] sm:max-h-[140px]"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isLoading || !input.trim()}
                      className="flex-shrink-0 m-1.5 sm:m-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg sm:rounded-xl h-9 w-9 sm:h-10 sm:w-10 p-0 shadow-lg shadow-indigo-500/25"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 sm:py-4 border-t border-white/5 overflow-x-auto scrollbar-hide">
                    {actionButtons.map((action, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleActionClick(action.label)}
                        className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/5 hover:border-white/10 whitespace-nowrap flex-shrink-0"
                      >
                        <action.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${action.color}`} />
                        <span>{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </form>

            </div>
          </div>
        ) : (
          /* Chat Messages */
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto min-h-0"
            style={{ scrollBehavior: 'smooth' }}
          >
            <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[92%] sm:max-w-[85%] ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl rounded-tr-md px-3 sm:px-4 py-2.5 sm:py-3 shadow-lg shadow-indigo-500/20'
                        : 'bg-white/5 backdrop-blur-sm text-white rounded-2xl rounded-tl-md px-3 sm:px-4 py-2.5 sm:py-3 shadow-lg shadow-black/20 border border-white/10'
                    }`}
                  >
                    <div className="prose prose-sm prose-invert max-w-none [&>*:last-child]:mb-0 text-sm sm:text-base">
                      <ReactMarkdown
                        components={{
                          code({ inline, className, children, ...props }: { inline?: boolean; className?: string; children?: React.ReactNode }) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                customStyle={{
                                  fontSize: '0.75rem',
                                  padding: '0.5rem',
                                  margin: '0.5rem 0',
                                  borderRadius: '0.5rem',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  background: 'rgba(0,0,0,0.3)',
                                  overflowX: 'auto',
                                }}
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={`${className} bg-white/10 text-indigo-300 px-1 sm:px-1.5 py-0.5 rounded text-xs sm:text-sm break-all`} {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>

                    {/* Sources */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-white/10">
                        <div className="flex items-center gap-1.5 mb-2">
                          <FileCode className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400" />
                          <span className="text-[10px] sm:text-xs font-medium text-gray-400">
                            Sources ({message.sources.length})
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {message.sources.map((source, idx) => (
                            <div
                              key={idx}
                              className="text-[10px] sm:text-xs bg-black/20 rounded-lg p-1.5 sm:p-2 border border-white/5"
                            >
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <code className="text-indigo-400 font-medium truncate text-[10px] sm:text-xs">{source.fileName}</code>
                                <span className="flex-shrink-0 text-[10px] sm:text-xs text-gray-500 bg-white/5 px-1 sm:px-1.5 py-0.5 rounded">
                                  {(source.similarity * 100).toFixed(0)}%
                                </span>
                              </div>
                              <p className="text-gray-500 line-clamp-2">{source.summary}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[92%] sm:max-w-[85%] bg-white/5 backdrop-blur-sm text-white rounded-2xl rounded-tl-md px-3 sm:px-4 py-2.5 sm:py-3 shadow-lg shadow-black/20 border border-white/10">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                      <span className="text-xs sm:text-sm text-gray-400">Analyzing codebase...</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Scroll anchor */}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          </div>
        )}

        {/* Input Area - When Messages Exist */}
        {messages.length > 0 && (
          <div className="flex-shrink-0 border-t border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl p-2.5 sm:p-4">
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
              <div className="relative bg-white/5 backdrop-blur-xl rounded-xl shadow-2xl shadow-black/20 border border-white/10 overflow-hidden">
                <div className="flex items-center p-1.5 sm:p-2">
                  <div className="flex-shrink-0 p-1.5 sm:p-2">
                    <Github className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                  </div>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a follow-up question..."
                    disabled={isLoading}
                    rows={1}
                    className="flex-1 bg-transparent border-none outline-none resize-none py-2 px-1 sm:px-2 text-white placeholder:text-gray-500 text-sm min-h-[36px] sm:min-h-[40px] max-h-[80px] sm:max-h-[100px]"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isLoading || !input.trim()}
                    className="flex-shrink-0 m-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg h-8 w-8 p-0 shadow-lg shadow-indigo-500/25"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
