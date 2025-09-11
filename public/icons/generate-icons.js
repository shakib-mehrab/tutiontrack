const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
const svgPath = path.join(__dirname, 'logo.svg');
const iconsDir = path.join(__dirname);

// Create SVG content programmatically
const svgContent = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="80" fill="url(#gradient)" />
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#8b5cf6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#06b6d4;stop-opacity:1" />
    </linearGradient>
  </defs>
  <g transform="translate(128, 100)">
    <rect x="0" y="0" width="256" height="312" rx="20" fill="white" opacity="0.95"/>
    <rect x="20" y="20" width="216" height="272" rx="10" fill="#f8fafc"/>
    <rect x="0" y="0" width="40" height="312" rx="20" fill="white"/>
    <rect x="60" y="50" width="140" height="4" rx="2" fill="#cbd5e1"/>
    <rect x="60" y="70" width="160" height="4" rx="2" fill="#cbd5e1"/>
    <rect x="60" y="90" width="120" height="4" rx="2" fill="#cbd5e1"/>
    <rect x="60" y="130" width="150" height="4" rx="2" fill="#cbd5e1"/>
    <rect x="60" y="150" width="130" height="4" rx="2" fill="#cbd5e1"/>
    <rect x="60" y="170" width="170" height="4" rx="2" fill="#cbd5e1"/>
    <circle cx="80" cy="220" r="8" fill="#3b82f6"/>
    <circle cx="110" cy="220" r="8" fill="#8b5cf6"/>
    <circle cx="140" cy="220" r="8" fill="#06b6d4"/>
    <circle cx="170" cy="220" r="6" fill="#cbd5e1"/>
    <circle cx="195" cy="220" r="6" fill="#cbd5e1"/>
  </g>
</svg>`;

// Generate PNG icons
async function generateIcons() {
  try {
    for (const size of iconSizes) {
      const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
      
      await sharp(Buffer.from(svgContent))
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`Generated: icon-${size}x${size}.png`);
    }
    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();
