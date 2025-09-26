import React, { useState } from 'react';
import { Search, Command } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GlobalSearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  placeholder = "البحث في النظام...",
  onSearch,
  className
}) => {
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query);
  };

  return (
    <form onSubmit={handleSearch} className={cn("relative max-w-md mx-auto", className)}>
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pr-10 pl-8 bg-background/50 border-border/30 focus:border-primary/50 transition-colors"
        />
        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground">
          <Command className="h-3 w-3" />
          <span className="hidden sm:inline">K</span>
        </div>
      </div>
    </form>
  );
};