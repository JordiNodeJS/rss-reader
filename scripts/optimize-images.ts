
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots');

async function optimize() {
  const files = fs.readdirSync(screenshotsDir).filter(f => f.endsWith('.png'));
  
  for (const file of files) {
    const inputPath = path.join(screenshotsDir, file);
    const outputPath = path.join(screenshotsDir, file.replace('.png', '.webp'));
    
    console.log(`Optimizing ${file}...`);
    
    await sharp(inputPath)
      .webp({ quality: 80 })
      .toFile(outputPath);
      
    console.log(`Saved ${outputPath}`);
  }
}

optimize().catch(console.error);
