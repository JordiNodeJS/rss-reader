import type { Metadata } from "next";
import TutorialClient from "./tutorial-client";

export const metadata: Metadata = {
  title: "Tutorial - Cómo usar RSS Reader",
  description:
    "Guía paso a paso para aprender a usar RSS Reader. Aprende a añadir feeds, leer artículos, personalizar temas y usar el modo offline.",
};

export default function TutorialPage() {
  return <TutorialClient />;
}
