// 1. Las 10 Telas Oficiales de Petite Plaid (Paleta de portada: Pure Solids de AGF)
let fabrics = [
  { id: "BG", name: "BG (Golden Bronze)", hex: "#bc8a5f" },
  { id: "A1", name: "A1 (Honey)", hex: "#d99b38" },
  { id: "A2", name: "A2 (A1+A1 Forget-Me-Not)", hex: "#7a9cb8" },
  { id: "A3", name: "A3 (A1+B1 Grapefruit)", hex: "#e27863" },
  { id: "B1", name: "B1 (Rock Candy)", hex: "#cb4f69" },
  { id: "B2", name: "B2 (B1+B1 Flamingo)", hex: "#e07a5f" },
  { id: "B3", name: "B3 (B1+C1 Nutmeg)", hex: "#9e4c27" },
  { id: "C1", name: "C1 (Forest Night)", hex: "#2b4138" },
  { id: "C2", name: "C2 (C1+C1 Caviar)", hex: "#1d2a24" },
  { id: "C3", name: "C3 (A1+C1 English Toffee)", hex: "#8c5e39" }
];

// Mapa de prioridades para ordenar la tabla exactamente como en la lista de telas
const fabricOrderMap = fabrics.reduce((acc, f, index) => {
  acc[f.id] = index;
  return acc;
}, {});

let activeFabricId = "A1";

// 2. Bandas del bloque en CENTÍMETROS (cm)
let strips = [
  { id: "BG", label: "Banda 1 (BG)", width: 6.5 },
  { id: "A1", label: "Banda 2 (A1)", width: 2.5 },
  { id: "BG", label: "Banda 3 (BG)", width: 7.5 },
  { id: "B1", label: "Banda 4 (B1)", width: 4.0 },
  { id: "BG", label: "Banda 5 (BG)", width: 6.5 },
  { id: "C1", label: "Banda 6 (C1)", width: 5.0 }
];

// Matriz de celdas [fila][columna] = fabricId
let blockMatrix = [];

// Regla de combinación de colores oficial de Petite Plaid
function resolveColorRole(rowStripId, colStripId) {
  if (rowStripId === "BG" && colStripId === "BG") return "BG";
  if (rowStripId === "BG") return colStripId;
  if (colStripId === "BG") return rowStripId;

  // Intersecciones puras
  if (rowStripId === "A1" && colStripId === "A1") return "A2";
  if (rowStripId === "B1" && colStripId === "B1") return "B2";
  if (rowStripId === "C1" && colStripId === "C1") return "C2";

  // Intersecciones mixtas
  const pair = [rowStripId, colStripId].sort().join("+");
  if (pair === "A1+B1") return "A3";
  if (pair === "B1+C1") return "B3";
  if (pair === "A1+C1") return "C3";

  return "BG";
}

// Inicializar la matriz con la estructura oficial
function initializeMatrix() {
  const n = strips.length;
  blockMatrix = [];
  for (let r = 0; r < n; r++) {
    const row = [];
    for (let c = 0; c < n; c++) {
      row.push(resolveColorRole(strips[r].id, strips[c].id));
    }
    blockMatrix.push(row);
  }
}

// UI: Paleta de telas
function renderPalette() {
  const container = document.getElementById("palette");
  container.innerHTML = fabrics.map(f => `
    <div class="palette-item ${f.id === activeFabricId ? 'active' : ''}" onclick="selectActiveFabric('${f.id}')">
      <div class="palette-color-preview">
        <span class="color-dot" style="background:${f.hex}"></span>
        <span>${f.name}</span>
      </div>
      <input type="color" class="color-picker-input" value="${f.hex}" 
             onchange="changeColorHex('${f.id}', this.value)" 
             onclick="event.stopPropagation()" />
    </div>
  `).join("");

  const active = fabrics.find(f => f.id === activeFabricId);
  document.getElementById("activeColorLabel").textContent = active ? active.name : "";
}

function selectActiveFabric(id) {
  activeFabricId = id;
  renderPalette();
}

function changeColorHex(id, hex) {
  const f = fabrics.find(x => x.id === id);
  if (f) f.hex = hex;
  updateAll();
}

// UI: Controles de bandas en cm
function renderStripControls() {
  const container = document.getElementById("stripControls");
  container.innerHTML = strips.map((s, idx) => `
    <div class="strip-item">
      <span>${s.label}</span>
      <div class="strip-inputs">
        <input type="number" step="0.5" min="0.5" value="${s.width}" 
               onchange="updateStripWidth(${idx}, parseFloat(this.value))" />
        <span style="color: var(--text-secondary); font-size: 0.75rem;">cm</span>
      </div>
    </div>
  `).join("");
}

function updateStripWidth(idx, val) {
  strips[idx].width = isNaN(val) || val <= 0 ? 1.0 : val;
  updateAll();
}

