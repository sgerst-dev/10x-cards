import { Button } from "@/components/ui/button";
import type { PaginationDto } from "@/types";
import { ItemsPerPageSelector } from "./ItemsPerPageSelector";

interface PaginationControlsProps {
  pagination: PaginationDto;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (limit: number) => void;
}

export function PaginationControls({
  pagination,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
}: PaginationControlsProps) {
  const { current_page, total_pages } = pagination;

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 5;

    if (total_pages <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= total_pages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (current_page > 3) {
        pages.push("ellipsis");
      }

      // Show pages around current page
      const start = Math.max(2, current_page - 1);
      const end = Math.min(total_pages - 1, current_page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current_page < total_pages - 2) {
        pages.push("ellipsis");
      }

      // Always show last page
      pages.push(total_pages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
      <ItemsPerPageSelector value={itemsPerPage} onChange={onItemsPerPageChange} />

      {total_pages > 1 && (
        <nav className="flex items-center justify-center gap-2" aria-label="Paginacja">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(current_page - 1)}
            disabled={current_page === 1}
            aria-label="Poprzednia strona"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2 h-4 w-4"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Poprzednia
          </Button>

          <div className="flex items-center gap-1">
            {pageNumbers.map((page, index) =>
              page === "ellipsis" ? (
                <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                  ...
                </span>
              ) : (
                <Button
                  key={page}
                  variant={page === current_page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page)}
                  aria-label={`Strona ${page}`}
                  aria-current={page === current_page ? "page" : undefined}
                  className="min-w-[2.5rem]"
                >
                  {page}
                </Button>
              )
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(current_page + 1)}
            disabled={current_page === total_pages}
            aria-label="Następna strona"
          >
            Następna
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ml-2 h-4 w-4"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </Button>
        </nav>
      )}
    </div>
  );
}
