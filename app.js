// Reemplaza únicamente drawCanvas() por esta versión auto-ajustable:
function drawCanvas() {
  const canvas = document.getElementById("quiltCanvas");
  const viewport = canvas.parentElement;
  const ctx = canvas.getContext("2d");
  
  const repX = parseInt(document.getElementById("repeatX").value) || 2;
  const repY = parseInt(document.getElementById("repeatY").value) || 2;
  const totalBlocks = repX * repY;

  document.getElementById("blocksSummaryText").textContent = 
    `Total: ${totalBlocks} bloque${totalBlocks > 1 ? 's' : ''} (${repX} × ${repY})`;

  const blockDimCm = fullStrips.reduce((acc, s) => acc + s.width, 0);
  const totalWCm = blockDimCm * repX;
  const totalHCm = blockDimCm * repY;

  document.getElementById("blockSizeDisplay").textContent = 
    `Bloque: ${blockDimCm.toFixed(1)} × ${blockDimCm.toFixed(1)} cm | Quilt: ${totalWCm.toFixed(1)} × ${totalHCm.toFixed(1)} cm`;

  // Calcular espacio disponible real en el contenedor visual
  const availableW = Math.max(120, viewport.clientWidth - 24);
  const availableH = Math.max(120, viewport.clientHeight - 24);

  // Escala que encaja perfectamente dentro del contenedor
  const pxPerCm = Math.min(availableW / totalWCm, availableH / totalHCm);

  canvas.width = Math.floor(totalWCm * pxPerCm);
  canvas.height = Math.floor(totalHCm * pxPerCm);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let by = 0; by < repY; by++) {
    for (let bx = 0; bx < repX; bx++) {
      let offsetY = by * blockDimCm * pxPerCm;

      for (let r = 0; r < fullStrips.length; r++) {
        const rowH = fullStrips[r].width * pxPerCm;
        let offsetX = bx * blockDimCm * pxPerCm;

        for (let c = 0; c < fullStrips.length; c++) {
          const colW = fullStrips[c].width * pxPerCm;
          const fabricId = blockMatrix[r][c];
          const fabric = fabrics.find(f => f.id === fabricId) || fabrics[0];

          ctx.fillStyle = fabric.hex;
          ctx.fillRect(offsetX, offsetY, colW, rowH);

          ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
          ctx.lineWidth = 1;
          ctx.strokeRect(offsetX, offsetY, colW, rowH);

          offsetX += colW;
        }
        offsetY += rowH;
      }
    }
  }
}

// Escuchar cambios de tamaño de ventana o contenedor para redibujar al instante
window.addEventListener("resize", drawCanvas);
const resizeObserver = new ResizeObserver(() => drawCanvas());
const viewportEl = document.querySelector(".canvas-viewport");
if (viewportEl) resizeObserver.observe(viewportEl);