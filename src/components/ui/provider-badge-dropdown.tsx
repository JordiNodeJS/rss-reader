"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import {
  Cpu,
  Cloud,
  Check,
  Settings,
  ChevronDown,
  Chrome,
  Sparkles,
} from "lucide-react";
import {
  SUMMARIZATION_MODELS,
  type SummarizationModelKey,
} from "@/lib/summarization-models";
import type { SummarizationProvider } from "@/hooks/useSummary";

interface ProviderBadgeDropdownProps {
  provider: SummarizationProvider;
  selectedModel: SummarizationModelKey;
  onProviderChange: (provider: SummarizationProvider) => void;
  onModelChange: (model: SummarizationModelKey) => void;
  onOpenSettings?: () => void;
  proxyRateLimit?: { remaining: number; resetAt: number } | null;
  hasGeminiKey?: boolean;
  className?: string;
  onRequestApiKey?: () => void;
}

export function ProviderBadgeDropdown({
  provider,
  selectedModel,
  onProviderChange,
  onModelChange,
  onOpenSettings,
  proxyRateLimit,
  hasGeminiKey = false,
  className = "",
  onRequestApiKey,
}: ProviderBadgeDropdownProps) {
  const getBadgeContent = () => {
    switch (provider) {
      case "gemini":
        return (
          <>
            <Cloud className="w-3 h-3 mr-1" />
            Gemini
          </>
        );
      case "proxy":
        return (
          <>
            <Cloud className="w-3 h-3 mr-1" />
            Proxy
            {proxyRateLimit && (
              <span className="ml-1 text-[10px] opacity-80">
                ({proxyRateLimit.remaining}/5)
              </span>
            )}
          </>
        );
      case "chrome":
        return (
          <>
            <Chrome className="w-3 h-3 mr-1" />
            Chrome AI
          </>
        );
      default:
        return (
          <>
            <Cpu className="w-3 h-3 mr-1" />
            Local
            {selectedModel && SUMMARIZATION_MODELS[selectedModel] && (
              <span className="ml-1 text-[10px] opacity-80">
                ({SUMMARIZATION_MODELS[selectedModel].name})
              </span>
            )}
          </>
        );
    }
  };

  const getBadgeStyle = () => {
    switch (provider) {
      case "gemini":
        return "bg-blue-500 text-white hover:bg-blue-600 cursor-pointer border-transparent";
      case "proxy":
        if (proxyRateLimit && proxyRateLimit.remaining === 0) {
          return "bg-red-500 text-white hover:bg-red-600 cursor-pointer border-transparent";
        }
        return "bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer border-transparent";
      case "chrome":
        // yellow has better contrast with dark text
        return "bg-yellow-500 text-black hover:bg-yellow-600 cursor-pointer border-transparent";
      default:
        return "bg-purple-500 text-white hover:bg-purple-600 cursor-pointer border-transparent";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${getBadgeStyle()} ${className}`}
        >
          <Sparkles className="w-3 h-3 mr-1" />
          {getBadgeContent()}
          <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Proveedor de IA
        </DropdownMenuLabel>

        {/* Local Models */}
        <DropdownMenuLabel className="text-[10px] text-muted-foreground/70 font-normal mt-1">
          Modelos locales (navegador)
        </DropdownMenuLabel>
        {Object.entries(SUMMARIZATION_MODELS).map(([key, model]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => {
              onProviderChange("local");
              onModelChange(key as SummarizationModelKey);
            }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Cpu className="w-3 h-3 text-purple-500" />
              <span className="text-xs">{model.name}</span>
            </div>
            {provider === "local" && selectedModel === key && (
              <Check className="w-3 h-3 text-purple-500" />
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {/* Cloud Options */}
        <DropdownMenuLabel className="text-[10px] text-muted-foreground/70 font-normal">
          Servicios en la nube
        </DropdownMenuLabel>

        {/* Proxy (free) */}
        <DropdownMenuItem
          onClick={() => onProviderChange("proxy")}
          className="flex items-center justify-between"
          disabled={proxyRateLimit?.remaining === 0}
        >
          <div className="flex items-center gap-2">
            <Cloud className="w-3 h-3 text-emerald-500" />
            <span className="text-xs">
              Proxy Gemini
              <span className="ml-1 text-[10px] text-muted-foreground">
                (gratis, 5/hora)
              </span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            {proxyRateLimit && (
              <span
                className={`text-[10px] ${
                  proxyRateLimit.remaining === 0
                    ? "text-red-500"
                    : "text-emerald-500"
                }`}
              >
                {proxyRateLimit.remaining}/5
              </span>
            )}
            {provider === "proxy" && (
              <Check className="w-3 h-3 text-emerald-500" />
            )}
          </div>
        </DropdownMenuItem>

        {/* Gemini with own key */}
        <DropdownMenuItem
          onClick={() => {
            if (hasGeminiKey) {
              onProviderChange("gemini");
            } else {
              // Trigger a focused API key request in the parent
              onRequestApiKey?.();
            }
          }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Cloud className="w-3 h-3 text-blue-500" />
            <span className="text-xs">
              Gemini
              {!hasGeminiKey && (
                <span className="ml-1 text-[10px] text-muted-foreground">
                  (API key)
                </span>
              )}
            </span>
          </div>
          {provider === "gemini" && <Check className="w-3 h-3 text-blue-500" />}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Settings */}
        <DropdownMenuItem onClick={onOpenSettings} className="text-xs">
          <Settings className="w-3 h-3 mr-2" />
          Configuración avanzada...
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
