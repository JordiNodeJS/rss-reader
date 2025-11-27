import type { Metadata } from "next";
import HelpClient from "./help-client";

export const metadata: Metadata = {
  title: "Help & Documentation",
  description:
    "Learn how to use the RSS Reader, manage feeds, and customize themes.",
};

export default function Page() {
  return <HelpClient />;
}
