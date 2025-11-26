"use client";

import { Globe, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 py-4 px-6 text-sm text-muted-foreground">
        <span className="font-medium">Developed by</span>
        <div className="flex items-center gap-4">
          <a
            href="https://webcode.es"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <Globe className="h-4 w-4" />
            <span>webcode.es</span>
          </a>
          <a
            href="mailto:info@webcode.es"
            className="flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <Mail className="h-4 w-4" />
            <span>info@webcode.es</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
