import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FlashcardLibraryCard } from "./FlashcardLibraryCard";
import type { FlashcardDto } from "@/types";

// Mock the tooltip components to simplify testing
vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock the FlashcardCard component to focus on icon logic
vi.mock("@/components/shared/FlashcardCard", () => ({
  FlashcardCard: ({
    icon,
    iconTooltip,
    front,
    back,
  }: {
    icon?: React.ReactNode;
    iconTooltip?: string;
    front: string;
    back: string;
  }) => (
    <div data-testid="flashcard-card">
      <div data-testid="front">{front}</div>
      <div data-testid="back">{back}</div>
      {icon && (
        <div data-testid="icon" title={iconTooltip}>
          {icon}
        </div>
      )}
    </div>
  ),
}));

describe("FlashcardLibraryCard - Icon Display Logic", () => {
  // Helper function to create a mock flashcard with specific source
  const createMockFlashcard = (source: FlashcardDto["source"]): FlashcardDto => ({
    id: "test-id",
    front: "Test Front",
    back: "Test Back",
    source,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  });

  const mockHandlers = {
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  describe("Icon rendering based on flashcard source", () => {
    it("should render Bot icon for ai_generated flashcards", () => {
      // Arrange
      const flashcard = createMockFlashcard("ai_generated");

      // Act
      render(<FlashcardLibraryCard {...mockHandlers} flashcard={flashcard} />);

      // Assert
      const icon = screen.getByTestId("icon");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute("title", "AI Generated");
      // Check if Bot icon is rendered (lucide-react adds specific class)
      expect(icon.querySelector("svg")).toBeInTheDocument();
    });

    it("should render Sparkles icon for ai_edited flashcards", () => {
      // Arrange
      const flashcard = createMockFlashcard("ai_edited");

      // Act
      render(<FlashcardLibraryCard {...mockHandlers} flashcard={flashcard} />);

      // Assert
      const icon = screen.getByTestId("icon");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute("title", "AI Edited");
      expect(icon.querySelector("svg")).toBeInTheDocument();
    });

    it("should render User icon for user_created flashcards", () => {
      // Arrange
      const flashcard = createMockFlashcard("user_created");

      // Act
      render(<FlashcardLibraryCard {...mockHandlers} flashcard={flashcard} />);

      // Assert
      const icon = screen.getByTestId("icon");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute("title", "Manually created");
      expect(icon.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("Tooltip labels", () => {
    it("should display correct tooltip for ai_generated source", () => {
      // Arrange
      const flashcard = createMockFlashcard("ai_generated");

      // Act
      render(<FlashcardLibraryCard {...mockHandlers} flashcard={flashcard} />);

      // Assert
      const icon = screen.getByTestId("icon");
      expect(icon).toHaveAttribute("title", "AI Generated");
    });

    it("should display correct tooltip for ai_edited source", () => {
      // Arrange
      const flashcard = createMockFlashcard("ai_edited");

      // Act
      render(<FlashcardLibraryCard {...mockHandlers} flashcard={flashcard} />);

      // Assert
      const icon = screen.getByTestId("icon");
      expect(icon).toHaveAttribute("title", "AI Edited");
    });

    it("should display correct tooltip for user_created source", () => {
      // Arrange
      const flashcard = createMockFlashcard("user_created");

      // Act
      render(<FlashcardLibraryCard {...mockHandlers} flashcard={flashcard} />);

      // Assert
      const icon = screen.getByTestId("icon");
      expect(icon).toHaveAttribute("title", "Manually created");
    });
  });

  describe("Icon consistency across all source types", () => {
    it("should always render an icon regardless of source type", () => {
      // Arrange
      const sources: FlashcardDto["source"][] = ["ai_generated", "ai_edited", "user_created"];

      sources.forEach((source) => {
        // Act
        const { container } = render(
          <FlashcardLibraryCard {...mockHandlers} flashcard={createMockFlashcard(source)} />
        );

        // Assert
        const icon = screen.getByTestId("icon");
        expect(icon).toBeInTheDocument();
        expect(icon.querySelector("svg")).toBeInTheDocument();

        // Cleanup for next iteration
        container.remove();
      });
    });

    it("should render icons with consistent size class (h-4 w-4)", () => {
      // Arrange
      const flashcard = createMockFlashcard("ai_generated");

      // Act
      const { container } = render(<FlashcardLibraryCard {...mockHandlers} flashcard={flashcard} />);

      // Assert
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("h-4", "w-4");
    });
  });

  describe("Integration with FlashcardCard component", () => {
    it("should pass icon and iconTooltip to FlashcardCard", () => {
      // Arrange
      const flashcard = createMockFlashcard("ai_generated");

      // Act
      render(<FlashcardLibraryCard {...mockHandlers} flashcard={flashcard} />);

      // Assert
      expect(screen.getByTestId("flashcard-card")).toBeInTheDocument();
      expect(screen.getByTestId("icon")).toBeInTheDocument();
      expect(screen.getByTestId("icon")).toHaveAttribute("title", "AI Generated");
    });

    it("should pass front and back content to FlashcardCard", () => {
      // Arrange
      const flashcard = createMockFlashcard("user_created");

      // Act
      render(<FlashcardLibraryCard {...mockHandlers} flashcard={flashcard} />);

      // Assert
      expect(screen.getByTestId("front")).toHaveTextContent("Test Front");
      expect(screen.getByTestId("back")).toHaveTextContent("Test Back");
    });
  });
});
