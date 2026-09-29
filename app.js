// Paleta basada en Petite Plaid
let fabrics = [
  { id: "bg", name: "Fondo (Cream)", hex: "#f5edd6" },
  { id: "c1", name: "Honey (A1)", hex: "#d99b38" },
  { id: "c2", name: "Nutmeg (B3)", hex: "#9e4c27" },
  { id: "c3", name: "Flamingo (B2)", hex: "#e07a5f" },
  { id: "c4", name: "Forest Night (C1)", hex: "#2b4138" },
  { id: "c5", name: "Cruce Profundo (C2)", hex: "#1d2a24" }
];

let activeFabricId = fabrics[1].id;

// Secuencia en centímetros (bloque terminado de ~33 cm / 13 pulgadas)
let strips = [
  { width: 6.0 }, // Franja 1
  { width: 2.5 }, // Franja 2
  { width: 8.0 }, // Franja central
  { width: 2.5 }, // Franja 4
  { width: 7.0 }, // Franja 5
  { width: 7.0 }  // Franja 6
];

// Matriz interna de colores por celda
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

// UI: Renderizado de la Paleta
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

// UI: Renderizado de Controles de Bandas (en cm)
function renderStripControls() {
  const container = document.getElementById("stripControls");
  container.innerHTML = strips.map((s, idx) => `
    <div class="strip-item">
      <span>Banda #${idx + 1}</span>
      <div class="strip-inputs">
        <input type="number" step="0.5" min="1.0" value="${s.width}" 
               onchange="updateStripWidth(${idx}, parseFloat(this.value))" />
        <span style="color: var(--text-secondary); font-size: 0.75rem;">cm</span>
        ${strips.length > 2 ? `<button class="btn-icon-del" onclick="removeStrip(${idx})">×</button>` : ''}
      </div>
    </div>
  `).join("");
}

function updateStripWidth(idx, val) {
  strips[idx].width = isNaN(val) || val <= 0 ? 1.0 : val;
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
  strips.push({ width: 4.0 });
  const n = strips.length;
  blockMatrix.forEach(row => row.push(activeFabricId));
  const newRow = new Array(n).fill(activeFabricId);
  blockMatrix.push(newRow);
  renderStripControls();
  updateAll();
}

// Renderizado del Canvas y medidas
function drawCanvas() {
  const canvas = document.getElementById("quiltCanvas");
  const ctx = canvas.getContext("2d");
  const repX = parseInt(document.getElementById("repeatX").value) || 1;
  const repY = parseInt(document.getElementById("repeatY").value) || 1;

  const blockDimCm = strips.reduce((acc, s) => acc + s.width, 0);
  document.getElementById("blockSizeDisplay").textContent = `Bloque: ${blockDimCm.toFixed(1)} × ${blockDimCm.toFixed(1)} cm`;

  const totalWCm = blockDimCm * repX;
  const totalHCm = blockDimCm * repY;

  // Escala en píxeles por centímetro
  const maxViewportPx = 540;
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

          // Línea de costura nítida
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

// Interacción: Clic sobre cualquier parche para pintar
document.getElementById("quiltCanvas").addEventListener("click", function (evt) {
  const rect = this.getBoundingClientRect();
  const clickX = evt.clientX - rect.left;
  const clickY = evt.clientY - rect.top;

  const repX = parseInt(document.getElementById("repeatX").value) || 1;
  const repY = parseInt(document.getElementById("repeatY").value) || 1;
  const blockDimCm = strips.reduce((acc, s) => acc + s.width, 0);
  const pxPerCm = Math.min(540 / (blockDimCm * repX), 540 / (blockDimCm * repY));

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

// Cálculo métrico de corte
function calculateCuts() {
  const seam = parseFloat(document.getElementById("seamAllowance").value) || 0.75;
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

      const key = `${fabricId}_${sortedFin[0].toFixed(1)}x${sortedFin[1].toFixed(1)}`;

      if (!pieces[key]) {
        pieces[key] = {
          fabricId,
          finished: `${sortedFin[0].toFixed(1)} × ${sortedFin[1].toFixed(1)} cm`,
          cut: `${cutDims[0].toFixed(1)} × ${cutDims[1].toFixed(1)} cm`,
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
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="color-dot" style="background:${f.hex}"></span>
            <strong>${f.name}</strong>
          </div>
        </td>
        <td>${item.finished}</td>
        <td><strong style="color:var(--apple-blue);">${item.cut}</strong></td>
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

// Inicialización
initializeMatrix();
renderPalette();
renderStripControls();
updateAll();