import { forwardRef, useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search, X } from "lucide-react";

import { Input, type InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const SEARCH_DELAY_MS = 350;
const MIN_QUERY_LENGTH = 3;

export type GeocodingResult = {
  lat: string;
  lon: string;
  display_name: string;
  type?: string;
  importance?: number;
  icon?: string;
  place_id?: number;
};

type AddressSearchInputProps = Omit<InputProps, "onChange" | "value"> & {
  value: string;
  onChange: (value: string | React.ChangeEvent<HTMLInputElement>) => void;
  onSelectResult: (result: GeocodingResult) => void;
};

export const AddressSearchInput = forwardRef<HTMLInputElement, AddressSearchInputProps>(
  ({ value, onChange, onSelectResult, className, disabled, onFocus, ...props }, ref) => {
    const [query, setQuery] = useState(value ?? "");
    const [results, setResults] = useState<GeocodingResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [dropdownVisible, setDropdownVisible] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const isMountedRef = useRef(true);

    useEffect(() => {
      isMountedRef.current = true;
      return () => {
        isMountedRef.current = false;
      };
    }, []);

    useEffect(() => {
      setQuery(value ?? "");
    }, [value]);

    useEffect(() => {
      const trimmed = query.trim();

      if (disabled || trimmed.length < MIN_QUERY_LENGTH) {
        setResults([]);
        setSearchError(null);
        setDropdownVisible(false);
        setIsSearching(false);
        return undefined;
      }

      setDropdownVisible(true);
      setIsSearching(true);
      setSearchError(null);

      const controller = new AbortController();
      const timeout = window.setTimeout(async () => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
              trimmed
            )}&limit=5&addressdetails=1&extratags=1&namedetails=1`,
            {
              headers: {
                Accept: "application/json",
              },
              signal: controller.signal,
            }
          );

          if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
          }

          const data = (await response.json()) as GeocodingResult[];

          if (!isMountedRef.current || controller.signal.aborted) {
            return;
          }

          if (data.length === 0) {
            setResults([]);
            setDropdownVisible(true);
          } else {
            const sorted = [...data].sort(
              (a, b) => (b.importance ?? 0) - (a.importance ?? 0)
            );
            setResults(sorted);
            setDropdownVisible(true);
          }
        } catch (error) {
          if (controller.signal.aborted || !isMountedRef.current) {
            return;
          }
          console.error("Address search failed:", error);
          setResults([]);
          setSearchError("Unable to fetch address suggestions right now.");
          setDropdownVisible(true);
        } finally {
          if (!controller.signal.aborted && isMountedRef.current) {
            setIsSearching(false);
          }
        }
      }, SEARCH_DELAY_MS);

      return () => {
        controller.abort();
        window.clearTimeout(timeout);
      };
    }, [disabled, query]);

    useEffect(() => {
      if (!dropdownVisible) return;

      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setDropdownVisible(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [dropdownVisible]);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(event.target.value);
      onChange(event);
    };

    const handleClear = () => {
      setQuery("");
      setResults([]);
      setSearchError(null);
      setDropdownVisible(false);
      onChange("");
    };

    const handleSelect = (result: GeocodingResult) => {
      setQuery(result.display_name);
      setResults([]);
      setSearchError(null);
      setDropdownVisible(false);
      onChange(result.display_name);
      onSelectResult(result);
    };

    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
      if (results.length > 0 || searchError) {
        setDropdownVisible(true);
      }
      onFocus?.(event);
    };

    const showDropdown =
      dropdownVisible &&
      (isSearching || searchError !== null || results.length > 0 || query.trim().length >= MIN_QUERY_LENGTH);

    return (
      <div ref={containerRef} className="relative">
        <Input
          ref={ref}
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          disabled={disabled}
          className={cn("pr-10", className)}
          {...props}
        />
        <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-8 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Clear address"
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {isSearching && (
          <Loader2 className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
        {showDropdown && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover text-popover-foreground shadow-md">
            <div className="max-h-60 overflow-y-auto py-1 text-sm">
              {searchError ? (
                <div className="px-3 py-2 text-destructive">{searchError}</div>
              ) : results.length === 0 && !isSearching ? (
                <div className="px-3 py-2 text-muted-foreground">No matching addresses found.</div>
              ) : (
                results.map((result) => (
                  <button
                    type="button"
                    key={result.place_id ?? `${result.lat}-${result.lon}-${result.display_name}`}
                    className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground"
                    onClick={() => handleSelect(result)}
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="font-medium leading-tight">{result.display_name}</span>
                      {result.type && (
                        <span className="text-xs text-muted-foreground">
                          {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
              {isSearching && (
                <div className="flex items-center gap-2 px-3 py-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching…
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

AddressSearchInput.displayName = "AddressSearchInput";


