import HomeClient from "./page.client";
import { cookies } from "next/headers";

export default async function Page() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("sidebar-width");
  const width = cookie ? parseInt(cookie.value, 10) : undefined;
  const parsed = Number.isNaN(width) ? undefined : width;
  // Constrain between 200 and 600 to match client-side behavior
  const initialSidebarWidth = parsed
    ? Math.min(Math.max(parsed, 200), 600)
    : undefined;

  return <HomeClient initialSidebarWidth={initialSidebarWidth} />;
}
