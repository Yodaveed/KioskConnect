// QR Code generation utility
export const generateQRCode = async (text: string, size: number = 300): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas not supported'));
      return;
    }
    
    canvas.width = size;
    canvas.height = size;
    
    // Simple QR code mockup (in production, use a proper QR library like qrcode.js)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    
    // Create a grid pattern to simulate QR code
    const cellSize = size / 25; // 25x25 grid
    ctx.fillStyle = '#000000';
    
    // Simple pattern generation (not a real QR code)
    for (let i = 0; i < 25; i++) {
      for (let j = 0; j < 25; j++) {
        // Create a pattern based on text hash
        const hash = hashString(text + i + j);
        if (hash % 2 === 0) {
          ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
        }
      }
    }
    
    // Add corner squares (finder patterns)
    const cornerSize = cellSize * 7;
    // Top-left
    ctx.fillRect(0, 0, cornerSize, cornerSize);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cellSize, cellSize, cornerSize - 2 * cellSize, cornerSize - 2 * cellSize);
    ctx.fillStyle = '#000000';
    ctx.fillRect(cellSize * 2, cellSize * 2, cornerSize - 4 * cellSize, cornerSize - 4 * cellSize);
    
    // Top-right
    ctx.fillStyle = '#000000';
    ctx.fillRect(size - cornerSize, 0, cornerSize, cornerSize);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(size - cornerSize + cellSize, cellSize, cornerSize - 2 * cellSize, cornerSize - 2 * cellSize);
    ctx.fillStyle = '#000000';
    ctx.fillRect(size - cornerSize + cellSize * 2, cellSize * 2, cornerSize - 4 * cellSize, cornerSize - 4 * cellSize);
    
    // Bottom-left
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, size - cornerSize, cornerSize, cornerSize);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cellSize, size - cornerSize + cellSize, cornerSize - 2 * cellSize, cornerSize - 2 * cellSize);
    ctx.fillStyle = '#000000';
    ctx.fillRect(cellSize * 2, size - cornerSize + cellSize * 2, cornerSize - 4 * cellSize, cornerSize - 4 * cellSize);
    
    resolve(canvas.toDataURL('image/png'));
  });
};

// Simple hash function for pattern generation
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};
