"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, PanelLeftClose, PanelRightClose } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CollapsiblePanelProps {
  children: React.ReactNode;
  side: "left" | "right";
  defaultOpen?: boolean;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  collapsedWidth?: number;
  className?: string;
  title?: string;
}

const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
  children,
  side,
  defaultOpen = true,
  defaultWidth = 320,
  minWidth = 200,
  maxWidth = 600,
  collapsedWidth = 48,
  className,
  title,
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const [width, setWidth] = React.useState(defaultWidth);
  const [isResizing, setIsResizing] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);

  const togglePanel = React.useCallback(() => setIsOpen(prev => !prev), []);

  // Handle resize
  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !panelRef.current) return;

      let newWidth: number;
      if (side === "left") {
        newWidth = e.clientX - panelRef.current.getBoundingClientRect().left;
      } else {
        newWidth = panelRef.current.getBoundingClientRect().right - e.clientX;
      }

      // Clamp width between min and max
      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, side, minWidth, maxWidth]);

  // Keyboard shortcut
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + [ for left panel, Ctrl/Cmd + ] for right panel
      if ((event.metaKey || event.ctrlKey) && !event.shiftKey) {
        if (side === "left" && event.key === "[") {
          event.preventDefault();
          togglePanel();
        } else if (side === "right" && event.key === "]") {
          event.preventDefault();
          togglePanel();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [side, togglePanel]);

  const Icon = side === "left"
    ? (isOpen ? PanelLeftClose : ChevronRight)
    : (isOpen ? PanelRightClose : ChevronLeft);

  return (
    <div
      ref={panelRef}
      className={cn(
        "relative flex flex-col",
        !isResizing && "transition-all duration-300 ease-in-out",
        className
      )}
      style={{
        width: isOpen ? width : collapsedWidth,
        minWidth: isOpen ? width : collapsedWidth,
      }}
      data-state={isOpen ? "expanded" : "collapsed"}
      data-side={side}
    >
      {/* Resize Handle */}
      {isOpen && (
        <div
          className={cn(
            "absolute top-0 bottom-0 w-1 z-30 cursor-col-resize group",
            "hover:bg-primary/30 transition-colors",
            isResizing && "bg-primary/50",
            side === "left" ? "right-0" : "left-0"
          )}
          onMouseDown={handleMouseDown}
        >
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 w-1 h-8 rounded-full",
              "bg-slate-600 group-hover:bg-primary transition-colors",
              isResizing && "bg-primary",
              side === "left" ? "right-0" : "left-0"
            )}
          />
        </div>
      )}

      {/* Toggle Button */}
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePanel}
              className={cn(
                "absolute z-20 size-6 rounded-full bg-bg-deep/80 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all",
                side === "left"
                  ? "right-0 translate-x-1/2 top-4"
                  : "left-0 -translate-x-1/2 top-4"
              )}
            >
              <Icon className="size-3.5 text-slate-400" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side={side === "left" ? "right" : "left"} className="text-xs">
            {isOpen ? "Collapse" : "Expand"} {title || (side === "left" ? "Sidebar" : "Panel")}
            <span className="ml-2 text-slate-500">
              {side === "left" ? "⌘[" : "⌘]"}
            </span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Panel Content */}
      <div
        className={cn(
          "flex-1 overflow-hidden transition-opacity duration-200",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {children}
      </div>

      {/* Collapsed State - Show icon/title */}
      {!isOpen && (
        <div
          className="flex-1 flex flex-col items-center pt-14 cursor-pointer"
          onClick={togglePanel}
        >
          <div
            className={cn(
              "writing-mode-vertical text-xs font-medium text-slate-500 tracking-widest uppercase",
              side === "right" && "rotate-180"
            )}
            style={{ writingMode: "vertical-rl" }}
          >
            {title || (side === "left" ? "Sessions" : "Inspector")}
          </div>
        </div>
      )}
    </div>
  );
};

export { CollapsiblePanel };