// Dibujar Canvas y mostrar dimensiones (Bloque y Quilt Completo)
function drawCanvas() {
  const canvas = document.getElementById("quiltCanvas");
  const ctx = canvas.getContext("2d");
  
  const repX = parseInt(document.getElementById("repeatX").value) || 2;
  const repY = parseInt(document.getElementById("repeatY").value) || 2;
  const totalBlocks = repX * repY;

  document.getElementById("blocksSummaryText").textContent = 
    `Total: ${totalBlocks} bloque${totalBlocks > 1 ? 's' : ''} (${repX} × ${repY})`;

  const blockDimCm = strips.reduce((acc, s) => acc + s.width, 0);
  const totalWCm = blockDimCm * repX;
  const totalHCm = blockDimCm * repY;

  // Actualización de la dimensión del bloque y del quilt completo
  document.getElementById("blockSizeDisplay").textContent = 
    `Bloque: ${blockDimCm.toFixed(1)} × ${blockDimCm.toFixed(1)} cm | Quilt: ${totalWCm.toFixed(1)} × ${totalHCm.toFixed(1)} cm`;

  const maxViewportPx = 520;
  const pxPerCm = Math.min(maxViewportPx / totalWCm, maxViewportPx / totalHCm);

  canvas.width = totalWCm * pxPerCm;
  canvas.height = totalHCm * pxPerCm;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let by = 0; by < repY; by++) {
    for (let bx = 0; bx < repX; bx++) {
      let offsetY = by * blockDimCm * pxPerCm;

      for (let r = 0; r < strips.length; r++) {
        const rowH = strips[r].width * pxPerCm;
        let offsetX = bx * blockDimCm * pxPerCm;

        for (let c = 0; c < strips.length; c++) {
          const colW = strips[c].width * pxPerCm;
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

// Clic interactivo sobre cualquier parche para reemplazar el color
document.getElementById("quiltCanvas").addEventListener("click", function (evt) {
  const rect = this.getBoundingClientRect();
  const clickX = evt.clientX - rect.left;
  const clickY = evt.clientY - rect.top;

  const repX = parseInt(document.getElementById("repeatX").value) || 2;
  const repY = parseInt(document.getElementById("repeatY").value) || 2;
  const blockDimCm = strips.reduce((acc, s) => acc + s.width, 0);
  const pxPerCm = Math.min(520 / (blockDimCm * repX), 520 / (blockDimCm * repY));

  const xInCm = (clickX / pxPerCm) % blockDimCm;
  const yInCm = (clickY / pxPerCm) % blockDimCm;

  let accumX = 0, targetCol = 0;
  for (let c = 0; c < strips.length; c++) {
    if (xInCm >= accumX && xInCm < accumX + strips[c].width) {
      targetCol = c;
      break;
    }
    accumX += strips[c].width;
  }

  let accumY = 0, targetRow = 0;
  for (let r = 0; r < strips.length; r++) {
    if (yInCm >= accumY && yInCm < accumY + strips[r].width) {
      targetRow = r;
      break;
    }
    accumY += strips[r].width;
  }

  blockMatrix[targetRow][targetCol] = activeFabricId;
  updateAll();
});

// Despiece métrico ordenado según la paleta de colores oficial
function calculateCuts() {
  const seamCm = parseFloat(document.getElementById("seamAllowance").value) || 0.75;
  const repX = parseInt(document.getElementById("repeatX").value) || 2;
  const repY = parseInt(document.getElementById("repeatY").value) || 2;
  const totalBlocks = repX * repY;

  const pieces = {};

  for (let r = 0; r < strips.length; r++) {
    for (let c = 0; c < strips.length; c++) {
      const fabricId = blockMatrix[r][c];
      
      const wFinCm = strips[c].width;
      const hFinCm = strips[r].width;

      const sortedFinCm = [wFinCm, hFinCm].sort((a, b) => a - b);
      const cutDimsCm = sortedFinCm.map(dim => dim + 2 * seamCm);

      const key = `${fabricId}_${sortedFinCm[0].toFixed(1)}x${sortedFinCm[1].toFixed(1)}`;

      if (!pieces[key]) {
        pieces[key] = {
          fabricId,
          finishedCm: `${sortedFinCm[0].toFixed(1)} × ${sortedFinCm[1].toFixed(1)} cm`,
          cutCm: `${cutDimsCm[0].toFixed(1)} × ${cutDimsCm[1].toFixed(1)} cm`,
          dimW: sortedFinCm[0],
          dimH: sortedFinCm[1],
          qty: 0
        };
      }
      pieces[key].qty++;
    }
  }

  // Ordenar primero por la posición oficial de la tela y luego por tamaño
  const sortedPieces = Object.values(pieces).sort((a, b) => {
    const orderA = fabricOrderMap[a.fabricId] !== undefined ? fabricOrderMap[a.fabricId] : 999;
    const orderB = fabricOrderMap[b.fabricId] !== undefined ? fabricOrderMap[b.fabricId] : 999;
    if (orderA !== orderB) return orderA - orderB;
    if (a.dimW !== b.dimW) return a.dimW - b.dimW;
    return a.dimH - b.dimH;
  });

  const tbody = document.getElementById("cutListBody");
  tbody.innerHTML = sortedPieces.map(item => {
    const f = fabrics.find(fab => fab.id === item.fabricId) || { name: item.fabricId, hex: "#ccc" };
    return `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="color-dot" style="background:${f.hex}"></span>
            <strong>${f.name}</strong>
          </div>
        </td>
        <td><strong>${item.finishedCm}</strong></td>
        <td><strong class="cut-highlight">${item.cutCm}</strong></td>
        <td>${item.qty} ud.</td>
        <td><strong>${item.qty * totalBlocks} ud.</strong></td>
      </tr>
    `;
  }).join("");
}

function updateAll() {
  drawCanvas();
  calculateCuts();
}

// Event Listeners
document.getElementById("seamAllowance").addEventListener("input", updateAll);
document.getElementById("repeatX").addEventListener("input", updateAll);
document.getElementById("repeatY").addEventListener("input", updateAll);

// Inicializar
initializeMatrix();
renderPalette();
renderStripControls();
updateAll();