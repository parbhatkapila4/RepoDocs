"use client";

import * as React from "react";
import { X, Check, ChevronsUpDown, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  allowCustom?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  searchPlaceholder = "Search...",
  emptyMessage = "No items found.",
  className,
  allowCustom = true,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleUnselect = (item: string) => {
    onChange(selected.filter((s) => s !== item));
  };

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      handleUnselect(value);
    } else {
      onChange([...selected, value]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Delete" || e.key === "Backspace") {
      if (inputValue === "" && selected.length > 0) {
        handleUnselect(selected[selected.length - 1]);
      }
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const selectables = options.filter((option) => !selected.includes(option.value));

  const filteredOptions = React.useMemo(() => {
    if (!inputValue) return selectables;
    const lowerInput = inputValue.toLowerCase();
    return selectables.filter((option) =>
      option.label.toLowerCase().includes(lowerInput) ||
      option.value.toLowerCase().includes(lowerInput)
    );
  }, [inputValue, selectables]);

  const handleAddCustom = () => {
    if (inputValue.trim() && allowCustom && !selected.includes(inputValue.trim())) {
      onChange([...selected, inputValue.trim()]);
      setInputValue("");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          className={cn(
            "min-h-10 w-full rounded-md border border-gray-700 bg-gray-900/50 text-sm text-white",
            "flex items-center gap-1 p-2",
            "focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2",
            className
          )}
        >
          <div className="flex flex-wrap gap-1 flex-1 items-center">
            {selected.length > 0 ? (
              selected.map((item) => {
                const option = options.find((opt) => opt.value === item);
                return (
                  <Badge
                    key={item}
                    variant="secondary"
                    className="bg-blue-500/20 text-blue-200 border-blue-500/30 hover:bg-blue-500/30"
                  >
                    {option?.label || item}
                    <button
                      className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleUnselect(item);
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={() => handleUnselect(item)}
                    >
                      <X className="h-3 w-3 text-blue-200 hover:text-white" />
                    </button>
                  </Badge>
                );
              })
            ) : (
              <span className="text-gray-400">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="p-0 bg-gray-800 border-gray-700" 
        align="start"
        style={{ width: "var(--radix-popover-trigger-width)" }}
      >
        <Command className="bg-gray-800">
          <CommandInput
            placeholder={searchPlaceholder}
            value={inputValue}
            onValueChange={setInputValue}
            onKeyDown={(e) => {
              if (e.key === "Enter" && inputValue.trim() && allowCustom) {
                e.preventDefault();
                handleAddCustom();
              }
            }}
            className="text-white placeholder:text-gray-400"
          />
          <CommandList>
            <CommandEmpty className="text-gray-400 py-6 text-center text-sm">
              {emptyMessage}
              {allowCustom && inputValue.trim() && (
                <button
                  onClick={handleAddCustom}
                  className="mt-2 text-blue-400 hover:text-blue-300 underline"
                >
                  Add "{inputValue.trim()}"
                </button>
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => handleSelect(option.value)}
                  className="text-white hover:bg-gray-700 focus:bg-gray-700"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected.includes(option.value) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {allowCustom && inputValue.trim() && !filteredOptions.some(opt => opt.value.toLowerCase() === inputValue.trim().toLowerCase()) && (
              <CommandGroup>
                <CommandItem
                  onSelect={handleAddCustom}
                  className="text-blue-400 hover:bg-gray-700 focus:bg-gray-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add "{inputValue.trim()}"
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
