"use client";

import React, { useState } from "react";
import {
  Bot,
  Clock,
  History,
  Loader2,
  MessageSquare,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface QnaRecord {
  id: string;
  question: string;
  answer: string;
  updatedContent?: string;
  createdAt: Date | string;
}

interface QnaPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isProcessing: boolean;
  history: QnaRecord[];
  onSubmit: (question: string) => Promise<boolean>;
  onDelete: (qnaId: string) => void;
  onDeleteAll: () => void;
  title?: string;
  subtitle?: string;
  placeholder?: string;
  examples?: string[];
}

export function QnaPanel({
  open,
  onOpenChange,
  isProcessing,
  history,
  onSubmit,
  onDelete,
  onDeleteAll,
  title = "Ask a question",
  subtitle = "Modify your documentation",
  placeholder = "Which file contains authentication logic?",
  examples = [
    "Add API examples",
    "Update installation guide",
    "Add troubleshooting section",
  ],
}: QnaPanelProps) {
  const [questionValue, setQuestionValue] = useState("");

  const handleSubmit = async () => {
    const q = questionValue.trim();
    if (!q) return;
    const success = await onSubmit(q);
    if (success) setQuestionValue("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="min-w-[300px] sm:min-w-[400px] md:min-w-[500px] w-[90vw] sm:w-[400px] md:w-[500px] bg-black/30 border-l border-white/10 backdrop-blur-md px-2 sm:px-4"
      >
        <SheetHeader className="pb-4 sm:pb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-blue-500/20 border border-blue-500/30 rounded-lg w-8 h-8 sm:w-10 sm:h-10 shrink-0">
              <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg sm:text-xl md:text-2xl font-semibold text-white leading-tight mobile-no-truncate">
                {title}
              </SheetTitle>
              <SheetDescription className="text-white/60 text-xs sm:text-sm mt-1 mobile-no-truncate">
                {subtitle}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="pb-4 sm:pb-6 border-b border-white/10">
          <div className="space-y-4 sm:space-y-6">
            <textarea
              value={questionValue}
              onChange={(e) => setQuestionValue(e.target.value)}
              placeholder={placeholder}
              className="w-full h-[60px] sm:h-[80px] p-2 sm:p-3 bg-black/30 border border-white/20 rounded-lg resize-none text-sm sm:text-base text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mobile-no-truncate"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
            <Button
              onClick={handleSubmit}
              disabled={isProcessing || !questionValue.trim()}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 sm:py-3 rounded-lg transition-colors h-[40px] sm:h-[48px] text-sm sm:text-base font-medium"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin shrink-0" />
                  <span className="mobile-no-truncate">Processing...</span>
                </>
              ) : (
                <span className="mobile-no-truncate">Ask RepoDocs</span>
              )}
            </Button>
          </div>
        </div>

        <div className="flex-1 mt-4 sm:mt-6 overflow-hidden">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-1 sm:gap-2">
              <History className="h-3 w-3 sm:h-4 sm:w-4 text-white/60 shrink-0" />
              <h4 className="text-sm sm:text-base font-medium text-white/80 mobile-no-truncate">
                Recent questions
              </h4>
            </div>
            {history.length > 0 && (
              <Button
                onClick={onDeleteAll}
                variant="outline"
                size="sm"
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30 text-xs px-2 sm:px-3 py-1 h-6 sm:h-7"
              >
                <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 shrink-0" />
                <span className="mobile-no-truncate">Clear all</span>
              </Button>
            )}
          </div>

          <ScrollArea className="h-full max-h-[400px]">
            <div className="pr-4">
              {history.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {history.map((qna) => (
                    <div
                      key={qna.id}
                      className="bg-black/30 border border-white/10 rounded-lg p-3 sm:p-4"
                    >
                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-white/90 text-sm sm:text-base font-medium mb-1 mobile-no-truncate">
                              Your question:
                            </p>
                            <p className="text-white/70 text-sm sm:text-base wrap-break-word mobile-no-truncate">
                              {qna.question}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 sm:h-6 sm:w-6 p-0 text-white/50 hover:text-white/80 hover:bg-white/10 ml-1 sm:ml-2 shrink-0"
                              >
                                <MoreVertical className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="bg-gray-800 border-white/20"
                            >
                              <DropdownMenuItem
                                onClick={() => onDelete(qna.id)}
                                className="text-red-400 hover:bg-red-500/10 focus:bg-red-500/10"
                              >
                                <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 sm:mr-2" />
                                <span className="mobile-no-truncate">Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div>
                          <p className="text-white/90 text-sm sm:text-base font-medium mb-1 mobile-no-truncate">
                            AI response:
                          </p>
                          <p className="text-white/70 text-sm sm:text-base wrap-break-word mobile-no-truncate">
                            {qna.answer}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-2 text-xs text-white/50 pt-1 sm:pt-2 border-t border-white/10">
                          <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                          <span className="mobile-no-truncate">
                            {new Date(qna.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <div className="p-3 sm:p-4 bg-black/30 border border-white/20 rounded-2xl mb-3 sm:mb-4 inline-block">
                    <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-white/50" />
                  </div>
                  <h4 className="text-sm sm:text-base font-semibold text-white mb-2 mobile-no-truncate">
                    No questions yet
                  </h4>
                  <p className="text-white/60 text-xs sm:text-sm mb-3 sm:mb-4 mobile-no-truncate">
                    Ask questions to modify your documentation
                  </p>
                  <div className="space-y-1 text-xs text-white/50">
                    <p className="mobile-no-truncate">Try asking:</p>
                    {examples.map((example) => (
                      <p key={example} className="mobile-no-truncate">
                        &quot;{example}&quot;
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
