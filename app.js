// Paleta inicial basada en el estilo Petite Plaid
let fabrics = [
  { id: "bg", name: "Fondo (Cream)", hex: "#f5edd6" },
  { id: "c1", name: "Honey (A1)", hex: "#d99b38" },
  { id: "c2", name: "Nutmeg (B3)", hex: "#9e4c27" },
  { id: "c3", name: "Flamingo (B2)", hex: "#e07a5f" },
  { id: "c4", name: "Forest Night (C1)", hex: "#2b4138" },
  { id: "c5", name: "Cruce Profundo (C2)", hex: "#1d2a24" }
];

let activeFabricId = fabrics[1].id;

// Secuencia de bandas del bloque (dimensiones terminadas en pulgadas)
let strips = [
  { width: 2.5 }, // Banda 0: Fondo
  { width: 1.0 }, // Banda 1: Acento
  { width: 3.0 }, // Banda 2: Central
  { width: 1.0 }, // Banda 3: Acento
  { width: 2.5 }, // Banda 4: Fondo
  { width: 2.5 }  // Banda 5: Secundario
];

// Matriz de celdas del bloque [fila][columna] = fabricId
let blockMatrix = [];

function initializeMatrix() {
  const n = strips.length;
  blockMatrix = [];
  for (let r = 0; r < n; r++) {
    const row = [];
    for (let c = 0; c < n; c++) {
      if (r === c) {
        row.push(r % 2 === 0 ? "c1" : "c4");
      } else if (r % 2 === 1 && c % 2 === 1) {
        row.push("c5");
      } else if (r % 2 === 1 || c % 2 === 1) {
        row.push("c3");
      } else {
        row.push("bg");
      }
    }
    blockMatrix.push(row);
  }
}

