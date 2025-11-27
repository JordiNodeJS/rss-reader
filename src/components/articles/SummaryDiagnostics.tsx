/**
 * Summary Diagnostics Component
 * 
 * Shows diagnostic information about Chrome Summarizer API availability
 */

"use client";

import { useEffect, useState } from "react";
import { getSummarizerAvailability } from "@/lib/summarization";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Info, HardDrive } from "lucide-react";

interface SummaryDiagnosticsProps {
  /** Optional error message to display */
  errorMessage?: string | null;
}

export function SummaryDiagnostics({ errorMessage }: SummaryDiagnosticsProps = {}) {
  const [availability, setAvailability] = useState<string>("checking");
  const [apiErrorMessage, setApiErrorMessage] = useState<string | undefined>();
  const [chromeVersion, setChromeVersion] = useState<number | null>(null);
  const [isChrome, setIsChrome] = useState(false);
  
  // Use prop error message if provided, otherwise use API error
  const displayError = errorMessage || apiErrorMessage;

  useEffect(() => {
    // Detect browser and version
    const userAgent = navigator.userAgent;
    const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
    const edgeMatch = userAgent.match(/Edg\/(\d+)/);
    
    if (chromeMatch || edgeMatch) {
      // Schedule state updates to avoid synchronous setState within the effect
      // which can trigger cascading renders. This runs in the next microtask.
      Promise.resolve().then(() => {
        if (chromeMatch) {
          setIsChrome(true);
          setChromeVersion(parseInt(chromeMatch[1], 10));
        } else if (edgeMatch) {
          setIsChrome(false);
          setChromeVersion(parseInt(edgeMatch[1], 10));
        }
      });
    }

    // Check API availability
    getSummarizerAvailability()
      .then((result) => {
        setAvailability(result.status);
        setApiErrorMessage(result.error);
        
        // If we have a prop error message about space, prioritize it
        if (errorMessage && errorMessage.includes("space")) {
          setAvailability("insufficient-space");
        }
      })
      .catch(() => {
        setAvailability("error");
      });
  }, [errorMessage]);

  const getStatusIcon = () => {
    if (availability === "available") {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    if (availability === "downloadable" || availability === "downloading") {
      return <Info className="w-4 h-4 text-blue-500" />;
    }
    if (availability === "insufficient-space") {
      return <HardDrive className="w-4 h-4 text-orange-500" />;
    }
    return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
  };

  const getStatusMessage = () => {
    if (availability === "available") {
      return "API disponible";
    }
    if (availability === "downloadable") {
      return "Modelo descargable";
    }
    if (availability === "downloading") {
      return "Descargando modelo...";
    }
    if (availability === "insufficient-space") {
      return "Espacio insuficiente en disco";
    }
    if (availability === "unavailable") {
      return "API no disponible";
    }
    if (availability === "not-supported") {
      return "Navegador no soportado";
    }
    if (availability === "checking") {
      return "Verificando...";
    }
    return "Error al verificar";
  };

  return (
    <div className="text-xs text-muted-foreground space-y-1">
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span>{getStatusMessage()}</span>
      </div>
      {chromeVersion !== null && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {isChrome ? "Chrome" : "Edge"} {chromeVersion}
          </Badge>
          {chromeVersion < 138 && (
            <span className="text-yellow-600 dark:text-yellow-400">
              (Se requiere Chrome 138+)
            </span>
          )}
        </div>
      )}
      {availability === "insufficient-space" && (
        <div className="text-xs text-muted-foreground mt-2 space-y-2">
          <div className="p-2 bg-orange-500/10 border border-orange-500/20 rounded">
            <p className="font-medium text-orange-600 dark:text-orange-400 mb-1 flex items-center gap-1">
              <HardDrive className="w-3 h-3" />
              Se requiere espacio en disco
            </p>
            <p className="text-xs mb-2">
              Chrome necesita al menos <strong>22GB de espacio libre</strong> en el volumen donde está instalado tu perfil de Chrome para descargar el modelo Gemini Nano.
            </p>
            {displayError && (
              <div className="text-xs mt-2 p-1.5 bg-orange-500/5 border border-orange-500/10 rounded">
                <p className="font-mono text-orange-700 dark:text-orange-300 break-words">
                  {displayError}
                </p>
              </div>
            )}
          </div>
          <div className="text-xs space-y-1">
            <p><strong>Para solucionarlo:</strong></p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li>Libera espacio en tu disco (elimina archivos temporales, vacía la papelera)</li>
              <li>Verifica el espacio disponible en Configuración de Windows</li>
              <li>El modelo se descargará automáticamente cuando haya suficiente espacio</li>
            </ul>
          </div>
        </div>
      )}
      {availability === "not-supported" && (
        <div className="text-xs text-muted-foreground mt-1">
          La API de Summarizer solo está disponible en Chrome 138+ en Windows, macOS, Linux o Chromebook Plus.
        </div>
      )}
      {availability === "unavailable" && !errorMessage && (
        <div className="text-xs text-muted-foreground mt-1">
          La API no está disponible. Puede ser por requisitos de hardware o configuración.
        </div>
      )}
    </div>
  );
}

