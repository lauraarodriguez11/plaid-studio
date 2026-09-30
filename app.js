// --- CONFIGURACIÓN DE MODOS CON NOMENCLATURA COMBINATORIA SIMÉTRICA ---
const MODES = {
  3: {
    desc: "2 bases (A, B) → 2 puros (A, B) + 1 cruce (AB).",
    bases: ["A", "B"],
    roles: ["A", "B", "AB"],
    resolve: (r, c) => (r === c ? r : "AB")
  },
  6: {
    desc: "3 bases (A, B, C) → 3 puros (A, B, C) + 3 cruces (AB, AC, BC).",
    bases: ["A", "B", "C"],
    roles: ["A", "B", "C", "AB", "AC", "BC"],
    resolve: (r, c) => (r === c ? r : [r, c].sort().join(""))
  },
  10: {
    desc: "4 bases (A, B, C, D) → 4 puros (A, B, C, D) + 6 cruces (AB, AC, AD, BC, BD, CD).",
    bases: ["A", "B", "C", "D"],
    roles: ["A", "B", "C", "D", "AB", "AC", "AD", "BC", "BD", "CD"],
    resolve: (r, c) => (r === c ? r : [r, c].sort().join(""))
  }
};

let currentMode = 10;
let fabrics = [];
let activeFabricId = "";
let seedStrips = []; // Media secuencia
let fullStrips = []; // Secuencia completa expandida en espejo
let blockMatrix = [];