// Interfaz: Render de Paleta
function renderPalette() {
  const container = document.getElementById("palette");
  container.innerHTML = fabrics.map(f => `
    <div class="palette-item ${f.id === activeFabricId ? 'active' : ''}" onclick="selectActiveFabric('${f.id}')">
      <div>
        <span class="color-dot" style="background:${f.hex}"></span>
        <span>${f.name}</span>
      </div>
      <input type="color" value="${f.hex}" onchange="changeColorHex('${f.id}', this.value)" onclick="event.stopPropagation()" />
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

// Interfaz: Controles de bandas
function renderStripControls() {
  const container = document.getElementById("stripControls");
  container.innerHTML = strips.map((s, idx) => `
    <div class="strip-item">
      <span>Banda #${idx + 1}:</span>
      <input type="number" step="0.25" min="0.5" value="${s.width}" onchange="updateStripWidth(${idx}, parseFloat(this.value))" />
      <span>in</span>
      ${strips.length > 2 ? `<button onclick="removeStrip(${idx})" style="background:#e53e3e; padding: 2px 6px;">×</button>` : ''}
    </div>
  `).join("");
}

function updateStripWidth(idx, val) {
  strips[idx].width = isNaN(val) ? 1.0 : val;
  updateAll();
}

function removeStrip(idx) {
  strips.splice(idx, 1);
  blockMatrix.splice(idx, 1);
  blockMatrix.forEach(row => row.splice(idx, 1));
  renderStripControls();
  updateAll();
}

function addStrip() {
  strips.push({ width: 1.5 });
  const n = strips.length;
  // Ajustar matriz
  blockMatrix.forEach(row => row.push(activeFabricId));
  const newRow = new Array(n).fill(activeFabricId);
  blockMatrix.push(newRow);
  renderStripControls();
  updateAll();
}

// Dibujo Canvas y detección de clics
function drawCanvas() {
  const canvas = document.getElementById("quiltCanvas");
  const ctx = canvas.getContext("2d");
  const repX = parseInt(document.getElementById("repeatX").value) || 1;
  const repY = parseInt(document.getElementById("repeatY").value) || 1;

  const blockDim = strips.reduce((acc, s) => acc + s.width, 0);
  const totalW = blockDim * repX;
  const totalH = blockDim * repY;

  const maxCanvasSize = 520;
  const scale = Math.min(maxCanvasSize / totalW, maxCanvasSize / totalH);

  canvas.width = totalW * scale;
  canvas.height = totalH * scale;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let by = 0; by < repY; by++) {
    for (let bx = 0; bx < repX; bx++) {
      let offsetY = by * blockDim * scale;

      for (let r = 0; r < strips.length; r++) {
        const rowH = strips[r].width * scale;
        let offsetX = bx * blockDim * scale;

        for (let c = 0; c < strips.length; c++) {
          const colW = strips[c].width * scale;
          const fabricId = blockMatrix[r][c];
          const fabric = fabrics.find(f => f.id === fabricId) || fabrics[0];

          ctx.fillStyle = fabric.hex;
          ctx.fillRect(offsetX, offsetY, colW, rowH);

          // Borde sutil simulando costuras
          ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
          ctx.strokeRect(offsetX, offsetY, colW, rowH);

          offsetX += colW;
        }
        offsetY += rowH;
      }
    }
  }
}

// Asignar color al hacer clic sobre cualquier pieza
document.getElementById("quiltCanvas").addEventListener("click", function (evt) {
  const rect = this.getBoundingClientRect();
  const clickX = evt.clientX - rect.left;
  const clickY = evt.clientY - rect.top;

  const repX = parseInt(document.getElementById("repeatX").value) || 1;
  const repY = parseInt(document.getElementById("repeatY").value) || 1;
  const blockDim = strips.reduce((acc, s) => acc + s.width, 0);
  const scale = Math.min(520 / (blockDim * repX), 520 / (blockDim * repY));

  // Determinar posición relativa dentro del bloque
  const xInInches = (clickX / scale) % blockDim;
  const yInInches = (clickY / scale) % blockDim;

  let accumX = 0, targetCol = 0;
  for (let c = 0; c < strips.length; c++) {
    if (xInInches >= accumX && xInInches < accumX + strips[c].width) {
      targetCol = c;
      break;
    }
    accumX += strips[c].width;
  }

  let accumY = 0, targetRow = 0;
  for (let r = 0; r < strips.length; r++) {
    if (yInInches >= accumY && yInInches < accumY + strips[r].width) {
      targetRow = r;
      break;
    }
    accumY += strips[r].width;
  }

  // Actualizar color en el bloque
  blockMatrix[targetRow][targetCol] = activeFabricId;
  updateAll();
});

// Despiece y medidas de corte
function calculateCuts() {
  const seam = parseFloat(document.getElementById("seamAllowance").value) || 0.25;
  const repX = parseInt(document.getElementById("repeatX").value) || 1;
  const repY = parseInt(document.getElementById("repeatY").value) || 1;
  const totalBlocks = repX * repY;

  const pieces = {};

  for (let r = 0; r < strips.length; r++) {
    for (let c = 0; c < strips.length; c++) {
      const fabricId = blockMatrix[r][c];
      const wFin = strips[c].width;
      const hFin = strips[r].width;

      const sortedFin = [wFin, hFin].sort((a, b) => a - b);
      const cutDims = sortedFin.map(dim => dim + 2 * seam);

      const key = `${fabricId}_${sortedFin[0].toFixed(2)}x${sortedFin[1].toFixed(2)}`;

      if (!pieces[key]) {
        pieces[key] = {
          fabricId,
          finished: `${sortedFin[0]}" × ${sortedFin[1]}"`,
          cut: `${cutDims[0].toFixed(2)}" × ${cutDims[1].toFixed(2)}"`,
          qty: 0
        };
      }
      pieces[key].qty++;
    }
  }

  const tbody = document.getElementById("cutListBody");
  tbody.innerHTML = Object.values(pieces).map(item => {
    const f = fabrics.find(fab => fab.id === item.fabricId) || { name: item.fabricId, hex: "#ccc" };
    return `
      <tr>
        <td><span class="color-dot" style="background:${f.hex}"></span> <strong>${f.name}</strong></td>
        <td>${item.finished}</td>
        <td><strong>${item.cut}</strong></td>
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

// Inicialización de eventos
document.getElementById("btnAddColor").addEventListener("click", () => {
  const name = document.getElementById("newColorName").value.trim();
  const hex = document.getElementById("newColorHex").value;
  if (!name) return;
  const id = "c_" + Date.now();
  fabrics.push({ id, name, hex });
  activeFabricId = id;
  document.getElementById("newColorName").value = "";
  renderPalette();
});

document.getElementById("btnAddStrip").addEventListener("click", addStrip);
document.getElementById("seamAllowance").addEventListener("input", updateAll);
document.getElementById("repeatX").addEventListener("input", updateAll);
document.getElementById("repeatY").addEventListener("input", updateAll);

// Arranque
initializeMatrix();
renderPalette();
renderStripControls();
updateAll();