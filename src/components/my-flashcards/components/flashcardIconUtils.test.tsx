import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { getSourceIcon, sourceLabels } from "./flashcardIconUtils";
import type { FlashcardSource } from "@/types";

describe("Flashcard Icon Utils", () => {
  describe("sourceLabels", () => {
    it("should have label for ai_generated source", () => {
      // Assert
      expect(sourceLabels.ai_generated).toBe("AI Generated");
    });

    it("should have label for ai_edited source", () => {
      // Assert
      expect(sourceLabels.ai_edited).toBe("AI Edited");
    });

    it("should have label for user_created source", () => {
      // Assert
      expect(sourceLabels.user_created).toBe("Manually created");
    });

    it("should have exactly 3 labels for all source types", () => {
      // Assert
      const labels = Object.keys(sourceLabels);
      expect(labels).toHaveLength(3);
      expect(labels).toContain("ai_generated");
      expect(labels).toContain("ai_edited");
      expect(labels).toContain("user_created");
    });

    it("should have all labels as non-empty strings", () => {
      // Assert
      Object.values(sourceLabels).forEach((label) => {
        expect(typeof label).toBe("string");
        expect(label.length).toBeGreaterThan(0);
      });
    });
  });

  describe("getSourceIcon", () => {
    describe("Icon selection logic", () => {
      it("should return Bot icon for ai_generated source", () => {
        // Act
        const icon = getSourceIcon("ai_generated");
        const { container } = render(<div>{icon}</div>);

        // Assert
        expect(icon).toBeDefined();
        const svg = container.querySelector("svg");
        expect(svg).toBeInTheDocument();
        expect(svg).toHaveClass("h-4", "w-4");
        // Verify it's a valid React element
        expect(icon.type).toBeDefined();
        expect(icon.props).toBeDefined();
      });

      it("should return Sparkles icon for ai_edited source", () => {
        // Act
        const icon = getSourceIcon("ai_edited");
        const { container } = render(<div>{icon}</div>);

        // Assert
        expect(icon).toBeDefined();
        const svg = container.querySelector("svg");
        expect(svg).toBeInTheDocument();
        expect(svg).toHaveClass("h-4", "w-4");
        // Verify it's a valid React element
        expect(icon.type).toBeDefined();
        expect(icon.props).toBeDefined();
      });

      it("should return User icon for user_created source", () => {
        // Act
        const icon = getSourceIcon("user_created");
        const { container } = render(<div>{icon}</div>);

        // Assert
        expect(icon).toBeDefined();
        const svg = container.querySelector("svg");
        expect(svg).toBeInTheDocument();
        expect(svg).toHaveClass("h-4", "w-4");
        // Verify it's a valid React element
        expect(icon.type).toBeDefined();
        expect(icon.props).toBeDefined();
      });
    });

    describe("Icon consistency", () => {
      it("should return consistent icon for the same source type", () => {
        // Act
        const icon1 = getSourceIcon("ai_generated");
        const icon2 = getSourceIcon("ai_generated");

        // Assert
        expect(icon1.type).toBe(icon2.type);
        expect(icon1.props.className).toBe(icon2.props.className);
      });

      it("should return different icons for different source types", () => {
        // Act
        const aiGeneratedIcon = getSourceIcon("ai_generated");
        const aiEditedIcon = getSourceIcon("ai_edited");
        const userCreatedIcon = getSourceIcon("user_created");

        // Assert
        expect(aiGeneratedIcon.type).not.toBe(aiEditedIcon.type);
        expect(aiGeneratedIcon.type).not.toBe(userCreatedIcon.type);
        expect(aiEditedIcon.type).not.toBe(userCreatedIcon.type);
      });

      it("should always return icon with h-4 w-4 classes", () => {
        // Arrange
        const sources: FlashcardSource[] = ["ai_generated", "ai_edited", "user_created"];

        sources.forEach((source) => {
          // Act
          const icon = getSourceIcon(source);

          // Assert
          expect(icon.props.className).toBe("h-4 w-4");
        });
      });
    });

    describe("Icon rendering", () => {
      it("should render valid React elements for all source types", () => {
        // Arrange
        const sources: FlashcardSource[] = ["ai_generated", "ai_edited", "user_created"];

        sources.forEach((source) => {
          // Act
          const icon = getSourceIcon(source);
          const { container } = render(<div>{icon}</div>);

          // Assert
          const svg = container.querySelector("svg");
          expect(svg).toBeInTheDocument();
          expect(svg?.tagName).toBe("svg");
        });
      });
    });

    describe("Edge cases and type safety", () => {
      it("should handle all possible FlashcardSource enum values", () => {
        // Arrange - This test ensures type safety at compile time
        const sources: FlashcardSource[] = ["ai_generated", "ai_edited", "user_created"];

        sources.forEach((source) => {
          // Act & Assert - Should not throw
          expect(() => getSourceIcon(source)).not.toThrow();
        });
      });
    });
  });

  describe("Integration between sourceLabels and getSourceIcon", () => {
    it("should have matching keys between sourceLabels and icon logic", () => {
      // Arrange
      const labelKeys = Object.keys(sourceLabels) as FlashcardSource[];

      labelKeys.forEach((source) => {
        // Act
        const icon = getSourceIcon(source);
        const label = sourceLabels[source];

        // Assert
        expect(icon).toBeDefined();
        expect(label).toBeDefined();
        expect(typeof label).toBe("string");
      });
    });

    it("should provide unique icon for each labeled source", () => {
      // Arrange
      const sources = Object.keys(sourceLabels) as FlashcardSource[];
      const icons = sources.map((source) => getSourceIcon(source));

      // Assert
      expect(icons).toHaveLength(3);
      // Check that all icons are unique by comparing their types
      const iconTypes = icons.map((icon) => icon.type);
      const uniqueIconTypes = new Set(iconTypes);
      expect(uniqueIconTypes.size).toBe(3);
    });
  });
});
