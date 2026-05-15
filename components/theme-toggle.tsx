"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Monitor } from "lucide-react";

const options = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — only render active state after mount
  useEffect(() => setMounted(true), []);

  return (
    <div className="flex gap-2">
      {options.map(({ value, label, icon: Icon }) => {
        const isActive = mounted && theme === value;
        return (
          <Button
            key={value}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => setTheme(value)}
            className="gap-2"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        );
      })}
    </div>
  );
}
