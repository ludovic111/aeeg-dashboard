"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  if (!resolvedTheme) {
    return (
      <Button variant="outline" size="icon">
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Changer le thème"
    >
      {resolvedTheme === "dark" ? (
        <Sun className="h-4 w-4" strokeWidth={3} />
      ) : (
        <Moon className="h-4 w-4" strokeWidth={3} />
      )}
    </Button>
  );
}
