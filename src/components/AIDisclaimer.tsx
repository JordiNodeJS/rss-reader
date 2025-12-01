"use client";

import { useState, useCallback, useEffect } from "react";
import {
  AlertTriangle,
  Settings,
  Key,
  Check,
  X,
  Loader2,
  Sparkles,
  Cpu,
  Cloud,
  Info,
  ExternalLink,
  Chrome,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  storeApiKey,
  clearStoredApiKey,
  validateApiKey,
  hasStoredApiKey,
} from "@/lib/summarization-gemini";
import {
  SUMMARIZATION_MODELS,
  DEFAULT_MODEL,
  type SummarizationModelKey,
} from "@/lib/summarization-models";

// ============================================
// Types
// ============================================

export type SummarizationProvider = "local" | "gemini";

interface AIDisclaimerProps {
  /** Currently selected provider */
  provider: SummarizationProvider;
  /** Callback when provider changes */
  onProviderChange: (provider: SummarizationProvider) => void;
  /** Currently selected local model */
  selectedModel?: SummarizationModelKey;
  /** Callback when local model changes */
  onModelChange?: (model: SummarizationModelKey) => void;
  /** Whether Chrome Translator is available */
  isTranslationAvailable?: boolean;
  /** Compact mode for inline display */
  compact?: boolean;
}

// ============================================
// Component
// ============================================

export function AIDisclaimer({
  provider,
  onProviderChange,
  selectedModel = DEFAULT_MODEL,
  onModelChange,
  isTranslationAvailable = true,
  compact = false,
}: AIDisclaimerProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<
    "idle" | "valid" | "invalid"
  >("idle");
  const [hasKey, setHasKey] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  // Check for stored API key on mount
  useEffect(() => {
    setHasKey(hasStoredApiKey());
  }, []);

  // Handle API key save
  const handleSaveApiKey = useCallback(async () => {
    if (!apiKey.trim()) return;

    setIsValidating(true);
    setValidationResult("idle");

    try {
      const isValid = await validateApiKey(apiKey.trim());
      if (isValid) {
        storeApiKey(apiKey.trim());
        setValidationResult("valid");
        setHasKey(true);
        // Auto-switch to Gemini if key is valid
        onProviderChange("gemini");
        // Clear input after success
        setTimeout(() => {
          setApiKey("");
          setValidationResult("idle");
        }, 2000);
      } else {
        setValidationResult("invalid");
      }
    } catch {
      setValidationResult("invalid");
    } finally {
      setIsValidating(false);
    }
  }, [apiKey, onProviderChange]);

  // Handle clearing API key
  const handleClearApiKey = useCallback(() => {
    clearStoredApiKey();
    setHasKey(false);
    setApiKey("");
    setValidationResult("idle");
    if (provider === "gemini") {
      onProviderChange("local");
    }
  }, [provider, onProviderChange]);

  // Dismiss disclaimer
  const handleDismissDisclaimer = useCallback(() => {
    setShowDisclaimer(false);
    // Persist dismissal
    try {
      localStorage.setItem("ai-disclaimer-dismissed", "true");
    } catch {
      // Ignore
    }
  }, []);

  // Check if disclaimer was previously dismissed
  useEffect(() => {
    try {
      const dismissed = localStorage.getItem("ai-disclaimer-dismissed");
      if (dismissed === "true") {
        setShowDisclaimer(false);
      }
    } catch {
      // Ignore
    }
  }, []);

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <Badge
          variant={provider === "local" ? "secondary" : "default"}
          className="cursor-pointer"
          onClick={() => setIsSettingsOpen(true)}
        >
          {provider === "local" ? (
            <>
              <Cpu className="w-3 h-3 mr-1" />
              Local
              {selectedModel && SUMMARIZATION_MODELS[selectedModel] && (
                <span className="ml-2 text-[10px] opacity-80">
                  ({SUMMARIZATION_MODELS[selectedModel].name})
                </span>
              )}
            </>
          ) : (
            <>
              <Cloud className="w-3 h-3 mr-1" />
              Gemini
            </>
          )}
        </Badge>
        <SettingsDialog
          isOpen={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          provider={provider}
          onProviderChange={onProviderChange}
          selectedModel={selectedModel}
          onModelChange={onModelChange}
          apiKey={apiKey}
          setApiKey={setApiKey}
          isValidating={isValidating}
          validationResult={validationResult}
          hasKey={hasKey}
          onSaveApiKey={handleSaveApiKey}
          onClearApiKey={handleClearApiKey}
          isTranslationAvailable={isTranslationAvailable}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Disclaimer Banner */}
      {showDisclaimer && (
        <div className="relative bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
          <button
            onClick={handleDismissDisclaimer}
            className="absolute top-2 right-2 text-amber-600/60 hover:text-amber-600"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3 pr-6">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                Aviso sobre resúmenes IA
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300/80">
                Los resúmenes generados por IA pueden contener errores,
                omisiones o interpretaciones incorrectas. Siempre verifica la
                información importante con el artículo original.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-amber-500/50 hover:bg-amber-500/20"
                    >
                      <Settings className="w-3 h-3 mr-1" />
                      Configurar IA
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Translation Warning for non-Chrome browsers */}
      {!isTranslationAvailable && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
          <div className="flex items-start gap-3">
            <Chrome className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                Traducción limitada
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300/80">
                Las traducciones automáticas requieren Chrome 121+ con la API
                Translator. Los resúmenes se mostrarán en inglés en otros
                navegadores.
              </p>
              <a
                href="https://www.google.com/chrome/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-500 pt-1"
              >
                Obtener Chrome
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Settings Dialog */}
      <SettingsDialog
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        provider={provider}
        onProviderChange={onProviderChange}
        selectedModel={selectedModel}
        onModelChange={onModelChange}
        apiKey={apiKey}
        setApiKey={setApiKey}
        isValidating={isValidating}
        validationResult={validationResult}
        hasKey={hasKey}
        onSaveApiKey={handleSaveApiKey}
        onClearApiKey={handleClearApiKey}
        isTranslationAvailable={isTranslationAvailable}
      />
    </div>
  );
}

