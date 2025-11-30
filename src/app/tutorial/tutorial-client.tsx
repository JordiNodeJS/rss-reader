"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Rss,
  Plus,
  BookOpen,
  Palette,
  ChevronLeft,
  Home,
  GraduationCap,
  ChevronRight,
  WifiOff,
  Sparkles,
  Search,
  Star,
  Download,
  Menu,
  ArrowRight,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface TutorialStepProps {
  stepNumber: number;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  tips?: string[];
  reverse?: boolean;
}

function TutorialStep({
  stepNumber,
  title,
  description,
  imageSrc,
  imageAlt,
  tips,
  reverse = false,
}: TutorialStepProps) {
  return (
    <div
      className={`flex flex-col ${
        reverse ? "lg:flex-row-reverse" : "lg:flex-row"
      } gap-8 items-center`}
    >
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg">
            {stepNumber}
          </span>
          <h3 className="text-2xl font-bold">{title}</h3>
        </div>
        <p className="text-muted-foreground text-lg leading-relaxed">
          {description}
        </p>
        {tips && tips.length > 0 && (
          <div className="space-y-2 mt-4">
            <p className="text-sm font-medium text-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Tips
            </p>
            <ul className="space-y-1">
              {tips.map((tip, index) => (
                <li
                  key={index}
                  className="text-sm text-muted-foreground flex items-start gap-2"
                >
                  <ChevronRight className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="flex-1 w-full">
        <div className="relative rounded-xl overflow-hidden border border-border shadow-lg hover:shadow-xl transition-shadow duration-300">
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={800}
            height={500}
            className="w-full h-auto"
            priority={stepNumber <= 2}
          />
        </div>
      </div>
    </div>
  );
}

interface FeatureHighlightProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureHighlight({ icon, title, description }: FeatureHighlightProps) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            {icon}
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold">{title}</h4>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const tableOfContents = [
  { id: "intro", label: "Introducción", icon: <Rss className="w-4 h-4" /> },
  {
    id: "add-feeds",
    label: "Añadir Feeds",
    icon: <Plus className="w-4 h-4" />,
  },
  {
    id: "read-articles",
    label: "Leer Artículos",
    icon: <BookOpen className="w-4 h-4" />,
  },
  {
    id: "themes",
    label: "Personalizar",
    icon: <Palette className="w-4 h-4" />,
  },
  {
    id: "features",
    label: "Características",
    icon: <Sparkles className="w-4 h-4" />,
  },
];

export default function TutorialClient() {
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
              <GraduationCap className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold">Tutorial</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-2">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Ir al Lector</span>
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
          <main className="flex-1 min-w-0 space-y-16">
            {/* Hero Section */}
            <section id="intro" className="scroll-mt-24">
              <Card className="bg-gradient-to-br from-primary/5 via-background to-primary/10 border-primary/20 overflow-hidden">
                <CardContent className="pt-8 pb-8">
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="space-y-6 flex-1">
                      <div className="space-y-2">
                        <Badge variant="secondary" className="mb-2">
                          Tutorial Interactivo
                        </Badge>
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                          Aprende a usar{" "}
                          <span className="text-primary">RSS Reader</span>
                        </h2>
                      </div>
                      <p className="text-lg text-muted-foreground leading-relaxed">
                        Descubre cómo sacar el máximo provecho a tu lector de
                        feeds RSS. En esta guía aprenderás a añadir fuentes,
                        personalizar la interfaz y leer artículos incluso sin
                        conexión.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <Badge variant="outline" className="gap-1 py-1.5 px-3">
                          <Plus className="w-3 h-3" />5 min de lectura
                        </Badge>
                        <Badge variant="outline" className="gap-1 py-1.5 px-3">
                          <Star className="w-3 h-3" />
                          Principiantes
                        </Badge>
                      </div>
                    </div>
                    <div className="flex-1 w-full max-w-md">
                      <div className="relative rounded-xl overflow-hidden border border-border shadow-2xl">
                        <Image
                          src="/images/tutorial/home-overview.png"
                          alt="Vista general de RSS Reader"
                          width={800}
                          height={500}
                          className="w-full h-auto"
                          priority
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <Separator />

            {/* Step 1: Adding Feeds */}
            <section id="add-feeds" className="scroll-mt-24 space-y-12">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <Plus className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight">
                  Añadir Feeds RSS
                </h2>
              </div>

              <TutorialStep
                stepNumber={1}
                title="Abre el menú lateral"
                description="Haz clic en el icono del menú (☰) en la esquina superior derecha para abrir el panel de navegación. Aquí encontrarás todas las opciones para gestionar tus feeds."
                imageSrc="/images/tutorial/sidebar-menu.png"
                imageAlt="Menú lateral con opciones de navegación"
                tips={[
                  "En escritorio, el menú puede estar siempre visible",
                  "Puedes arrastrar y soltar feeds para reordenarlos",
                ]}
              />

              <TutorialStep
                stepNumber={2}
                title="Añade un nuevo feed"
                description="Haz clic en 'Añadir feed' para abrir el diálogo. Puedes elegir entre feeds predefinidos de medios populares o introducir la URL de cualquier feed RSS personalizado."
                imageSrc="/images/tutorial/add-feed-dialog.png"
                imageAlt="Diálogo para añadir un nuevo feed"
                tips={[
                  "Prueba con feeds de tecnología como Hacker News o Ars Technica",
                  "Puedes dar un nombre personalizado a cada feed",
                ]}
                reverse
              />

              <TutorialStep
                stepNumber={3}
                title="Explora los feeds predefinidos"
                description="Tenemos una amplia selección de medios organizados por categoría: prensa española, internacional, tecnología, y más. Solo selecciona uno y se añadirá automáticamente."
                imageSrc="/images/tutorial/feed-presets-list.png"
                imageAlt="Lista de feeds predefinidos disponibles"
                tips={[
                  "Los feeds se organizan por país y categoría",
                  "Incluye medios como El País, BBC, The Guardian, Xataka...",
                ]}
              />
            </section>

            <Separator />

            {/* Step 2: Reading Articles */}
            <section id="read-articles" className="scroll-mt-24 space-y-12">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight">
                  Leer Artículos
                </h2>
              </div>

              <TutorialStep
                stepNumber={4}
                title="Lee tus artículos"
                description="Haz clic en 'Leer' en cualquier artículo para abrir la vista de lectura. Verás el título, fecha, y enlaces al artículo original. También puedes generar resúmenes con IA o traducir el contenido."
                imageSrc="/images/tutorial/article-reader.png"
                imageAlt="Vista de lectura de un artículo"
                tips={[
                  "El resumen con IA se genera localmente en tu navegador",
                  "La traducción usa Chrome Translator API (Chrome 131+)",
                  "Puedes abrir el artículo original en una nueva pestaña",
                ]}
              />
            </section>

            <Separator />

            {/* Step 3: Themes */}
            <section id="themes" className="scroll-mt-24 space-y-12">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <Palette className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight">
                  Personaliza tu Experiencia
                </h2>
              </div>

              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Tema Cyberpunk</h3>
                  <p className="text-muted-foreground">
                    Un tema oscuro con acentos neón, perfecto para los amantes
                    del estilo futurista.
                  </p>
                  <div className="relative rounded-xl overflow-hidden border border-border shadow-lg">
                    <Image
                      src="/images/tutorial/theme-cyberpunk.png"
                      alt="RSS Reader con tema Cyberpunk"
                      width={600}
                      height={400}
                      className="w-full h-auto"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Tema Ocean Breeze</h3>
                  <p className="text-muted-foreground">
                    Colores suaves y relajantes inspirados en el océano, ideal
                    para largas sesiones de lectura.
                  </p>
                  <div className="relative rounded-xl overflow-hidden border border-border shadow-lg">
                    <Image
                      src="/images/tutorial/theme-ocean.png"
                      alt="RSS Reader con tema Ocean Breeze"
                      width={600}
                      height={400}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </div>

              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Palette className="w-8 h-8 text-primary shrink-0" />
                    <div className="space-y-2">
                      <h4 className="font-semibold text-lg">
                        +40 temas disponibles
                      </h4>
                      <p className="text-muted-foreground">
                        Desde estilos minimalistas como{" "}
                        <strong>Clean Slate</strong> hasta diseños vibrantes
                        como <strong>Retro Arcade</strong>. Usa el carrusel en
                        la cabecera para cambiar de tema al instante. Tu
                        preferencia se guarda automáticamente.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <Separator />

            {/* Features Section */}
            <section id="features" className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight">
                  Características Destacadas
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <FeatureHighlight
                  icon={<WifiOff className="w-5 h-5" />}
                  title="Modo Offline"
                  description="Tus artículos descargados están disponibles sin conexión gracias a IndexedDB."
                />
                <FeatureHighlight
                  icon={<Search className="w-5 h-5" />}
                  title="Búsqueda Instantánea"
                  description="Filtra artículos en tiempo real mientras escribes en la barra de búsqueda."
                />
                <FeatureHighlight
                  icon={<Star className="w-5 h-5" />}
                  title="Favoritos"
                  description="Marca tus artículos favoritos para encontrarlos fácilmente después."
                />
                <FeatureHighlight
                  icon={<Download className="w-5 h-5" />}
                  title="Descarga de Contenido"
                  description="Guarda el contenido completo de artículos con imágenes optimizadas."
                />
                <FeatureHighlight
                  icon={<Sparkles className="w-5 h-5" />}
                  title="Resumen con IA"
                  description="Genera resúmenes de artículos usando modelos de IA locales."
                />
                <FeatureHighlight
                  icon={<Menu className="w-5 h-5" />}
                  title="Drag & Drop"
                  description="Reordena tus feeds arrastrándolos a la posición deseada."
                />
              </div>
            </section>

            <Separator />

            {/* CTA Section */}
            <section className="text-center space-y-6 py-8">
              <h2 className="text-2xl font-bold">¿Listo para empezar?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Ahora que conoces las funcionalidades básicas, es hora de
                explorar RSS Reader por ti mismo. ¡Añade tus feeds favoritos y
                disfruta de una experiencia de lectura personalizada!
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/">
                  <Button size="lg" className="gap-2">
                    Ir al Lector RSS
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/help">
                  <Button variant="outline" size="lg" className="gap-2">
                    Ver Documentación
                    <BookOpen className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8 mt-8">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>
            RSS Reader — Creado con Next.js, React y ❤️ por{" "}
            <a
              href="https://webcode.es/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              webcode.es
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
