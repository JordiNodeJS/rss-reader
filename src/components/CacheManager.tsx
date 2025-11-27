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
import { Checkbox } from "@/components/ui/checkbox";
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
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

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
      setSelectedModels(new Set()); // Reset selection when opening
    }
  }, [isOpen]);

  const toggleModelSelection = (modelId: string) => {
    setSelectedModels((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(modelId)) {
        newSet.delete(modelId);
      } else {
        newSet.add(modelId);
      }
      return newSet;
    });
  };

  const toggleAllTransformers = () => {
    const transformersIds = models
      .filter((m) => m.source === "transformers")
      .map((m) => m.id);
    
    const allSelected = transformersIds.every((id) => selectedModels.has(id));
    
    if (allSelected) {
      // Deselect all
      setSelectedModels(new Set());
    } else {
      // Select all transformers models
      setSelectedModels(new Set(transformersIds));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedModels.size === 0) return;
    
    setIsDeleting(true);
    try {
      for (const modelId of selectedModels) {
        await deleteModel(modelId);
      }
      toast.success(`${selectedModels.size} modelo(s) eliminado(s)`);
      setSelectedModels(new Set());
      refreshModels();
    } catch (error) {
      toast.error("Error al eliminar los modelos");
      console.error(error);
    } finally {
      setIsDeleting(false);
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

  const transformersModels = models.filter((m) => m.source === "transformers");
  const chromeModels = models.filter((m) => m.source === "chrome");
  
  const totalSize = transformersModels.reduce((acc, m) => acc + m.size, 0);
  
  const selectedSize = transformersModels
    .filter((m) => selectedModels.has(m.id))
    .reduce((acc, m) => acc + m.size, 0);
    
  const allTransformersSelected = transformersModels.length > 0 && 
    transformersModels.every((m) => selectedModels.has(m.id));

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
              <span className="text-sm font-medium">
                {selectedModels.size > 0 
                  ? `Seleccionado (${selectedModels.size})`
                  : "Espacio Gestionable"}
              </span>
            </div>
            <span className="font-bold text-sm">
              {transformersModels.length > 0 
                ? selectedModels.size > 0
                  ? formatBytes(selectedSize)
                  : formatBytes(totalSize)
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
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                        Modelos Descargados (eliminables)
                      </p>
                      <button
                        onClick={toggleAllTransformers}
                        className="text-[10px] text-primary hover:underline"
                      >
                        {allTransformersSelected ? "Deseleccionar todo" : "Seleccionar todo"}
                      </button>
                    </div>
                    {transformersModels.map((model) => (
                      <div
                        key={model.id}
                        className={`flex items-center gap-3 p-2 rounded-md transition-colors cursor-pointer hover:bg-muted/50 ${
                          selectedModels.has(model.id) ? "bg-primary/10 border border-primary/30" : ""
                        }`}
                        onClick={() => toggleModelSelection(model.id)}
                      >
                        <Checkbox
                          checked={selectedModels.has(model.id)}
                          onCheckedChange={() => toggleModelSelection(model.id)}
                          className="shrink-0"
                        />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-sm font-medium truncate" title={model.id}>
                            {model.id.split("/").pop()}
                          </span>
                          <span className="text-xs text-muted-foreground flex gap-2">
                            <span>{formatBytes(model.size)}</span>
                            <span>•</span>
                            <span>{model.fileCount} archivos</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-between items-center pt-2 gap-2">
            {selectedModels.size > 0 ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="gap-2"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Eliminar {selectedModels.size} seleccionado{selectedModels.size > 1 ? "s" : ""}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar {selectedModels.size} modelo{selectedModels.size > 1 ? "s" : ""}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esto liberará {formatBytes(selectedSize)} de espacio. Los modelos 
                      se descargarán nuevamente cuando los necesites.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteSelected}>
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <div />
            )}
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant={selectedModels.size > 0 ? "outline" : "destructive"} 
                  size="sm" 
                  disabled={transformersModels.length === 0}
                >
                  Eliminar Todos
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar todos los modelos?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esto liberará {formatBytes(totalSize)} de espacio pero requerirá descargar los modelos
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

