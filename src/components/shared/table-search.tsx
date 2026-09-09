'use client';

import { useState, useRef, useEffect, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface TableSearchProps {
  children: ReactNode;
  placeholder?: string;
  emptyMessage?: string;
}

export function TableSearch({
  children,
  placeholder = "Search...",
  emptyMessage = "No matching records found.",
}: TableSearchProps) {
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const rows = containerRef.current.querySelectorAll<HTMLTableRowElement>("tbody tr[data-search-row]");
    const q = query.toLowerCase().trim();
    let visibleCount = 0;

    rows.forEach((row) => {
      const text = row.getAttribute("data-search-row") || "";
      const matches = !q || text.includes(q);
      row.style.display = matches ? "" : "none";
      if (matches) visibleCount++;
    });

    const noResultsRow = containerRef.current.querySelector<HTMLTableRowElement>("tbody tr[data-no-results]");
    if (noResultsRow) {
      noResultsRow.style.display = (visibleCount === 0 && rows.length > 0 && q.length > 0) ? "" : "none";
    }
  }, [query]);

  return (
    <div ref={containerRef} className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          className="pl-8 bg-white"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {children}
    </div>
  );
}
