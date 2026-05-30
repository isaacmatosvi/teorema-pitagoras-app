const sceneHost = document.querySelector("#threeScene");
const loading = document.querySelector("#threeLoading");
const hint = document.querySelector("#threeHint");
const resetButton = document.querySelector("#reset3dBtn");
const spinButton = document.querySelector("#toggleSpinBtn");
const inputs = ["#sideA", "#sideB", "#sideC"].map((selector) => document.querySelector(selector));

const canvas = document.createElement("canvas");
const context = canvas.getContext("2d");
sceneHost.appendChild(canvas);

let yaw = -0.58;
let pitch = 0.82;
let zoom = 1;
let spinEnabled = true;
let dragging = false;
let lastPointer = { x: 0, y: 0 };
let currentValues = readValues();

function readValues() {
  return inputs.map((input) => Number(input.value));
}

function cleanNumber(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function analyze(values) {
  const drawableValues = values.map((value) => (Number.isFinite(value) && value > 0 ? value : 1));
  const sorted = [...drawableValues].sort((x, y) => x - y);
  const [a, b, c] = sorted;
  const valid = values.every((value) => Number.isFinite(value) && value > 0) && a + b > c;
  const right = valid && Math.abs(a * a + b * b - c * c) <= 0.01;
  return { sorted, a, b, c, valid, right };
}

function makeTrianglePoints(data) {
  const [shortSide, middleSide, longSide] = data.sorted;
  const base = data.valid ? longSide : Math.max(longSide, 1);
  const x = data.valid ? (shortSide * shortSide + base * base - middleSide * middleSide) / (2 * base) : shortSide;
  const y = data.valid ? Math.sqrt(Math.max(shortSide * shortSide - x * x, 0.03)) : Math.max(middleSide * 0.18, 0.2);
  const scale = 4.8 / Math.max(base, y, 1);

  return [
    { x: (-base / 2) * scale, y: 0, z: 0 },
    { x: (base / 2) * scale, y: 0, z: 0 },
    { x: (x - base / 2) * scale, y: y * scale, z: 0 },
  ];
}

function squareFromEdge(start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  const nx = dy / length;
  const ny = -dx / length;

  return [
    start,
    end,
    { x: end.x + nx * length, y: end.y + ny * length, z: 0 },
    { x: start.x + nx * length, y: start.y + ny * length, z: 0 },
  ];
}

function rotate(point) {
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const cosX = Math.cos(pitch);
  const sinX = Math.sin(pitch);
  const x1 = point.x * cosY - point.z * sinY;
  const z1 = point.x * sinY + point.z * cosY;
  const y1 = point.y * cosX - z1 * sinX;
  const z2 = point.y * sinX + z1 * cosX;
  return { x: x1, y: y1, z: z2 };
}

function project(point) {
  const rotated = rotate(point);
  const rect = canvas.getBoundingClientRect();
  const size = Math.min(rect.width, rect.height);
  const perspective = 8 / (8 + rotated.z);
  return {
    x: rect.width / 2 + rotated.x * size * 0.12 * zoom * perspective,
    y: rect.height / 2 - rotated.y * size * 0.12 * zoom * perspective,
    z: rotated.z,
  };
}

function drawPolygon(points, fill, stroke, lineWidth = 2) {
  const projected = points.map(project);
  context.beginPath();
  projected.forEach((point, index) => {
    if (index === 0) context.moveTo(point.x, point.y);
    else context.lineTo(point.x, point.y);
  });
  context.closePath();
  context.fillStyle = fill;
  context.fill();
  context.strokeStyle = stroke;
  context.lineWidth = lineWidth;
  context.stroke();
}

function drawLine(start, end, color, width = 4) {
  const a = project(start);
  const b = project(end);
  context.beginPath();
  context.moveTo(a.x, a.y);
  context.lineTo(b.x, b.y);
  context.strokeStyle = color;
  context.lineWidth = width;
  context.lineCap = "round";
  context.stroke();
}

function drawLabel(text, point, color) {
  const projected = project({ ...point, z: 0.35 });
  context.font = "800 15px Inter, Arial, sans-serif";
  const width = context.measureText(text).width + 22;
  context.fillStyle = "rgba(255, 255, 255, 0.9)";
  context.strokeStyle = "rgba(20, 33, 36, 0.12)";
  context.lineWidth = 1;
  context.beginPath();
  context.roundRect(projected.x - width / 2, projected.y - 17, width, 34, 10);
  context.fill();
  context.stroke();
  context.fillStyle = color;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, projected.x, projected.y + 1);
}

function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: 0 };
}

