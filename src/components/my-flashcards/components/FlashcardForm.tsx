import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FlashcardFormData, FlashcardFormErrors } from "../types";

interface FlashcardFormProps {
  initialData?: FlashcardFormData;
  onSubmit: (data: FlashcardFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const MAX_FRONT_LENGTH = 250;
const MAX_BACK_LENGTH = 500;

export function FlashcardForm({ initialData, onSubmit, onCancel, isSubmitting }: FlashcardFormProps) {
  const [formData, setFormData] = useState<FlashcardFormData>({
    front: initialData?.front || "",
    back: initialData?.back || "",
  });

  const [errors, setErrors] = useState<FlashcardFormErrors>({});
  const [touched, setTouched] = useState<Record<keyof FlashcardFormData, boolean>>({
    front: false,
    back: false,
  });

  // Validate field
  const validateField = (field: keyof FlashcardFormData, value: string): string | undefined => {
    const trimmedValue = value.trim();

    if (field === "front") {
      if (trimmedValue.length === 0) {
        return "Tekst na przedniej stronie fiszki jest wymagany";
      }
      if (value.length > MAX_FRONT_LENGTH) {
        return `Tekst przekracza maksymalną długość ${MAX_FRONT_LENGTH} znaków`;
      }
    }

    if (field === "back") {
      if (trimmedValue.length === 0) {
        return "Tekst na tylnej stronie fiszki jest wymagany";
      }
      if (value.length > MAX_BACK_LENGTH) {
        return `Tekst przekracza maksymalną długość ${MAX_BACK_LENGTH} znaków`;
      }
    }

    return undefined;
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors: FlashcardFormErrors = {
      front: validateField("front", formData.front),
      back: validateField("back", formData.back),
    };

    setErrors(newErrors);
    return !newErrors.front && !newErrors.back;
  };

  // Handle field change
  const handleChange = (field: keyof FlashcardFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Validate on change if field was touched
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  // Handle field blur
  const handleBlur = (field: keyof FlashcardFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({ front: true, back: true });

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  // Check if form is valid
  const isValid =
    formData.front.trim().length > 0 &&
    formData.front.length <= MAX_FRONT_LENGTH &&
    formData.back.trim().length > 0 &&
    formData.back.length <= MAX_BACK_LENGTH;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="front">
          Przód fiszki <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="front"
          value={formData.front}
          onChange={(e) => handleChange("front", e.target.value)}
          onBlur={() => handleBlur("front")}
          placeholder="Wprowadź tekst na przedniej stronie fiszki..."
          className={`min-h-[100px] resize-none ${errors.front && touched.front ? "border-destructive" : ""}`}
          disabled={isSubmitting}
          aria-invalid={!!errors.front && touched.front}
          aria-describedby={errors.front && touched.front ? "front-error" : "front-count"}
          data-testid="front-textarea"
        />
        <div className="flex items-center justify-between text-xs">
          {errors.front && touched.front ? (
            <span id="front-error" className="text-destructive">
              {errors.front}
            </span>
          ) : (
            <span className="text-muted-foreground">Wymagane</span>
          )}
          <span
            id="front-count"
            className={`${formData.front.length > MAX_FRONT_LENGTH ? "text-destructive" : "text-muted-foreground"}`}
          >
            {formData.front.length}/{MAX_FRONT_LENGTH}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="back">
          Tył fiszki <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="back"
          value={formData.back}
          onChange={(e) => handleChange("back", e.target.value)}
          onBlur={() => handleBlur("back")}
          placeholder="Wprowadź tekst na tylnej stronie fiszki..."
          className={`min-h-[120px] resize-none ${errors.back && touched.back ? "border-destructive" : ""}`}
          disabled={isSubmitting}
          aria-invalid={!!errors.back && touched.back}
          aria-describedby={errors.back && touched.back ? "back-error" : "back-count"}
          data-testid="back-textarea"
        />
        <div className="flex items-center justify-between text-xs">
          {errors.back && touched.back ? (
            <span id="back-error" className="text-destructive">
              {errors.back}
            </span>
          ) : (
            <span className="text-muted-foreground">Wymagane</span>
          )}
          <span
            id="back-count"
            className={`${formData.back.length > MAX_BACK_LENGTH ? "text-destructive" : "text-muted-foreground"}`}
          >
            {formData.back.length}/{MAX_BACK_LENGTH}
          </span>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} data-testid="cancel-button">
          Anuluj
        </Button>
        <Button type="submit" disabled={!isValid || isSubmitting} data-testid="save-button">
          {isSubmitting ? "Zapisywanie..." : "Zapisz"}
        </Button>
      </div>
    </form>
  );
}
