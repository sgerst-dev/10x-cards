import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ItemsPerPageSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

const PAGE_SIZE_OPTIONS = [15, 30, 45, 60] as const;

export function ItemsPerPageSelector({ value, onChange }: ItemsPerPageSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Fiszek na stronie:</span>
      <Select value={String(value)} onValueChange={(val) => onChange(Number(val))}>
        <SelectTrigger className="w-[70px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PAGE_SIZE_OPTIONS.map((size) => (
            <SelectItem key={size} value={String(size)}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
