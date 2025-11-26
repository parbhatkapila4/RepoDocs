"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useProjectsContext } from '@/context/ProjectsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  MessageSquare, 
  Sparkles,
  Loader2,
  FileCode,
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
    <div className="flex flex-col h-[calc(100vh-3rem)] sm:h-[calc(100vh-3rem)] lg:h-[calc(100vh-2rem)] p-2 sm:p-4 md:p-6 lg:p-6">
      {/* Header */}
      <div className="mb-2 sm:mb-2 lg:mb-3 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 lg:gap-3 mb-1">
          <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-3">
            <div className="p-1.5 sm:p-2 lg:p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex-shrink-0">
              <MessageSquare className="h-4 w-4 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Chat with Codebase</h1>
              <p className="text-gray-400 text-xs sm:text-xs lg:text-sm mt-0.5">
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
              className="border-gray-600 lg:border-gray-500 text-gray-300 hover:bg-gray-700 hover:text-white w-full sm:w-auto text-xs sm:text-xs lg:text-sm lg:px-3 lg:py-1.5"
            >
              <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 mr-1.5 sm:mr-1.5" />
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
            <div className="p-2 sm:p-3 lg:p-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[400px] sm:min-h-[500px] lg:min-h-[450px] text-center p-4 sm:p-8 lg:p-10 lg:pt-6">
                <div className="p-3 sm:p-4 lg:p-6 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 mb-3 sm:mb-4 lg:mb-4">
                  <Sparkles className="h-8 w-8 sm:h-12 sm:w-12 lg:h-14 lg:w-14 text-blue-400" />
                </div>
                <h3 className="text-lg sm:text-xl lg:text-3xl font-semibold text-white mb-2 lg:mb-2">
                  Start a Conversation
                </h3>
                <p className="text-gray-400 mb-4 sm:mb-6 lg:mb-6 max-w-md lg:max-w-xl text-sm sm:text-base lg:text-lg px-2">
                  Ask me anything about your codebase. I&apos;ll search through the code and provide detailed answers with references.
                </p>
                
                {/* Suggested Questions */}
                <div className="w-full max-w-2xl lg:max-w-4xl px-2 lg:px-4">
                  <p className="text-xs sm:text-sm lg:text-base text-gray-500 mb-2 sm:mb-3 lg:mb-4">Try asking:</p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-4">
                    {suggestedQuestions.map((q, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        className="text-left justify-start text-xs sm:text-sm lg:text-base text-gray-300 hover:text-white hover:bg-gray-800 h-auto py-2 sm:py-2.5 lg:py-4 px-3 sm:px-4 lg:px-5 border-gray-700 lg:border-gray-600"
                        onClick={() => setInput(q)}
                      >
                        <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 mr-1.5 sm:mr-2 lg:mr-3 flex-shrink-0" />
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
                className={`mb-3 sm:mb-4 lg:mb-4 ${
                  message.role === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                <div
                  className={`inline-block max-w-[90%] sm:max-w-[85%] lg:max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm p-2.5 sm:p-3 lg:p-3.5'
                      : 'bg-gray-800 text-white rounded-2xl rounded-tl-sm p-2.5 sm:p-3 lg:p-3.5 max-h-[800px] overflow-y-auto'
                  }`}
                >
                  <div className="prose prose-invert max-w-none prose-xs sm:prose-xs lg:prose-sm [&>*:last-child]:mb-0 [&_p]:text-xs sm:[&_p]:text-sm lg:[&_p]:text-sm [&_p]:leading-relaxed [&_pre]:text-xs sm:[&_pre]:text-xs lg:[&_pre]:text-sm [&_pre]:overflow-x-auto [&_pre]:py-2 [&_pre]:px-3 [&_code]:text-xs sm:[&_code]:text-xs lg:[&_code]:text-sm [&_ul]:text-xs sm:[&_ul]:text-sm lg:[&_ul]:text-sm [&_ol]:text-xs sm:[&_ol]:text-sm lg:[&_ol]:text-sm [&_li]:text-xs sm:[&_li]:text-sm lg:[&_li]:text-sm [&_h1]:text-sm sm:[&_h1]:text-base lg:[&_h1]:text-base [&_h2]:text-xs sm:[&_h2]:text-sm lg:[&_h2]:text-sm [&_h3]:text-xs sm:[&_h3]:text-xs lg:[&_h3]:text-sm">
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
                                fontSize: '0.7rem',
                                padding: '0.6rem',
                                margin: '0.4rem 0',
                                lineHeight: '1.4',
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
                    <div className="mt-2 sm:mt-3 lg:mt-3 pt-2 sm:pt-2 lg:pt-3 border-t border-gray-700 lg:border-gray-600">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                        <FileCode className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 text-gray-400 flex-shrink-0" />
                        <span className="text-xs sm:text-xs lg:text-sm font-medium text-gray-400">
                          Sources ({message.sources.length})
                        </span>
                      </div>
                      <div className="space-y-1.5 sm:space-y-1.5 lg:space-y-2">
                        {message.sources.map((source, idx) => (
                          <div
                            key={idx}
                            className="text-xs sm:text-xs lg:text-sm bg-gray-900/50 rounded p-2 sm:p-2 lg:p-2.5 border border-gray-700 lg:border-gray-600"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-1">
                              <code className="text-blue-400 break-all text-xs sm:text-xs lg:text-sm">{source.fileName}</code>
                              <Badge variant="outline" className="text-xs sm:text-xs lg:text-xs w-fit sm:w-auto">
                                {(source.similarity * 100).toFixed(0)}% match
                              </Badge>
                            </div>
                            <p className="text-gray-400 line-clamp-2 text-xs sm:text-xs lg:text-sm leading-snug">{source.summary}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="mb-3 sm:mb-4 lg:mb-4 text-left">
                <div className="inline-block max-w-[90%] sm:max-w-[85%] lg:max-w-[80%] bg-gray-800 text-white rounded-2xl rounded-tl-sm p-2.5 sm:p-3 lg:p-3.5">
                  <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-3">
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-4 lg:w-4 animate-spin text-blue-400 flex-shrink-0" />
                    <span className="text-xs sm:text-xs lg:text-sm">Searching codebase and generating response...</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t border-gray-800 p-2 sm:p-3 lg:p-4 lg:px-6 flex-shrink-0">
            <form onSubmit={handleSubmit} className="flex gap-1.5 sm:gap-2 lg:gap-3 lg:max-w-5xl lg:mx-auto">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about your codebase..."
                disabled={isLoading}
                className="flex-1 bg-gray-900 border-gray-700 lg:border-gray-600 text-white placeholder:text-gray-500 text-sm sm:text-sm lg:text-base h-9 sm:h-10 lg:h-12 lg:px-4"
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 h-9 sm:h-10 lg:h-12 w-9 sm:w-auto lg:w-auto px-2 sm:px-4 lg:px-6 flex-shrink-0 text-sm sm:text-sm lg:text-sm"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 lg:h-4 lg:w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4 lg:h-4 lg:w-4 sm:mr-0 lg:mr-2" />
                    <span className="hidden sm:inline lg:inline">Send</span>
                  </>
                )}
              </Button>
            </form>
            <p className="text-xs lg:text-xs text-gray-500 mt-1.5 sm:mt-1.5 lg:mt-2 px-0.5 lg:text-center lg:max-w-5xl lg:mx-auto">
              💡 Tip: Ask specific questions about how features work, architecture, or code patterns
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

