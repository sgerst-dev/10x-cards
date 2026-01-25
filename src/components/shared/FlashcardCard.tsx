import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ReactNode } from "react";

export interface FlashcardCardAction {
  icon: ReactNode;
  onClick: () => void;
  ariaLabel: string;
  variant?: "ghost" | "outline" | "default";
  disabled?: boolean;
}

interface FlashcardCardProps {
  front: string;
  back: string;
  actions: FlashcardCardAction[];
  icon?: ReactNode;
  iconTooltip?: string;
  badge?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function FlashcardCard({ front, back, actions, icon, iconTooltip, badge, footer, className = "" }: FlashcardCardProps) {
  return (
    <Card className={`transition-all hover:shadow-md flex flex-col border ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-4">
            {icon && (
              <div className="flex items-center gap-2">
                {iconTooltip ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center text-muted-foreground">{icon}</div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{iconTooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <div className="flex items-center text-muted-foreground">{icon}</div>
                )}
              </div>
            )}
            <p className="text-base font-semibold">{front}</p>
          </div>
          <div className="flex gap-1">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || "ghost"}
                size="icon"
                onClick={action.onClick}
                disabled={action.disabled}
                aria-label={action.ariaLabel}
              >
                {action.icon}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex-1">
        <p className="text-sm">{back}</p>
        {badge && <div className="mt-3">{badge}</div>}
      </CardContent>
      {footer && (
        <CardFooter className="pt-3 pb-4 mt-auto border-t">
          <div className="text-xs text-muted-foreground">{footer}</div>
        </CardFooter>
      )}
    </Card>
  );
}
