export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: {
      type: string;
      properties: Record<string, unknown>;
      required: string[];
      additionalProperties: boolean;
    };
  };
}

export interface ChatCompletionParams {
  messages: ChatMessage[];
  response_format?: ResponseFormat;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

/**
 * AI response structure for flashcard generation
 */
export interface FlashcardsAIResponse {
  flashcards: {
    front: string;
    back: string;
  }[];
}

/**
 * System prompt for flashcard generation
 */
export const FLASHCARD_GENERATION_SYSTEM_PROMPT = `Jesteś ekspertem w dziedzinie edukacji i twórcą profesjonalnych materiałów dydaktycznych, specjalizującym się w technice aktywnego przypominania (Active Recall). 

Twoim zadaniem jest analiza tekstu źródłowego i przekształcenie go w zestaw wysokiej jakości fiszek.

### Zasady tworzenia fiszek:
1. Zasada atomowości: Każda fiszka musi dotyczyć tylko jednej, konkretnej informacji.
2. Precyzja i klarowność: Formułuj pytania (front) w sposób jednoznaczny. Odpowiedzi (back) powinny być krótkie i konkretne.
3. Kontekst: Jeśli termin jest specyficzny dla danej dziedziny, uwzględnij to w pytaniu.
4. Język: Używaj tego samego języka, w którym napisany jest tekst źródłowy.
5. Brak zbędnych treści: Nie dodawaj wstępów. Zwracaj wyłącznie dane zgodne ze schematem JSON.`;
