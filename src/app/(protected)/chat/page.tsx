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
    "How does authentication work in this project?",
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
    <div className="flex flex-col h-[calc(100vh-4rem)] p-2 sm:p-4 md:p-6">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
              <MessageSquare className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Chat with Codebase</h1>
              <p className="text-gray-400 text-sm">
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
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          )}
        </div>
      </div>

      {/* Chat Container */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4 h-full" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="p-4 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 mb-4">
                  <Sparkles className="h-12 w-12 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Start a Conversation
                </h3>
                <p className="text-gray-400 mb-6 max-w-md">
                  Ask me anything about your codebase. I'll search through the code and provide detailed answers with references.
                </p>
                
                {/* Suggested Questions */}
                <div className="w-full max-w-2xl">
                  <p className="text-sm text-gray-500 mb-3">Try asking:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {suggestedQuestions.map((q, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        className="text-left justify-start text-sm text-gray-300 hover:text-white hover:bg-gray-800"
                        onClick={() => setInput(q)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                        {q}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-6 ${
                  message.role === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                <div
                  className={`inline-block max-w-[85%] ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm p-4'
                      : 'bg-gray-800 text-white rounded-2xl rounded-tl-sm p-4 max-h-[600px] overflow-y-auto'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2 text-blue-400 sticky top-0 bg-gray-800 pb-2 -mt-4 pt-4 -mx-4 px-4 z-10">
                      <Bot className="h-4 w-4" />
                      <span className="text-xs font-medium">AI Assistant</span>
                    </div>
                  )}
                  
                  <div className="prose prose-invert max-w-none prose-sm [&>*:last-child]:mb-0">
                    <ReactMarkdown
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
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
                    <div className="mt-4 pt-3 border-t border-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <FileCode className="h-4 w-4 text-gray-400" />
                        <span className="text-xs font-medium text-gray-400">
                          Sources ({message.sources.length})
                        </span>
                      </div>
                      <div className="space-y-2">
                        {message.sources.map((source, idx) => (
                          <div
                            key={idx}
                            className="text-xs bg-gray-900/50 rounded p-2 border border-gray-700"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <code className="text-blue-400">{source.fileName}</code>
                              <Badge variant="outline" className="text-xs">
                                {(source.similarity * 100).toFixed(0)}% match
                              </Badge>
                            </div>
                            <p className="text-gray-400 line-clamp-2">{source.summary}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className={`text-xs text-gray-500 mt-2 ${
                    message.role === 'assistant' 
                      ? 'sticky bottom-0 bg-gray-800 pt-2 -mb-4 pb-4 -mx-4 px-4'
                      : ''
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="mb-6 text-left">
                <div className="inline-block max-w-[85%] bg-gray-800 text-white rounded-2xl rounded-tl-sm p-4">
                  <div className="flex items-center gap-2 mb-2 text-blue-400">
                    <Bot className="h-4 w-4" />
                    <span className="text-xs font-medium">AI Assistant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Searching codebase and generating response...</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Input */}
          <div className="border-t border-gray-800 p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about your codebase..."
                disabled={isLoading}
                className="flex-1 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
            <p className="text-xs text-gray-500 mt-2">
              💡 Tip: Ask specific questions about how features work, architecture, or code patterns
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

