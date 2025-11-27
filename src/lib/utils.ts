import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Determine whether a given URL is likely an image URL and not a video or tracking pixel
export function isValidImageUrl(url?: string | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const lowered = url.toLowerCase();
  if (
    lowered.includes("pixel") ||
    lowered.includes("tracking") ||
    lowered.includes("beacon") ||
    lowered.includes("youtube.com/watch") ||
    lowered.includes("youtu.be/") ||
    lowered.includes("vimeo.com/") ||
    lowered.includes(".mp4") ||
    lowered.includes(".webm") ||
    lowered.includes(".ogg") ||
    lowered.includes(".mov") ||
    lowered.includes(".mpeg")
  )
    return false;

  try {
    const u = new URL(url);
    const allowedImageExtRegex =
      /\.(jpe?g|png|gif|webp|avif|svg|bmp|ico)(\?.*)?$/i;
    const pathMatch = allowedImageExtRegex.test(u.pathname + (u.search || ""));
    const hostLooksLikeImgHost =
      /(^|\.)((image|img|static|cdn|media)\.|images|imgur|cloudinary|unsplash|picsum|pinterest)\./i.test(
        u.hostname + u.pathname
      );
    return pathMatch || hostLooksLikeImgHost;
  } catch {
    return false;
  }
}
