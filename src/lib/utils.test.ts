import { describe, it, expect } from "vitest";
import { cn, mapZodErrors } from "./utils";
import { z } from "zod";

describe("Utils", () => {
  describe("cn", () => {
    it("should merge class names correctly", () => {
      // Arrange
      const classes = ["text-red-500", "bg-blue-500", "p-4"];

      // Act
      const result = cn(...classes);

      // Assert
      expect(result).toBe("text-red-500 bg-blue-500 p-4");
    });

    it("should handle conditional classes", () => {
      // Arrange
      const isActive = true;

      // Act
      const result = cn("base-class", isActive && "active-class");

      // Assert
      expect(result).toBe("base-class active-class");
    });
  });

  describe("mapZodErrors", () => {
    it("should map Zod validation errors to a record", () => {
      // Arrange
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
      });

      try {
        schema.parse({ email: "invalid", password: "123" });
      } catch (error) {
        // Act
        const result = mapZodErrors(error as z.ZodError);

        // Assert
        expect(result).toHaveProperty("email");
        expect(result).toHaveProperty("password");
        expect(result.email).toContain("email");
        expect(result.password).toContain("least");
      }
    });
  });
});
