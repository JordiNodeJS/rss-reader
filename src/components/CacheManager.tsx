import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Languages, Trash2, Loader2, HardDrive } from "lucide-react";
import {
  CachedModel,
  getDownloadedModels,
  getChromeTranslatorModels,
  deleteModel,
  clearTranslationModelCache,
  getAllCacheNames,
} from "@/lib/translation";
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
  const [allCacheNames, setAllCacheNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const refreshModels = async () => {
    setIsLoading(true);
    try {
      // Get Transformers.js models from Cache API
      const transformersModels = await getDownloadedModels();
      
      // Get Chrome Translator API models
      const chromeModels = await getChromeTranslatorModels();
      
      // Combine both
      const allModels = [...transformersModels, ...chromeModels];
      setModels(allModels);
      
      // If no models found, check for raw cache names for debugging
      if (allModels.length === 0) {
         const names = await getAllCacheNames();
         setAllCacheNames(names);
      } else {
         setAllCacheNames([]);
      }
    } catch (error) {
      console.error("Failed to load models:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshModels();
    }
  }, [isOpen]);

  const handleDeleteModel = async (modelId: string) => {
    try {
      await deleteModel(modelId);
      toast.success(`Modelo eliminado`);
      refreshModels();
    } catch (error) {
      toast.error("Error al eliminar el modelo");
      console.error(error);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearTranslationModelCache();
      toast.success("Caché de traducción eliminada");
      refreshModels();
    } catch (error) {
      toast.error("Error al limpiar la caché");
      console.error(error);
    }
  };

  const totalSize = models
    .filter((m) => m.source === "transformers")
    .reduce((acc, m) => acc + m.size, 0);
  
  const transformersModels = models.filter((m) => m.source === "transformers");
  const chromeModels = models.filter((m) => m.source === "chrome");

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full max-w-full gap-2 text-xs"
          size="sm"
        >
          <Languages className="w-4 h-4 shrink-0" />
          <span className="truncate">Administrar Modelos IA</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modelos de Traducción</DialogTitle>
          <DialogDescription>
            Gestiona los modelos descargados localmente. Estos modelos permiten la
            traducción sin conexión.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Espacio Gestionable</span>
            </div>
            <span className="font-bold text-sm">
              {transformersModels.length > 0 
                ? formatBytes(totalSize) 
                : "—"}
            </span>
          </div>

          <ScrollArea className="h-[200px] w-full rounded-md border p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : models.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm text-center p-4">
                <p>No hay modelos descargados.</p>
                <p className="text-xs mt-1 opacity-70">
                  Se descargarán automáticamente al traducir.
                </p>
                
                {allCacheNames.length > 0 && (
                   <div className="mt-4 w-full text-left border-t pt-2">
                     <p className="text-[10px] uppercase font-bold mb-1">Debug: Cachés detectadas</p>
                     <ul className="text-[10px] space-y-1 font-mono bg-muted/50 p-2 rounded max-h-[60px] overflow-auto">
                       {allCacheNames.map(name => (
                         <li key={name}>{name}</li>
                       ))}
                     </ul>
                   </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Chrome Models Section */}
                {chromeModels.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                      Modelos de Chrome (integrados)
                    </p>
                    {chromeModels.map((model) => (
                      <div
                        key={model.id}
                        className="flex items-center justify-between group pl-2 border-l-2 border-blue-500/30"
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium truncate max-w-[180px]" title={model.id}>
                            {model.id.replace("Chrome Translator: ", "").replace("Chrome ", "")}
                          </span>
                          <span className="text-xs text-blue-500">
                            Gestionado por el navegador
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Transformers.js Models Section */}
                {transformersModels.length > 0 && (
                  <div className="space-y-2">
                    {chromeModels.length > 0 && (
                      <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mt-4">
                        Modelos Descargados (eliminables)
                      </p>
                    )}
                    {transformersModels.map((model) => (
                      <div
                        key={model.id}
                        className="flex items-center justify-between group"
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium truncate max-w-[200px]" title={model.id}>
                            {model.id.split("/").pop()}
                          </span>
                          <span className="text-xs text-muted-foreground flex gap-2">
                            <span>{formatBytes(model.size)}</span>
                            <span>•</span>
                            <span>{model.fileCount} archivos</span>
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteModel(model.id)}
                          title="Eliminar modelo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-end pt-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={transformersModels.length === 0}>
                  Eliminar Descargados
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar todos los modelos?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esto liberará espacio pero requerirá descargar los modelos
                    nuevamente la próxima vez que traduzcas.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAll}>
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

