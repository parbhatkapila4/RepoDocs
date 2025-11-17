"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useProjectsContext } from '@/context/ProjectsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Send, 
  MessageSquare, 
  Code2, 
  Sparkles,
  AlertCircle,
  Loader2,
  FileCode,
  Bot,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

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

export default function ChatPage() {
  const { projects, selectedProjectId } = useProjectsContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentProject = projects.find(p => p.id === selectedProjectId);

  // Auto-scroll to bottom when new messages arrive
  const prevMessagesLengthRef = useRef(messages.length);
  
  useEffect(() => {
    // Only auto-scroll if a new message was actually added
    if (messages.length > prevMessagesLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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

  const suggestedQuestions = [
    "how does auth works in this project?",
    "Explain the database schema",
    "What API endpoints are available?",
    "How is error handling implemented?",
    "What's the folder structure?",
  ];

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">No Project Selected</CardTitle>
            <CardDescription className="text-center">
              Please select a project to start chatting with your codebase
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] sm:h-[calc(100vh-4rem)] p-2 sm:p-4 md:p-6">
      {/* Header */}
      <div className="mb-3 sm:mb-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex-shrink-0">
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold text-white">Chat with Codebase</h1>
              <p className="text-gray-400 text-xs sm:text-sm">
                Ask questions about <span className="text-white font-medium">{currentProject.name}</span>
              </p>
            </div>
          </div>
          
          {/* New Chat Button */}
          {messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMessages([]);
                setInput('');
                toast.success('Chat cleared! Start a new conversation.');
              }}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white w-full sm:w-auto text-xs sm:text-sm"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="sm:inline">New Chat</span>
            </Button>
          )}
        </div>
      </div>

      {/* Chat Container */}
      <Card className="flex-1 flex flex-col overflow-hidden min-h-0">
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden min-h-0">
          {/* Messages */}
          <ScrollArea className="flex-1 min-h-0" ref={scrollRef}>
            <div className="p-2 sm:p-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[400px] sm:min-h-[500px] text-center p-4 sm:p-8">
                <div className="p-3 sm:p-4 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 mb-3 sm:mb-4">
                  <Sparkles className="h-8 w-8 sm:h-12 sm:w-12 text-blue-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                  Start a Conversation
                </h3>
                <p className="text-gray-400 mb-4 sm:mb-6 max-w-md text-sm sm:text-base px-2">
                  Ask me anything about your codebase. I&apos;ll search through the code and provide detailed answers with references.
                </p>
                
                {/* Suggested Questions */}
                <div className="w-full max-w-2xl px-2">
                  <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">Try asking:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {suggestedQuestions.map((q, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        className="text-left justify-start text-xs sm:text-sm text-gray-300 hover:text-white hover:bg-gray-800 h-auto py-2 sm:py-2.5 px-3 sm:px-4"
                        onClick={() => setInput(q)}
                      >
                        <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                        <span className="break-words">{q}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 sm:mb-6 ${
                  message.role === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                <div
                  className={`inline-block max-w-[90%] sm:max-w-[85%] ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm p-3 sm:p-4'
                      : 'bg-gray-800 text-white rounded-2xl rounded-tl-sm p-3 sm:p-4 max-h-[600px] overflow-y-auto'
                  }`}
                >
                  <div className="prose prose-invert max-w-none prose-xs sm:prose-sm [&>*:last-child]:mb-0 [&_pre]:text-xs sm:[&_pre]:text-sm [&_pre]:overflow-x-auto [&_code]:text-xs sm:[&_code]:text-sm">
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
                                padding: '0.75rem',
                                margin: '0.5rem 0',
                              }}
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
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
                    <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-700">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                        <FileCode className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                        <span className="text-xs font-medium text-gray-400">
                          Sources ({message.sources.length})
                        </span>
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        {message.sources.map((source, idx) => (
                          <div
                            key={idx}
                            className="text-xs bg-gray-900/50 rounded p-2 border border-gray-700"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-1">
                              <code className="text-blue-400 break-all text-xs">{source.fileName}</code>
                              <Badge variant="outline" className="text-xs w-fit sm:w-auto">
                                {(source.similarity * 100).toFixed(0)}% match
                              </Badge>
                            </div>
                            <p className="text-gray-400 line-clamp-2 text-xs">{source.summary}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="mb-4 sm:mb-6 text-left">
                <div className="inline-block max-w-[90%] sm:max-w-[85%] bg-gray-800 text-white rounded-2xl rounded-tl-sm p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-blue-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Searching codebase and generating response...</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t border-gray-800 p-2 sm:p-4 flex-shrink-0">
            <form onSubmit={handleSubmit} className="flex gap-1.5 sm:gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about your codebase..."
                disabled={isLoading}
                className="flex-1 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 text-sm sm:text-base h-9 sm:h-10"
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 h-9 sm:h-10 w-9 sm:w-auto px-2 sm:px-4 flex-shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4 sm:mr-0" />
                    <span className="hidden sm:inline ml-2">Send</span>
                  </>
                )}
              </Button>
            </form>
            <p className="text-xs text-gray-500 mt-1.5 sm:mt-2 px-0.5">
              💡 Tip: Ask specific questions about how features work, architecture, or code patterns
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

