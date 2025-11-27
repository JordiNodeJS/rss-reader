import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  Loader2,
  HardDrive,
  ExternalLink,
  Info,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  CachedModel,
  getDownloadedModels,
  getChromeTranslatorModels,
  clearTranslationModelCache,
  deleteModel,
} from "@/lib/translation";
import {
  getCachedSummarizationModels,
  clearSummarizationModelCache,
  getSummarizationCacheSize,
  SUMMARIZATION_MODELS,
} from "@/lib/summarization";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SummarizationCachedModel {
  name: string;
  size: number;
  url: string;
}

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function CacheManager() {
  const [models, setModels] = useState<CachedModel[]>([]);
  const [summarizationModels, setSummarizationModels] = useState<
    SummarizationCachedModel[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isClearingSummarization, setIsClearingSummarization] = useState(false);
  const [deletingChromeModel, setDeletingChromeModel] = useState<string | null>(
    null
  );

  const refreshModels = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get Transformers.js models from Cache API (translation)
      const transformersModels = await getDownloadedModels();

      // Get Chrome Translator API models
      const chromeModels = await getChromeTranslatorModels();

      // Get summarization models
      const summModels = await getCachedSummarizationModels();

      // Combine translation models
      setModels([...transformersModels, ...chromeModels]);
      setSummarizationModels(summModels);
    } catch (error) {
      console.error("Failed to load models:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      refreshModels();
    }
  }, [isOpen, refreshModels]);

  const handleClearTransformersCache = async () => {
    setIsClearing(true);
    try {
      await clearTranslationModelCache();
      toast.success("Caché de modelos de traducción eliminada correctamente");
      refreshModels();
    } catch (error) {
      toast.error("Error al limpiar la caché");
      console.error(error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearSummarizationCache = async () => {
    setIsClearingSummarization(true);
    try {
      await clearSummarizationModelCache();
      toast.success("Caché de modelos de resumen eliminada correctamente");
      refreshModels();
    } catch (error) {
      toast.error("Error al limpiar la caché de resumen");
      console.error(error);
    } finally {
      setIsClearingSummarization(false);
    }
  };

  const transformersModels = models.filter((m) => m.source === "transformers");
  const chromeModels = models.filter((m) => m.source === "chrome");

  const totalTransformersSize = transformersModels.reduce(
    (acc, m) => acc + m.size,
    0
  );
  const totalSummarizationSize = summarizationModels.reduce(
    (acc, m) => acc + m.size,
    0
  );

  const handleDeleteChromeModel = async (modelId: string) => {
    setDeletingChromeModel(modelId);
    try {
      await deleteModel(modelId);

      // Wait a bit and refresh to check if model was actually deleted
      await new Promise((resolve) => setTimeout(resolve, 500));
      await refreshModels();

      // Check if model still exists
      const updatedModels = await getChromeTranslatorModels();
      const stillExists = updatedModels.some((m) => m.id === modelId);

      if (stillExists) {
        toast.warning(
          "El modelo se eliminó de memoria, pero puede seguir disponible en el almacenamiento interno de Chrome. " +
            "Usa chrome://on-device-translation-internals/ para eliminarlo completamente.",
          { duration: 6000 }
        );
      } else {
        toast.success("Modelo eliminado correctamente");
      }
    } catch (error) {
      console.error("Error deleting Chrome model:", error);
      toast.error(
        "No se pudo eliminar el modelo. Puede que Chrome no permita eliminarlo desde la aplicación. " +
          "Intenta usar chrome://on-device-translation-internals/",
        { duration: 6000 }
      );
    } finally {
      setDeletingChromeModel(null);
    }
  };

  const openChromeTranslatorSettings = () => {
    // This won't work directly due to browser security, but we can show a toast with instructions
    toast.info(
      "Copia y pega en tu navegador:\nchrome://on-device-translation-internals/",
      { duration: 8000 }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full max-w-full gap-2 text-xs"
          size="sm"
        >
          <HardDrive className="w-4 h-4 shrink-0" />
          <span className="truncate">Caché de Modelos IA</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Caché de Modelos IA
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={refreshModels}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Los modelos de traducción se descargan localmente para funcionar sin
            conexión.
            <br />
            <span className="text-xs opacity-70">
              Los feeds y artículos NO se verán afectados al limpiar esta caché.
            </span>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[300px] w-full">
          <div className="flex flex-col gap-4 mt-2 pr-4">
            {/* Transformers.js Models Section */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="font-medium text-sm">Modelos Locales</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Transformers.js
                </span>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : transformersModels.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No hay modelos descargados.
                </p>
              ) : (
                <div className="space-y-2">
                  {transformersModels.map((model) => (
                    <div
                      key={model.id}
                      className="flex items-center justify-between text-sm bg-muted/50 rounded px-3 py-2"
                    >
                      <span className="truncate flex-1" title={model.id}>
                        {model.id.split("/").pop() || model.id}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2 shrink-0">
                        {formatBytes(model.size)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {transformersModels.length > 0 && (
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm font-medium">
                    Total: {formatBytes(totalTransformersSize)}
                  </span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-1.5"
                        disabled={isClearing}
                      >
                        {isClearing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        Limpiar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          ¿Eliminar modelos locales?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Esto liberará {formatBytes(totalTransformersSize)} de
                          espacio. Los modelos se descargarán de nuevo cuando
                          los necesites.
                          <br />
                          <br />
                          <strong>
                            Tus feeds y artículos NO se verán afectados.
                          </strong>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleClearTransformersCache}
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>

            {/* Chrome Translator Models Section */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="font-medium text-sm">Modelos de Chrome</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[250px]">
                      <p className="text-xs">
                        Los modelos de Chrome se gestionan internamente por el
                        navegador. Puedes intentar eliminarlos desde aquí, pero
                        si Chrome no lo permite, usa
                        chrome://on-device-translation-internals/ para
                        gestionarlos manualmente.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className="text-xs text-muted-foreground">Integrado</span>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : chromeModels.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No hay modelos de Chrome disponibles.
                </p>
              ) : (
                <div className="space-y-2">
                  {chromeModels.map((model) => {
                    const isDeleting = deletingChromeModel === model.id;
                    const displayName = model.id
                      .replace("Chrome Translator: ", "")
                      .replace("Chrome ", "");
                    return (
                      <div
                        key={model.id}
                        className="flex items-center justify-between text-sm bg-muted/50 rounded px-3 py-2 gap-2"
                      >
                        <span className="truncate flex-1">{displayName}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-blue-500/80">
                            gestionado por Chrome
                          </span>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive hover:text-destructive"
                                disabled={isDeleting}
                              >
                                {isDeleting ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3 h-3" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  ¿Eliminar modelo de Chrome?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Se intentará eliminar el modelo{" "}
                                  <strong>{displayName}</strong>.
                                  <br />
                                  <br />
                                  <span className="text-xs">
                                    ⚠️ Nota: Los modelos de Chrome se almacenan
                                    internamente y puede que no se puedan
                                    eliminar completamente desde esta
                                    aplicación. Si el modelo sigue apareciendo
                                    después de eliminarlo, usa{" "}
                                    <code className="bg-muted px-1 rounded">
                                      chrome://on-device-translation-internals/
                                    </code>{" "}
                                    para gestionarlo manualmente.
                                  </span>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDeleteChromeModel(model.id)
                                  }
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {chromeModels.length > 0 && (
                <div className="pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 text-xs"
                    onClick={openChromeTranslatorSettings}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Gestionar en Chrome
                  </Button>
                  <p className="text-[10px] text-muted-foreground mt-2 text-center">
                    Abre{" "}
                    <code className="bg-muted px-1 rounded">
                      chrome://on-device-translation-internals/
                    </code>
                  </p>
                </div>
              )}
            </div>

            {/* Summarization Models Section */}
            <div className="rounded-lg border p-4 space-y-3 border-purple-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span className="font-medium text-sm">
                    Modelos de Resumen
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Transformers.js
                </span>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : summarizationModels.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No hay modelos de resumen descargados.
                  <br />
                  <span className="text-xs opacity-70">
                    Se descargarán automáticamente al usar la función de
                    resumen.
                  </span>
                </p>
              ) : (
                <div className="space-y-2">
                  {summarizationModels.map((model) => (
                    <div
                      key={model.url}
                      className="flex items-center justify-between text-sm bg-muted/50 rounded px-3 py-2"
                    >
                      <span className="truncate flex-1" title={model.name}>
                        {model.name}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2 shrink-0">
                        {formatBytes(model.size)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {summarizationModels.length > 0 && (
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm font-medium">
                    Total: {formatBytes(totalSummarizationSize)}
                  </span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-1.5"
                        disabled={isClearingSummarization}
                      >
                        {isClearingSummarization ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        Limpiar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          ¿Eliminar modelos de resumen?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Esto liberará {formatBytes(totalSummarizationSize)} de
                          espacio. Los modelos se descargarán de nuevo cuando
                          los necesites.
                          <br />
                          <br />
                          <strong>
                            Tus feeds y artículos NO se verán afectados.
                          </strong>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleClearSummarizationCache}
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}

              {/* Available models info */}
              <div className="pt-2 border-t text-xs text-muted-foreground">
                <p className="font-medium mb-1">Modelos disponibles:</p>
                <ul className="space-y-0.5">
                  {Object.entries(SUMMARIZATION_MODELS).map(([key, model]) => (
                    <li key={key} className="flex justify-between">
                      <span>{model.name}</span>
                      <span className="opacity-70">{model.size}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Info Note */}
            <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground">
              <p className="flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>¿Qué modelos se utilizan?</strong>
                  <br />
                  <strong>Traducción:</strong> Chrome incluye traducción
                  integrada (más rápida). Como fallback, usamos modelos de
                  Transformers.js.
                  <br />
                  <strong>Resumen:</strong> Usamos modelos DistilBART ligeros
                  (~60-270MB) que funcionan completamente en el navegador.
                </span>
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