// ============================================
// Settings Dialog Component
// ============================================

interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  provider: SummarizationProvider;
  onProviderChange: (provider: SummarizationProvider) => void;
  selectedModel: SummarizationModelKey;
  onModelChange?: (model: SummarizationModelKey) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  isValidating: boolean;
  validationResult: "idle" | "valid" | "invalid";
  hasKey: boolean;
  onSaveApiKey: () => void;
  onClearApiKey: () => void;
  isTranslationAvailable: boolean;
}

function SettingsDialog({
  isOpen,
  onOpenChange,
  provider,
  onProviderChange,
  selectedModel,
  onModelChange,
  apiKey,
  setApiKey,
  isValidating,
  validationResult,
  hasKey,
  onSaveApiKey,
  onClearApiKey,
  isTranslationAvailable,
}: SettingsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {/* Make dialog content scrollable on small screens to ensure the full
          configuration box is reachable on mobile devices */}
      <DialogContent className="w-full sm:max-w-2xl max-h-[85vh] sm:max-h-[75vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-background/50 backdrop-blur-sm z-10">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Configuración de IA
          </DialogTitle>
          <DialogDescription>
            Elige cómo generar los resúmenes de artículos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Provider Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              Proveedor de resúmenes
            </label>

            {/* Local Option */}
            <button
              onClick={() => onProviderChange("local")}
              className={`w-full p-3 rounded-lg border text-left transition-all ${
                provider === "local"
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-border hover:border-purple-500/50 hover:bg-purple-500/5"
              }`}
            >
              <div className="flex items-start gap-3">
                <Cpu
                  className={`w-5 h-5 mt-0.5 ${
                    provider === "local"
                      ? "text-purple-500"
                      : "text-muted-foreground"
                  }`}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      Modelo Local (Transformers.js)
                    </span>
                    {provider === "local" && (
                      <Check className="w-4 h-4 text-purple-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Usa DistilBART en tu navegador. Sin costo, privado, pero más
                    lento y menos preciso.
                  </p>
                </div>
              </div>
            </button>

            {/* Model Selection for Local - Only show when local is selected */}
            {provider === "local" && onModelChange && (
              <div className="ml-8 p-3 rounded-lg bg-muted/50 border border-border/50 space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Modelo local
                </label>
                <div className="space-y-2">
                  {Object.entries(SUMMARIZATION_MODELS).map(([key, model]) => (
                    <button
                      key={key}
                      onClick={() =>
                        onModelChange(key as SummarizationModelKey)
                      }
                      className={`w-full p-2 rounded-md border text-left transition-all text-xs ${
                        selectedModel === key
                          ? "border-purple-500 bg-purple-500/10"
                          : "border-border/50 hover:border-purple-500/30 hover:bg-purple-500/5"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {selectedModel === key && (
                            <Check className="w-3 h-3 text-purple-500" />
                          )}
                          <span className="font-medium">{model.name}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {model.size}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mt-0.5 ml-5">
                        {model.description}
                      </p>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Modelos más grandes ofrecen mejor calidad pero tardan más en
                  descargar.
                </p>
              </div>
            )}

            {/* Gemini Option */}
            <button
              onClick={() => hasKey && onProviderChange("gemini")}
              disabled={!hasKey}
              className={`w-full p-3 rounded-lg border text-left transition-all ${
                provider === "gemini"
                  ? "border-purple-500 bg-purple-500/10"
                  : hasKey
                  ? "border-border hover:border-purple-500/50 hover:bg-purple-500/5"
                  : "border-border/50 opacity-60 cursor-not-allowed"
              }`}
            >
              <div className="flex items-start gap-3">
                <Cloud
                  className={`w-5 h-5 mt-0.5 ${
                    provider === "gemini"
                      ? "text-purple-500"
                      : "text-muted-foreground"
                  }`}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      Google Gemini (API)
                    </span>
                    {provider === "gemini" && (
                      <Check className="w-4 h-4 text-purple-500" />
                    )}
                    {hasKey && (
                      <Badge variant="secondary" className="text-[10px]">
                        Configurado
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Usa Gemini 2.5 Flash-Lite. Ultra rápido y muy económico
                    (~$0.10/millón tokens). Requiere API key.
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* API Key Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Key className="w-4 h-4" />
              API Key de Gemini
            </label>

            {hasKey ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-muted rounded-md text-sm">
                  <span className="text-muted-foreground">••••••••••••</span>
                  <span className="text-green-600 ml-2">✓ Guardada</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearApiKey}
                  className="shrink-0"
                >
                  Eliminar
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIza..."
                    className="flex-1 px-3 py-2 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                  <Button
                    onClick={onSaveApiKey}
                    disabled={!apiKey.trim() || isValidating}
                    size="sm"
                    className="shrink-0"
                  >
                    {isValidating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : validationResult === "valid" ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      "Guardar"
                    )}
                  </Button>
                </div>
                {validationResult === "invalid" && (
                  <p className="text-xs text-destructive">
                    La API key no es válida. Verifica que esté correcta.
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Obtén tu API key en{" "}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-500 hover:underline"
                  >
                    Google AI Studio
                  </a>
                </p>
              </div>
            )}
          </div>

          {/* Translation Info */}
          {!isTranslationAvailable && !hasKey && (
            <div className="flex items-start gap-2 p-2 bg-blue-500/10 rounded-md">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                La traducción automática con Chrome no está disponible.{" "}
                Configura una API key de Gemini para habilitar traducciones o
                usa Chrome 131+.
              </p>
            </div>
          )}
          {hasKey && (
            <div className="flex items-start gap-2 p-2 bg-green-500/10 rounded-md">
              <Info className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              <p className="text-xs text-green-700 dark:text-green-300">
                <strong>Gemini configurado:</strong> Los resúmenes y
                traducciones usarán Gemini 2.5 Flash-Lite cuando Chrome no esté
                disponible.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Exports
// ============================================

export default AIDisclaimer;
