const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const psScript = `
Add-Type -AssemblyName System.Drawing
$srcPath = 'C:\\Users\\User\\Documents\\GitHub\\Sussex_SheetApp\\src\\public\\sheetapp-logo-concept3.jpg'
$src = [System.Drawing.Image]::FromFile($srcPath)

$sizes = @(256, 48, 32, 16)
foreach ($s in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap $s, $s
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($src, 0, 0, $s, $s)
    $g.Dispose()
    
    $outPng = "C:\\Users\\User\\Documents\\GitHub\\Sussex_SheetApp\\build\\icon_$($s).png"
    $bmp.Save($outPng, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

$src.Dispose()
Write-Host "All resolutions exported to PNG"
`;

fs.writeFileSync(path.join(__dirname, 'export-sizes.ps1'), psScript);
execSync('powershell -ExecutionPolicy Bypass -File scripts/export-sizes.ps1', { stdio: 'inherit' });

// Read all 4 PNG buffers
const sizes = [256, 48, 32, 16];
const pngs = sizes.map(s => {
  const buf = fs.readFileSync(path.join(__dirname, `../build/icon_${s}.png`));
  return { size: s, buf };
});

// Build ICO header: 6 bytes + (4 * 16 bytes)
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // Reserved
header.writeUInt16LE(1, 2); // Type 1 = Icon
header.writeUInt16LE(pngs.length, 4); // Count = 4

let currentOffset = 6 + pngs.length * 16;
const dirEntries = [];

for (const img of pngs) {
  const dir = Buffer.alloc(16);
  dir.writeUInt8(img.size === 256 ? 0 : img.size, 0); // Width
  dir.writeUInt8(img.size === 256 ? 0 : img.size, 1); // Height
  dir.writeUInt8(0, 2); // Color count
  dir.writeUInt8(0, 3); // Reserved
  dir.writeUInt16LE(1, 4); // Color planes
  dir.writeUInt16LE(32, 6); // Bits per pixel
  dir.writeUInt32LE(img.buf.length, 8); // Size of image data
  dir.writeUInt32LE(currentOffset, 12); // Offset
  dirEntries.push(dir);
  currentOffset += img.buf.length;
}

const finalIco = Buffer.concat([
  header,
  ...dirEntries,
  ...pngs.map(p => p.buf)
]);

fs.writeFileSync(path.join(__dirname, '../build/icon.ico'), finalIco);
// Also save standard 256x256 as icon.png
fs.copyFileSync(path.join(__dirname, '../build/icon_256.png'), path.join(__dirname, '../build/icon.png'));
// Also copy icon.png and icon.ico to src/public/ for browser favicon
fs.copyFileSync(path.join(__dirname, '../build/icon_256.png'), path.join(__dirname, '../src/public/sheetapp-logo.png'));
fs.copyFileSync(path.join(__dirname, '../build/icon_256.png'), path.join(__dirname, '../src/public/favicon.png'));

console.log('Successfully generated multi-resolution icon.ico. Total size:', finalIco.length);
