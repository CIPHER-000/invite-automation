import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InboxSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function InboxSearch({ 
  value, 
  onChange, 
  placeholder = "Search inboxes by email or name...",
  className = ""
}: InboxSearchProps) {
  const handleClear = () => {
    onChange("");
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {value && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Helper function to filter inboxes based on search term
export function filterInboxes<T extends { email: string; name?: string | null }>(
  inboxes: T[],
  searchTerm: string
): T[] {
  if (!searchTerm.trim()) {
    return inboxes;
  }

  const term = searchTerm.toLowerCase();
  return inboxes.filter(inbox => 
    inbox.email.toLowerCase().includes(term) ||
    (inbox.name && inbox.name.toLowerCase().includes(term))
  );
}