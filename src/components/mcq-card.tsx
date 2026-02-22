'use client';

import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MCQCardProps {
  question: string;
  options: string[];
  onAnswer: (answer: string) => void;
  answered?: string;
}

/**
 * A premium, Apple-styled MCQ card for AI interaction.
 * 
 * @param question - The question text
 * @param options - Array of possible answers
 * @param onAnswer - Callback when an option is selected
 * @param answered - The already selected answer, if any (locks the card)
 */
export function MCQCard({
  question,
  options,
  onAnswer,
  answered
}: MCQCardProps) {
  const [selected, setSelected] = React.useState<string | null>(answered ?? null);

  // Synchronize internal state with the answered prop if it changes
  React.useEffect(() => {
    if (answered) {
      setSelected(answered);
    }
  }, [answered]);

  const handleSelect = (opt: string): void => {
    if (answered) return;
    setSelected(opt);
    onAnswer(opt);
  };

  return (
    <div className="w-full max-w-xl mx-auto my-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="relative group overflow-hidden rounded-[2.5rem] bg-white/70 dark:bg-card/40 backdrop-blur-2xl border border-border/50 shadow-2xl shadow-primary/5 transition-all duration-500 hover:shadow-primary/10 hover:border-primary/20">
        {/* Accent Background Glow */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-700" />

        <div className="relative p-8 md:p-10 space-y-8">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <HelpCircle className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">Interaction Required</span>
              <h3 className="text-xl md:text-2xl font-bold tracking-tight text-foreground leading-tight">
                {question}
              </h3>
            </div>
          </div>

          {/* Options Grid */}
          <div className="grid gap-3">
            {options.map((opt, i) => {
              const isSelected = selected === opt;
              const isLocked = !!answered;

              return (
                <Button
                  key={i}
                  variant={isSelected ? "default" : "ghost"}
                  onClick={() => handleSelect(opt)}
                  disabled={isLocked}
                  className={cn(
                    "relative w-full h-auto justify-start p-4 md:p-5 rounded-2xl border transition-all duration-300 group/btn",
                    isSelected
                      ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 hover:text-primary-foreground"
                      : "bg-white/50 dark:bg-white/5 border-border/40 hover:border-primary/40 hover:bg-white dark:hover:bg-white/10 text-foreground/80 hover:text-foreground",
                    isLocked && !isSelected && "opacity-50 grayscale-[0.5]"
                  )}
                >
                  <div className="flex items-center gap-4 w-full">
                    <div className={cn(
                      "flex-shrink-0 w-6 h-6 flex items-center justify-center",
                      isSelected ? "text-primary-foreground" : "text-primary/40 group-hover/btn:text-primary transition-colors"
                    )}>
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </div>

                    <div className="flex flex-col items-start min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-wider",
                          isSelected ? "text-primary-foreground/70" : "text-muted-foreground/60"
                        )}>
                          Option {String.fromCharCode(65 + i)}
                        </span>
                      </div>
                      <span className="text-base font-medium truncate w-full text-left">
                        {opt}
                      </span>
                    </div>

                    {isSelected && (
                      <div className="ml-auto animate-in zoom-in duration-300">
                        <div className="px-2 py-0.5 rounded-full bg-primary-foreground/20 text-[9px] font-bold uppercase tracking-wider">
                          Selected
                        </div>
                      </div>
                    )}
                  </div>
                </Button>
              );
            })}
          </div>

          {/* Optional Footer/Hint */}
          {answered && (
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground/40 animate-in fade-in duration-1000">
              Selection Locked
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
