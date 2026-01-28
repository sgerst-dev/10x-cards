import { Bot, User, Sparkles } from "lucide-react";
import type { FlashcardSource } from "@/types";

export const sourceLabels: Record<FlashcardSource, string> = {
  ai_generated: "AI Generated",
  ai_edited: "AI Edited",
  user_created: "Manually created",
};

export const getSourceIcon = (source: FlashcardSource) => {
  // AI-generated flashcards get Robot icon
  if (source === "ai_generated") {
    return <Bot className="h-4 w-4" />;
  }
  // AI-edited flashcards get Sparkles icon
  if (source === "ai_edited") {
    return <Sparkles className="h-4 w-4" />;
  }
  // User-created flashcards get Person icon
  return <User className="h-4 w-4" />;
};
