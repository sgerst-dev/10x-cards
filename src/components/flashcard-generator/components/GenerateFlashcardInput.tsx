import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface GenerateFlashcardInputProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

const MIN_LENGTH = 1000;
const MAX_LENGTH = 10000;

export function GenerateFlashcardInput({ value, onChange, onGenerate, isLoading }: GenerateFlashcardInputProps) {
  const [showValidationError, setShowValidationError] = useState(false);

  const charCount = value.length;
  const isTooShort = charCount < MIN_LENGTH;
  const isTooLong = charCount > MAX_LENGTH;
  const isValid = charCount >= MIN_LENGTH && charCount <= MAX_LENGTH;

  const getValidationMessage = () => {
    if (!showValidationError) return null;

    if (isTooShort) {
      return `Tekst jest za krótki. Minimalnie ${MIN_LENGTH} znaków.`;
    }
    if (isTooLong) {
      return `Tekst jest za długi. Maksymalnie ${MAX_LENGTH} znaków.`;
    }
    return null;
  };

  const handleGenerate = () => {
    if (!isValid) {
      setShowValidationError(true);
      return;
    }
    setShowValidationError(false);
    onGenerate();
  };

  const handleChange = (newValue: string) => {
    onChange(newValue);
    // Resetuj błąd walidacji gdy użytkownik zaczyna pisać
    if (showValidationError) {
      setShowValidationError(false);
    }
  };

  const validationMessage = getValidationMessage();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          id="source-text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Wklej tutaj swoje notatki, artykuł lub dowolny tekst, z którego chcesz utworzyć fiszki..."
          className="h-[250px] resize-none"
          disabled={isLoading}
          aria-describedby={validationMessage ? "validation-message" : undefined}
        />
        <div className="flex items-center justify-end">
          <span className={`text-sm text-muted-foreground`}>
            {charCount.toLocaleString()} / {MAX_LENGTH.toLocaleString()}
          </span>
        </div>
      </div>

      {validationMessage && (
        <p id="validation-message" className="text-sm text-red-600">
          {validationMessage}
        </p>
      )}

      <div className="flex justify-end">
        <Button onClick={handleGenerate} disabled={isLoading} size="lg">
          {isLoading ? "Generowanie..." : "Generuj fiszki"}
        </Button>
      </div>
    </div>
  );
}
