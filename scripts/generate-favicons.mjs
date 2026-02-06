import { writeFileSync, readFileSync } from 'fs';
import { execSync } from 'child_process';

// Check if sharp is available
try {
  execSync('npx --yes sharp-cli --version', { stdio: 'pipe' });
} catch {
  console.log('sharp-cli not available, using SVG-only favicon approach');
  process.exit(0);
}

const svg = readFileSync('src/app/icon.svg', 'utf-8');
const svgBuffer = Buffer.from(svg);

const sizes = [
  { name: 'public/favicon-16x16.png', size: 16 },
  { name: 'public/favicon-32x32.png', size: 32 },
  { name: 'public/apple-touch-icon.png', size: 180 },
  { name: 'public/android-chrome-192x192.png', size: 192 },
  { name: 'public/android-chrome-512x512.png', size: 512 },
];

for (const { name, size } of sizes) {
  try {
    execSync(`echo '${svg.replace(/'/g, "\\'")}' | npx sharp-cli resize ${size} ${size} --output ${name}`, { stdio: 'pipe' });
    console.log(`Generated ${name}`);
  } catch (e) {
    console.log(`Failed to generate ${name}: ${e.message}`);
  }
}
