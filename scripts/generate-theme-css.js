/**
 * Script to automate theme installation from tweakcn.com
 * Run with: node scripts/generate-theme-css.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// All themes to install
const THEMES_TO_INSTALL = [
  "catppuccin",
  "claymorphism",
  "clean-slate",
  "cosmic-night",
  "cyberpunk",
  "darkmatter",
  "doom-64",
  "elegant-luxury",
  "graphite",
  "kodama-grove",
  "midnight-bloom",
  "modern-minimal",
  "mono",
  "nature",
  "neo-brutalism",
  "northern-lights",
  "notebook",
  "ocean-breeze",
  "pastel-dreams",
  "perpetuity",
  "quantum-rose",
  "soft-pop",
  "solar-dusk",
  "starry-night",
  "sunset-horizon",
  "supabase",
  "t3-chat",
  "twitter",
  "vercel",
  "vintage-paper",
  "violet-bloom",
];

const THEMES_DIR = path.join(__dirname, "../public/styles/themes");

function cssVarsToString(vars) {
  return Object.entries(vars)
    .map(([key, value]) => `  --${key}: ${value};`)
    .join("\n");
}

function createThemeCSSFile(themeName, lightVars, darkVars) {
  const displayName = themeName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const content = `/* ${displayName} Theme */
.theme-${themeName} {
${cssVarsToString(lightVars)}
}

.theme-${themeName}.dark {
${cssVarsToString(darkVars)}
}
`;

  const filePath = path.join(THEMES_DIR, `${themeName}.css`);
  fs.writeFileSync(filePath, content);
  console.log(`Created: ${themeName}.css`);
}

async function fetchThemeJSON(themeName) {
  const url = `https://tweakcn.com/r/themes/${themeName}.json`;
  console.log(`Fetching: ${themeName}...`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch ${themeName}: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log("Starting theme generation...\n");

  // Ensure themes directory exists
  if (!fs.existsSync(THEMES_DIR)) {
    fs.mkdirSync(THEMES_DIR, { recursive: true });
  }

  const results = {
    success: [],
    failed: [],
  };

  for (const themeName of THEMES_TO_INSTALL) {
    const json = await fetchThemeJSON(themeName);

    if (json && json.cssVars) {
      const lightVars = json.cssVars.light || {};
      const darkVars = json.cssVars.dark || {};

      createThemeCSSFile(themeName, lightVars, darkVars);
      results.success.push(themeName);
    } else {
      results.failed.push(themeName);
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Successful: ${results.success.length}`);
  console.log(`Failed: ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.log("Failed themes:", results.failed.join(", "));
  }
}

main();
