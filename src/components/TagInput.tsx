import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { Loader2, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getMapTags } from "@/services/tags";
import type { SupabaseClientType } from "@/lib/supabaseClient";
import { useSupabase } from "@/providers/SupabaseProvider";

const SEARCH_DELAY_MS = 200;
const MIN_QUERY_LENGTH = 0; // Show suggestions even with empty query

export type TagInputProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  mapId: string;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
};

export const TagInput = ({
  value,
  onChange,
  mapId,
  className,
  disabled,
  placeholder = "Add tags...",
}: TagInputProps) => {
  const supabase = useSupabase();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch tag suggestions
  const {
    data: suggestions = [],
    isLoading: isSearching,
    refetch,
  } = useQuery({
    queryKey: ["map-tags", mapId, query],
    queryFn: async () => {
      if (!mapId) return [];
      return getMapTags(supabase as SupabaseClientType, mapId, query);
    },
    enabled: mapId.length > 0 && !disabled,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Filter out already selected tags from suggestions
  const availableSuggestions = suggestions
    .map((tag) => tag.name)
    .filter((tagName) => !value.includes(tagName.toLowerCase()))
    .slice(0, 10); // Limit to 10 suggestions

  const showDropdown = isFocused && (query.length >= MIN_QUERY_LENGTH || availableSuggestions.length > 0);

  // Handle clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
        setQuery("");
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setSelectedIndex(-1);
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < availableSuggestions.length) {
        handleSelectTag(availableSuggestions[selectedIndex]);
      } else if (query.trim()) {
        handleAddTag(query.trim());
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < availableSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      setIsFocused(false);
      setQuery("");
      setSelectedIndex(-1);
    } else if (e.key === "Backspace" && !query && value.length > 0) {
      // Remove last tag on backspace when input is empty
      handleRemoveTag(value[value.length - 1]);
    }
  };

  const handleAddTag = (tagName: string) => {
    const normalized = tagName.trim().toLowerCase();
    if (normalized && !value.includes(normalized)) {
      onChange([...value, normalized]);
      setQuery("");
      setSelectedIndex(-1);
      inputRef.current?.focus();
      // Refetch suggestions to update usage counts
      setTimeout(() => refetch(), 100);
    }
  };

  const handleSelectTag = (tagName: string) => {
    handleAddTag(tagName);
  };

  const handleRemoveTag = (tagName: string) => {
    onChange(value.filter((tag) => tag !== tagName));
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div
        className={cn(
          "flex min-h-10 w-full flex-wrap items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          disabled && "cursor-not-allowed opacity-50"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 pr-1">
            <span>{tag}</span>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveTag(tag);
                }}
                className="ml-1 rounded-full hover:bg-background/80"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={() => setIsFocused(true)}
          placeholder={value.length === 0 ? placeholder : ""}
          disabled={disabled}
          className="h-6 min-w-[120px] flex-1 border-0 bg-transparent p-0 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />
      </div>

      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-background text-foreground shadow-lg">
          <div className="max-h-60 overflow-y-auto py-1 text-sm">
            {isSearching ? (
              <div className="flex items-center gap-2 px-3 py-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </div>
            ) : availableSuggestions.length > 0 ? (
              availableSuggestions.map((tagName, index) => {
                const tag = suggestions.find((t) => t.name === tagName);
                const usageCount = tag?.usage_count ?? 0;
                return (
                  <button
                    type="button"
                    key={tagName}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground",
                      index === selectedIndex && "bg-accent text-accent-foreground"
                    )}
                    onClick={() => handleSelectTag(tagName)}
                  >
                    <span>{tagName}</span>
                    {usageCount > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {usageCount} {usageCount === 1 ? "location" : "locations"}
                      </span>
                    )}
                  </button>
                );
              })
            ) : query.trim() ? (
              <button
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleAddTag(query.trim())}
              >
                Create "{query.trim()}"
              </button>
            ) : (
              <div className="px-3 py-2 text-muted-foreground">No tags available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

