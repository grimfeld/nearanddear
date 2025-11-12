import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type ComboboxOption = {
  value: string;
  label: string;
};

type ComboboxProps = {
  options: ComboboxOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
};

export const Combobox = React.forwardRef<HTMLDivElement, ComboboxProps>(
  ({ options, value, onValueChange, placeholder = "Select...", emptyMessage = "No results found.", className, disabled }, ref) => {
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [position, setPosition] = React.useState({ top: 0, left: 0, width: 0 });
    const inputRef = React.useRef<HTMLInputElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    
    // Use callback ref to merge forwarded ref with internal ref
    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        containerRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      },
      [ref]
    );

    const selectedOption = options.find((opt) => opt.value === value);

    const filteredOptions = React.useMemo(() => {
      if (!searchQuery.trim()) return options;
      const query = searchQuery.toLowerCase();
      return options.filter(
        (opt) => opt.label.toLowerCase().includes(query) || opt.value.toLowerCase().includes(query)
      );
    }, [options, searchQuery]);

    // Handle clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        const isInsideContainer = containerRef.current?.contains(target) ?? false;
        const isInsideDropdown = dropdownRef.current?.contains(target) ?? false;
        
        if (!isInsideContainer && !isInsideDropdown) {
          setOpen(false);
          setSearchQuery("");
        }
      };

      if (open) {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }
    }, [open]);

    // Calculate position when opened
    React.useEffect(() => {
      if (open && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    }, [open]);

    // Update position on scroll/resize
    React.useEffect(() => {
      if (!open) return;

      const updatePosition = () => {
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          setPosition({
            top: rect.bottom + window.scrollY + 4,
            left: rect.left + window.scrollX,
            width: rect.width,
          });
        }
      };

      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);

      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }, [open]);

    // Focus input when opened
    React.useEffect(() => {
      if (open && inputRef.current) {
        // Small delay to ensure portal is rendered
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      }
    }, [open]);

    const handleSelect = (optionValue: string) => {
      onValueChange(optionValue);
      setOpen(false);
      setSearchQuery("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSearchQuery("");
      } else if (e.key === "Enter" && filteredOptions.length > 0) {
        handleSelect(filteredOptions[0].value);
      }
    };

    return (
      <div ref={setRefs} className={cn("relative", className)}>
        <button
          ref={buttonRef}
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setOpen(!open);
              if (!open) {
                setSearchQuery("");
              }
            }
          }}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            open && "ring-2 ring-ring ring-offset-2"
          )}
        >
          <span className={cn("truncate", !selectedOption && "text-muted-foreground")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>

        {open &&
          createPortal(
            <div
              ref={dropdownRef}
              className="fixed z-[9999] rounded-md border border-border bg-background text-foreground shadow-lg"
              style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                width: `${position.width}px`,
              }}
            >
              <div className="p-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search categories..."
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="max-h-[300px] overflow-y-auto p-1">
                {filteredOptions.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">{emptyMessage}</div>
                ) : (
                  filteredOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={cn(
                        "relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus:bg-accent focus:text-accent-foreground",
                        value === option.value && "bg-accent text-accent-foreground"
                      )}
                    >
                      {value === option.value && <Check className="h-4 w-4" />}
                      <span className={cn("flex-1 truncate", value === option.value && "font-medium")}>
                        {option.label}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>,
            document.body
          )}
      </div>
    );
  }
);

Combobox.displayName = "Combobox";