// Conversión HSL a HEX para generar armonías textiles creíbles
function hslToHex(h, s, l) {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Mezcla RGB para calcular tonos de intersección de urdimbre y trama
function blendHex(hex1, hex2, weight = 0.5) {
  const c1 = parseInt(hex1.slice(1), 16);
  const c2 = parseInt(hex2.slice(1), 16);
  const r1 = (c1 >> 16) & 255, g1 = (c1 >> 8) & 255, b1 = c1 & 255;
  const r2 = (c2 >> 16) & 255, g2 = (c2 >> 8) & 255, b2 = c2 & 255;
  const r = Math.round(r1 * (1 - weight) + r2 * weight);
  const g = Math.round(g1 * (1 - weight) + g2 * weight);
  const b = Math.round(b1 * (1 - weight) + b2 * weight);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// Generador aleatorio de paletas y proporciones de banda
function generateRandomTartan(modeKey = currentMode) {
  currentMode = modeKey;
  const config = MODES[currentMode];
  document.getElementById("modeDescription").textContent = config.desc;

  document.querySelectorAll(".seg-btn").forEach(btn => {
    btn.classList.toggle("active", parseInt(btn.dataset.mode) === currentMode);
  });

  const baseHue = Math.floor(Math.random() * 360);
  const baseSaturation = 45 + Math.floor(Math.random() * 30);
  const baseColors = {};

  if (currentMode === 3) {
    baseColors["A"] = hslToHex(baseHue, baseSaturation, 30);
    baseColors["B"] = hslToHex((baseHue + 180) % 360, 20, 88);
    fabrics = [
      { id: "A", name: "A", hex: baseColors["A"] },
      { id: "B", name: "B", hex: baseColors["B"] },
      { id: "AB", name: "AB", hex: blendHex(baseColors["A"], baseColors["B"], 0.45) }
    ];
  } else if (currentMode === 6) {
    baseColors["A"] = hslToHex(baseHue, baseSaturation, 30);
    baseColors["B"] = hslToHex((baseHue + 60) % 360, baseSaturation, 42);
    baseColors["C"] = hslToHex((baseHue + 130) % 360, baseSaturation + 10, 22);
    fabrics = [
      { id: "A", name: "A", hex: baseColors["A"] },
      { id: "B", name: "B", hex: baseColors["B"] },
      { id: "C", name: "C", hex: baseColors["C"] },
      { id: "AB", name: "AB", hex: blendHex(baseColors["A"], baseColors["B"], 0.5) },
      { id: "AC", name: "AC", hex: blendHex(baseColors["A"], baseColors["C"], 0.5) },
      { id: "BC", name: "BC", hex: blendHex(baseColors["B"], baseColors["C"], 0.5) }
    ];
  } else {
    baseColors["A"] = hslToHex(baseHue, 35, 78);
    baseColors["B"] = hslToHex((baseHue + 45) % 360, 65, 50);
    baseColors["C"] = hslToHex((baseHue + 140) % 360, 60, 40);
    baseColors["D"] = hslToHex((baseHue + 250) % 360, 50, 24);

    fabrics = [
      { id: "A", name: "A", hex: baseColors["A"] },
      { id: "B", name: "B", hex: baseColors["B"] },
      { id: "C", name: "C", hex: baseColors["C"] },
      { id: "D", name: "D", hex: baseColors["D"] },
      { id: "AB", name: "AB", hex: blendHex(baseColors["A"], baseColors["B"], 0.5) },
      { id: "AC", name: "AC", hex: blendHex(baseColors["A"], baseColors["C"], 0.5) },
      { id: "AD", name: "AD", hex: blendHex(baseColors["A"], baseColors["D"], 0.5) },
      { id: "BC", name: "BC", hex: blendHex(baseColors["B"], baseColors["C"], 0.5) },
      { id: "BD", name: "BD", hex: blendHex(baseColors["B"], baseColors["D"], 0.5) },
      { id: "CD", name: "CD", hex: blendHex(baseColors["C"], baseColors["D"], 0.5) }
    ];
  }

  activeFabricId = fabrics[0].id;

  // Generar bandas semilla en cm
  seedStrips = [];
  const sampleWidths = [2.0, 2.5, 3.5, 5.0, 6.5, 8.0];
  for (let i = 0; i < config.bases.length; i++) {
    const w = sampleWidths[Math.floor(Math.random() * sampleWidths.length)];
    seedStrips.push({
      id: config.bases[i],
      label: `Banda Base (${config.bases[i]})`,
      width: w
    });
  }

  if (seedStrips.length < 4) {
    const extraBase = config.bases[0];
    seedStrips.push({
      id: extraBase,
      label: `Acento (${extraBase})`,
      width: 2.0
    });
  }

  rebuildMirroredSett();
}

// Expansión simétrica en espejo (Sett Simétrico Tradicional)
function rebuildMirroredSett() {
  const config = MODES[currentMode];
  fullStrips = [...seedStrips];
  for (let i = seedStrips.length - 2; i >= 1; i--) {
    fullStrips.push({ ...seedStrips[i] });
  }

  const n = fullStrips.length;
  blockMatrix = [];
  for (let r = 0; r < n; r++) {
    const row = [];
    for (let c = 0; c < n; c++) {
      row.push(config.resolve(fullStrips[r].id, fullStrips[c].id));
    }
    blockMatrix.push(row);
  }

  renderPalette();
  renderStripControls();
  updateAll();
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

// UI: Controles de bandas semilla (cm)
function renderStripControls() {
  const container = document.getElementById("stripControls");
  container.innerHTML = seedStrips.map((s, idx) => `
    <div class="strip-item">
      <span>${s.label}</span>
      <div class="strip-inputs">
        <input type="number" step="0.5" min="0.5" value="${s.width}" 
               onchange="updateSeedWidth(${idx}, parseFloat(this.value))" />
        <span style="color: var(--text-secondary); font-size: 0.75rem;">cm</span>
      </div>
    </div>
  `).join("");
}

function updateSeedWidth(idx, val) {
  seedStrips[idx].width = isNaN(val) || val <= 0 ? 1.0 : val;
  rebuildMirroredSett();
}

// Dibujar Canvas con cálculo garantizado de dimensiones
function drawCanvas() {
  const canvas = document.getElementById("quiltCanvas");
  if (!canvas) return;
  const viewport = document.getElementById("canvasViewport");
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

  // Asegurar dimensiones mínimas reales aunque el viewport aún esté calculando su layout
  const viewW = viewport && viewport.clientWidth > 0 ? viewport.clientWidth : 500;
  const viewH = viewport && viewport.clientHeight > 0 ? viewport.clientHeight : 380;
  
  const availableW = Math.max(160, viewW - 24);
  const availableH = Math.max(160, viewH - 24);

  const pxPerCm = Math.min(availableW / totalWCm, availableH / totalHCm);

  canvas.width = Math.max(100, Math.floor(totalWCm * pxPerCm));
  canvas.height = Math.max(100, Math.floor(totalHCm * pxPerCm));

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

// Clic interactivo en celda
document.getElementById("quiltCanvas").addEventListener("click", function (evt) {
  const rect = this.getBoundingClientRect();
  const clickX = evt.clientX - rect.left;
  const clickY = evt.clientY - rect.top;

  const repX = parseInt(document.getElementById("repeatX").value) || 2;
  const repY = parseInt(document.getElementById("repeatY").value) || 2;
  const blockDimCm = fullStrips.reduce((acc, s) => acc + s.width, 0);

  const pxPerCm = this.width / (blockDimCm * repX);

  const xInCm = (clickX / pxPerCm) % blockDimCm;
  const yInCm = (clickY / pxPerCm) % blockDimCm;

  let accumX = 0, targetCol = 0;
  for (let c = 0; c < fullStrips.length; c++) {
    if (xInCm >= accumX && xInCm < accumX + fullStrips[c].width) {
      targetCol = c;
      break;
    }
    accumX += fullStrips[c].width;
  }

  let accumY = 0, targetRow = 0;
  for (let r = 0; r < fullStrips.length; r++) {
    if (yInCm >= accumY && yInCm < accumY + fullStrips[r].width) {
      targetRow = r;
      break;
    }
    accumY += fullStrips[r].width;
  }

  blockMatrix[targetRow][targetCol] = activeFabricId;
  updateAll();
});

// Despiece métrico ordenado según roles combinatorios
function calculateCuts() {
  const seamCm = parseFloat(document.getElementById("seamAllowance").value) || 0.75;
  const repX = parseInt(document.getElementById("repeatX").value) || 2;
  const repY = parseInt(document.getElementById("repeatY").value) || 2;
  const totalBlocks = repX * repY;

  const pieces = {};

  for (let r = 0; r < fullStrips.length; r++) {
    for (let c = 0; c < fullStrips.length; c++) {
      const fabricId = blockMatrix[r][c];
      
      const wFinCm = fullStrips[c].width;
      const hFinCm = fullStrips[r].width;

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

  const roleOrder = fabrics.reduce((acc, f, idx) => {
    acc[f.id] = idx;
    return acc;
  }, {});

  const sortedPieces = Object.values(pieces).sort((a, b) => {
    const oA = roleOrder[a.fabricId] ?? 999;
    const oB = roleOrder[b.fabricId] ?? 999;
    if (oA !== oB) return oA - oB;
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

// Botones de modo
document.querySelectorAll(".seg-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    generateRandomTartan(parseInt(btn.dataset.mode));
  });
});

// Botón aleatorio sin icono
document.getElementById("btnRandomize").addEventListener("click", () => {
  generateRandomTartan(currentMode);
});

// Parámetros
document.getElementById("seamAllowance").addEventListener("input", updateAll);
document.getElementById("repeatX").addEventListener("input", updateAll);
document.getElementById("repeatY").addEventListener("input", updateAll);

// Escuchar cambios de tamaño
window.addEventListener("resize", drawCanvas);

// Inicializar
generateRandomTartan(10);
setTimeout(drawCanvas, 50); // Redibujar una vez el layout esté renderizado