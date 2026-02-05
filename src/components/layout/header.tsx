"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="lg:hidden flex items-center justify-between p-4 bg-[var(--card-bg)] border-b-4 border-[var(--border-color)]">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={onMenuClick}>
          <Menu className="h-5 w-5" strokeWidth={3} />
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-xl">🎓</span>
          <h1 className="text-lg font-black">AEEG</h1>
        </div>
      </div>
      <ThemeToggle />
    </header>
  );
}
