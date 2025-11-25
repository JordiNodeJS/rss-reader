#!/bin/bash

# Script to install themes from tweakcn.com and create theme CSS files
# Usage: ./install-themes.sh

cd "$(dirname "$0")/.."

THEMES=(
  "bubblegum"
  "caffeine"
  "catppuccin"
  "claymorphism"
  "clean-slate"
  "cosmic-night"
  "cyberpunk"
  "darkmatter"
  "doom-64"
  "elegant-luxury"
  "graphite"
  "kodama-grove"
  "midnight-bloom"
  "modern-minimal"
  "mono"
  "nature"
  "neo-brutalism"
  "northern-lights"
  "notebook"
  "ocean-breeze"
  "pastel-dreams"
  "perpetuity"
  "quantum-rose"
  "soft-pop"
  "solar-dusk"
  "starry-night"
  "sunset-horizon"
  "supabase"
  "t3-chat"
  "twitter"
  "vercel"
  "vintage-paper"
  "violet-bloom"
)

for theme in "${THEMES[@]}"; do
  echo "Installing theme: $theme"
  echo "y" | pnpm dlx shadcn@latest add "https://tweakcn.com/r/themes/${theme}.json" 2>/dev/null
  
  # Get the diff and extract variables
  git diff src/app/globals.css > "/tmp/${theme}-diff.txt"
  
  # Restore globals.css
  git checkout src/app/globals.css
  
  echo "Theme $theme installed and diff saved"
done

echo "All themes installed!"
