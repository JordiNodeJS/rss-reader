import type { Metadata } from "next";
import HelpClient from "./help-client";

export const metadata: Metadata = {
  title: "Ayuda y Documentación",
  description:
    "Aprende a usar el lector RSS, gestionar feeds y personalizar temas.",
};

export default function Page() {
  return <HelpClient />;
}