function drawGrid() {
  const points = [];
  for (let i = -5; i <= 5; i += 1) {
    points.push([{ x: -5, y: i, z: -0.08 }, { x: 5, y: i, z: -0.08 }]);
    points.push([{ x: i, y: -5, z: -0.08 }, { x: i, y: 5, z: -0.08 }]);
  }

  points.forEach(([start, end]) => drawLine(start, end, "rgba(97, 113, 117, 0.16)", 1));
}

function drawScene() {
  const rect = canvas.getBoundingClientRect();
  context.clearRect(0, 0, rect.width, rect.height);

  const gradient = context.createLinearGradient(0, 0, rect.width, rect.height);
  gradient.addColorStop(0, "#fbfefe");
  gradient.addColorStop(1, "#e8f5f1");
  context.fillStyle = gradient;
  context.fillRect(0, 0, rect.width, rect.height);

  const data = analyze(currentValues);
  const [p0, p1, p2] = makeTrianglePoints(data);
  const edgeColor = data.right ? "#067a5d" : "#be5b20";

  drawGrid();
  drawPolygon(squareFromEdge(p0, p2), "rgba(42, 168, 255, 0.18)", "rgba(21, 126, 196, 0.5)", 2);
  drawPolygon(squareFromEdge(p2, p1), "rgba(21, 193, 132, 0.18)", "rgba(6, 122, 93, 0.5)", 2);
  drawPolygon(squareFromEdge(p1, p0), "rgba(255, 191, 71, 0.16)", "rgba(154, 95, 0, 0.45)", 2);
  drawPolygon([p0, p1, p2], data.valid ? "rgba(255,255,255,0.94)" : "rgba(255,243,234,0.78)", edgeColor, 4);

  drawLine(p0, p1, "#142124", 4);
  drawLine(p1, p2, "#142124", 4);
  drawLine(p2, p0, "#142124", 4);
  drawLabel(`a = ${cleanNumber(data.a)}`, midpoint(p0, p2), "#157ec4");
  drawLabel(`b = ${cleanNumber(data.b)}`, midpoint(p2, p1), "#067a5d");
  drawLabel(`c = ${cleanNumber(data.c)}`, midpoint(p1, p0), "#9a5f00");

  hint.textContent = data.valid
    ? data.right
      ? `En 3D se ve la terna pitagórica: ${cleanNumber(data.a)}² + ${cleanNumber(data.b)}² = ${cleanNumber(data.c)}².`
      : "Estos lados forman un triángulo, pero sus cuadrados no equilibran la hipotenusa."
    : "Estas longitudes no forman triángulo; la figura aparece como una guía suave para corregirlas.";
}

function resize() {
  const rect = sceneHost.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor(rect.height * ratio));
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  drawScene();
}

function updateValues(values = readValues()) {
  currentValues = values;
  drawScene();
}

function animate() {
  requestAnimationFrame(animate);
  if (spinEnabled && !dragging) {
    yaw += 0.004;
    drawScene();
  }
}

function resetView() {
  yaw = -0.58;
  pitch = 0.82;
  zoom = 1;
  drawScene();
}

canvas.addEventListener("pointerdown", (event) => {
  dragging = true;
  lastPointer = { x: event.clientX, y: event.clientY };
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  if (!dragging) return;
  yaw += (event.clientX - lastPointer.x) * 0.008;
  pitch += (event.clientY - lastPointer.y) * 0.008;
  pitch = Math.max(0.2, Math.min(1.35, pitch));
  lastPointer = { x: event.clientX, y: event.clientY };
  drawScene();
});

canvas.addEventListener("pointerup", () => {
  dragging = false;
});

canvas.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    zoom = Math.max(0.7, Math.min(1.7, zoom - event.deltaY * 0.001));
    drawScene();
  },
  { passive: false },
);

resetButton.addEventListener("click", resetView);
spinButton.addEventListener("click", () => {
  spinEnabled = !spinEnabled;
  spinButton.textContent = spinEnabled ? "Pausar giro" : "Activar giro";
  spinButton.setAttribute("aria-pressed", String(spinEnabled));
});

window.addEventListener("resize", resize);
window.addEventListener("triangle:update", (event) => updateValues(event.detail.values));
inputs.forEach((input) => input.addEventListener("input", () => updateValues()));
document.querySelector('[data-tab="view3d"]').addEventListener("click", () => {
  requestAnimationFrame(resize);
});

if ("ResizeObserver" in window) {
  new ResizeObserver(() => resize()).observe(sceneHost);
}

loading.classList.add("is-hidden");
resize();
animate();
