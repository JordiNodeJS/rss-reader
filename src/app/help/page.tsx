"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Rss,
  Plus,
  Trash2,
  Download,
  BookOpen,
  ExternalLink,
  Sun,
  Palette,
  Search,
  ArrowUpDown,
  Menu,
  ChevronLeft,
  Inbox,
  Database,
  Wifi,
  WifiOff,
  Pencil,
  Zap,
  HelpCircle,
  Home,
  Keyboard,
  Smartphone,
  Monitor,
  Globe,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
}

function FeatureCard({ icon, title, description, children }: FeatureCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            {icon}
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>
        {children}
      </CardContent>
    </Card>
  );
}

interface SectionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function Section({ id, title, icon, children }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  );
}

const tableOfContents = [
  { id: "intro", label: "Introducción", icon: <Rss className="w-4 h-4" /> },
  {
    id: "feeds",
    label: "Gestión de Feeds",
    icon: <Plus className="w-4 h-4" />,
  },
  {
    id: "articles",
    label: "Lectura de Artículos",
    icon: <BookOpen className="w-4 h-4" />,
  },
  {
    id: "offline",
    label: "Modo Offline",
    icon: <WifiOff className="w-4 h-4" />,
  },
  {
    id: "themes",
    label: "Temas y Personalización",
    icon: <Palette className="w-4 h-4" />,
  },
  {
    id: "shortcuts",
    label: "Atajos y Tips",
    icon: <Keyboard className="w-4 h-4" />,
  },
  {
    id: "responsive",
    label: "Diseño Responsivo",
    icon: <Smartphone className="w-4 h-4" />,
  },
];

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState("intro");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="shrink-0">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold">Centro de Ayuda</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-2">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Volver al Lector</span>
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Table of Contents */}
          <aside className="lg:w-64 shrink-0">
            <div className="lg:sticky lg:top-24">
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Contenido
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <nav className="space-y-1">
                    {tableOfContents.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        onClick={() => setActiveSection(item.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                          activeSection === item.id
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {item.icon}
                        {item.label}
                      </a>
                    ))}
                  </nav>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0 space-y-12">
            {/* Introduction */}
            <Section
              id="intro"
              title="Introducción"
              icon={<Rss className="w-5 h-5" />}
            >
              <Card className="bg-gradient-to-br from-primary/5 via-background to-primary/10 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="p-4 rounded-2xl bg-primary/10 shrink-0">
                      <Rss className="w-12 h-12 text-primary" />
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold">
                        Bienvenido a RSS Reader
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        RSS Reader es un lector de feeds RSS moderno,
                        minimalista y con capacidad offline. Te permite
                        suscribirte a tus fuentes de noticias favoritas y leer
                        los artículos incluso sin conexión a Internet.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="gap-1">
                          <Database className="w-3 h-3" />
                          Almacenamiento Local
                        </Badge>
                        <Badge variant="secondary" className="gap-1">
                          <WifiOff className="w-3 h-3" />
                          Modo Offline
                        </Badge>
                        <Badge variant="secondary" className="gap-1">
                          <Palette className="w-3 h-3" />
                          +40 Temas
                        </Badge>
                        <Badge variant="secondary" className="gap-1">
                          <Smartphone className="w-3 h-3" />
                          Responsivo
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Section>

            <Separator />

            {/* Feed Management */}
            <Section
              id="feeds"
              title="Gestión de Feeds"
              icon={<Plus className="w-5 h-5" />}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FeatureCard
                  icon={<Plus className="w-5 h-5" />}
                  title="Añadir Feeds"
                  description="Hay dos formas de añadir feeds a tu lector:"
                >
                  <div className="space-y-3 text-sm">
                    <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                      <p className="font-medium flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">
                          1
                        </span>
                        Feeds Predefinidos
                      </p>
                      <p className="text-muted-foreground pl-7">
                        Selecciona entre una amplia lista de medios organizados
                        por categoría (españoles, internacionales, tecnología,
                        etc.)
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                      <p className="font-medium flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">
                          2
                        </span>
                        URL Personalizada
                      </p>
                      <p className="text-muted-foreground pl-7">
                        Pega directamente la URL de cualquier feed RSS para
                        añadirlo.
                      </p>
                    </div>
                  </div>
                </FeatureCard>

                <FeatureCard
                  icon={<Pencil className="w-5 h-5" />}
                  title="Editar Feeds"
                  description="Personaliza el nombre de tus feeds para organizarlos mejor. Haz clic en el icono de edición junto al nombre del feed para cambiar su título."
                />

                <FeatureCard
                  icon={<Trash2 className="w-5 h-5" />}
                  title="Eliminar Feeds"
                  description="Elimina feeds que ya no necesites. Al eliminar un feed, también se borran todos sus artículos asociados de la base de datos local."
                />

                <FeatureCard
                  icon={<Inbox className="w-5 h-5" />}
                  title="Ver Todos los Artículos"
                  description="Usa el botón 'Todos' para ver artículos de todos tus feeds en una sola lista, ordenados por fecha."
                />
              </div>
            </Section>

            <Separator />

            {/* Article Reading */}
            <Section
              id="articles"
              title="Lectura de Artículos"
              icon={<BookOpen className="w-5 h-5" />}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FeatureCard
                  icon={<Search className="w-5 h-5" />}
                  title="Buscar Artículos"
                  description="Utiliza la barra de búsqueda para filtrar artículos por título o contenido. La búsqueda es instantánea y funciona en toda la lista de artículos."
                />

                <FeatureCard
                  icon={<ArrowUpDown className="w-5 h-5" />}
                  title="Ordenar Artículos"
                  description="Ordena los artículos por fecha: del más reciente al más antiguo o viceversa. Por defecto, los artículos más recientes aparecen primero."
                />

                <FeatureCard
                  icon={<Download className="w-5 h-5" />}
                  title="Descargar Contenido"
                  description="Descarga el contenido completo de un artículo para leerlo offline. El sistema extrae el texto, imágenes y formato del artículo original."
                >
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-sm">
                    <p className="flex items-start gap-2">
                      <Zap className="w-4 h-4 mt-0.5 shrink-0" />
                      Las imágenes se convierten a formato optimizado (WebP)
                      para reducir el espacio de almacenamiento.
                    </p>
                  </div>
                </FeatureCard>

                <FeatureCard
                  icon={<ExternalLink className="w-5 h-5" />}
                  title="Abrir en Navegador"
                  description="Abre cualquier artículo en su fuente original. Algunos sitios pueden bloquear la vista embebida, en ese caso se abrirá en una nueva pestaña."
                />

                <FeatureCard
                  icon={<BookOpen className="w-5 h-5" />}
                  title="Vista de Lectura"
                  description="Al hacer clic en un artículo se abre una vista limpia y enfocada en la lectura. Si el contenido fue descargado, se muestra el artículo completo."
                />

                <FeatureCard
                  icon={<Globe className="w-5 h-5" />}
                  title="Visor Integrado"
                  description="Visualiza artículos directamente en la aplicación con el visor integrado. Incluye controles de redimensionamiento y pantalla completa."
                />
              </div>
            </Section>

            <Separator />

            {/* Offline Mode */}
            <Section
              id="offline"
              title="Modo Offline"
              icon={<WifiOff className="w-5 h-5" />}
            >
              <Card className="bg-gradient-to-br from-emerald-500/5 via-background to-emerald-500/10 border-emerald-500/20">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-emerald-500/10">
                      <Database className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">
                        Almacenamiento Local con IndexedDB
                      </h3>
                      <p className="text-muted-foreground">
                        Todos tus feeds y artículos se almacenan localmente en
                        tu navegador usando IndexedDB. Esto significa que puedes
                        acceder a ellos incluso sin conexión a Internet.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="p-4 rounded-lg bg-background border border-border/50 space-y-2">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <Wifi className="w-4 h-4" />
                        <span className="font-medium text-sm">
                          Con conexión
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Los feeds se actualizan automáticamente y puedes
                        descargar nuevos artículos.
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-background border border-border/50 space-y-2">
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <WifiOff className="w-4 h-4" />
                        <span className="font-medium text-sm">
                          Sin conexión
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Accede a todos los artículos previamente descargados y
                        guardados.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Section>

            <Separator />

            {/* Themes */}
            <Section
              id="themes"
              title="Temas y Personalización"
              icon={<Palette className="w-5 h-5" />}
            >
              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <Palette className="w-8 h-8 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg">
                          Más de 40 Temas Disponibles
                        </h3>
                        <p className="text-muted-foreground">
                          Personaliza la apariencia de la aplicación con una
                          amplia variedad de temas. Desde estilos minimalistas
                          hasta diseños vibrantes y temáticos.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                      {[
                        "Retro Arcade",
                        "Mocha Mousse",
                        "Cyberpunk",
                        "Ocean Breeze",
                        "Catppuccin",
                        "Sage Garden",
                        "Claude",
                        "Vercel",
                      ].map((theme) => (
                        <Badge
                          key={theme}
                          variant="outline"
                          className="justify-center py-1.5"
                        >
                          {theme}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                  <FeatureCard
                    icon={<Sun className="w-5 h-5" />}
                    title="Modo Claro / Oscuro"
                    description="Alterna entre modo claro y oscuro con un solo clic. El tema se adapta automáticamente manteniendo los colores del tema seleccionado."
                  />

                  <FeatureCard
                    icon={<Palette className="w-5 h-5" />}
                    title="Carrusel de Temas"
                    description="En la cabecera encontrarás un carrusel con todos los temas disponibles. Haz clic en cualquier tema para aplicarlo instantáneamente."
                  />
                </div>
              </div>
            </Section>

            <Separator />

            {/* Shortcuts */}
            <Section
              id="shortcuts"
              title="Atajos y Tips"
              icon={<Keyboard className="w-5 h-5" />}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Tips de Uso</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <Menu className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">Menú lateral</p>
                          <p className="text-xs text-muted-foreground">
                            En móvil, accede al menú tocando el icono de
                            hamburguesa
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <Download className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">
                            Descarga selectiva
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Descarga solo los artículos que te interesen para
                            ahorrar espacio
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <Search className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">Búsqueda rápida</p>
                          <p className="text-xs text-muted-foreground">
                            La búsqueda filtra en tiempo real mientras escribes
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <Palette className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">
                            Tema persistente
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Tu tema se guarda y se aplica automáticamente al
                            volver
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Section>

            <Separator />

            {/* Responsive Design */}
            <Section
              id="responsive"
              title="Diseño Responsivo"
              icon={<Smartphone className="w-5 h-5" />}
            >
              <div className="grid gap-4 md:grid-cols-3">
                <FeatureCard
                  icon={<Smartphone className="w-5 h-5" />}
                  title="Móvil"
                  description="Menú lateral desplegable, lista de artículos en una columna y visor de artículos a pantalla completa."
                />

                <FeatureCard
                  icon={<Monitor className="w-5 h-5" />}
                  title="Tablet"
                  description="Vista híbrida con sidebar colapsable y mejor aprovechamiento del espacio horizontal."
                />

                <FeatureCard
                  icon={<Monitor className="w-5 h-5" />}
                  title="Escritorio"
                  description="Sidebar visible permanentemente, vista de dos columnas para lista y artículo."
                />
              </div>
            </Section>

            {/* Footer CTA */}
            <div className="pt-8">
              <Card className="bg-gradient-to-r from-primary/10 via-background to-primary/5 border-primary/20">
                <CardContent className="py-8 text-center space-y-4">
                  <h3 className="text-xl font-bold">¿Listo para empezar?</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Vuelve al lector y comienza a añadir tus feeds favoritos.
                    ¡Tu experiencia de lectura personalizada te espera!
                  </p>
                  <Link href="/">
                    <Button size="lg" className="gap-2">
                      <Rss className="w-4 h-4" />
                      Ir al Lector RSS
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container px-4 py-6 text-center text-sm text-muted-foreground">
          <p>RSS Reader — Creado con Next.js, React y ❤️</p>
          <p className="mt-1">
            <a
              href="https://webcode.es"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              webcode.es
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
