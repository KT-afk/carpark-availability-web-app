const fs = require('fs');
const { createCanvas } = require('canvas');

function generateIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#3B82F6';
  ctx.fillRect(0, 0, size, size);

  // Letter P
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.55}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('P', size / 2, size * 0.55);

  // Green dot
  ctx.fillStyle = '#10B981';
  ctx.beginPath();
  ctx.arc(size * 0.78, size * 0.29, size * 0.1, 0, Math.PI * 2);
  ctx.fill();

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`Generated ${filename}`);
}

try {
  generateIcon(512, 'public/pwa-512x512.png');
  generateIcon(192, 'public/pwa-192x192.png');
  generateIcon(512, 'public/pwa-maskable-512x512.png');
  generateIcon(192, 'public/pwa-maskable-192x192.png');
  console.log('All icons generated successfully!');
} catch (error) {
  console.error('Canvas not available, using fallback method');
  process.exit(1);
}
