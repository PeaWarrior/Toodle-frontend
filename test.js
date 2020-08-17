const DOM = {
  canvas: document.querySelector('canvas#drawing-canvas'),
}

const ctx = DOM.canvas.getContext('2d');

const TOOLS = {
  line: 'line',
  rectangle: 'rectangle',
  circle: 'circle',
  triangle: 'triangle',
  pencil: 'pencil',
  brush: 'brush',
}

const STATE = {
  activeTool: undefined,
  undo: [],
  redo: [],
  startPos: {x: 0, y: 0},
  currentPos: {x: 0, y: 0},
}

const startPos = {x: 0, y: 0};
const currentPos = {x: 0, y: 0};

let savedData = ctx.getImageData(0, 0, DOM.canvas.width, DOM.canvas.height);

STATE.activeTool = TOOLS.pencil;

// RUN
init();
document.querySelectorAll("[data-tool]").forEach(item => {
  item.addEventListener('click', e => {
      document.querySelector("[data-tool].activetool").classList.toggle("activetool");
      item.classList.toggle("activetool")
      STATE.activeTool = document.querySelector("[data-tool].activetool").dataset["tool"];
  })
})

// EVENT FUNCTIONS
function init() {
  DOM.canvas.onmousedown = e => onMouseDown(e);
}

function onMouseDown(e) {
  savedData = ctx.getImageData(0, 0, DOM.canvas.width, DOM.canvas.height);
  DOM.canvas.onmousemove = e => onMouseMove(e);
  document.onmouseup = e => onMouseUp(e);

  coords = getMouseCoordsOnCanvas(e);
  startPos.x = coords.x;
  startPos.y = coords.y;

  if (STATE.activeTool == TOOLS.pencil) {
    ctx.moveTo(startPos.x, startPos.y);
  }
}

function onMouseMove(e) {
  coords = getMouseCoordsOnCanvas(e, DOM.canvas);
  currentPos.x = coords.x;
  currentPos.y = coords.y;

  switch(STATE.activeTool) {
    case TOOLS.line:
    case TOOLS.rectangle:
    case TOOLS.circle:
    case TOOLS.triangle:
      drawShape();
      break;
    case TOOLS.pencil:
      drawFreeLine();
      break;
    default:
      break;
  }
}

function onMouseUp(e) {
  DOM.canvas.onmousemove = null;
  document.onmouseup = null;

}

// DRAW FUNCTIONS
function drawShape() {
  ctx.putImageData(savedData, 0, 0);
  ctx.beginPath();

  if (STATE.activeTool == TOOLS.line) {
    ctx.moveTo(startPos.x, startPos.y);
    ctx.lineTo(currentPos.x, currentPos.y);
  } else if (STATE.activeTool == TOOLS.rectangle) {
    const rect_width = currentPos.x - startPos.x;
    const rect_height = currentPos.y - startPos.y;
    ctx.rect(startPos.x, startPos.y, rect_width, rect_height);
  } else if (STATE.activeTool == TOOLS.circle) {
    const radius = getRadius(startPos, currentPos);
    ctx.arc(startPos.x, startPos.y, radius, 0, Math.PI * 2, false);
  } else if (STATE.activeTool == TOOLS.triangle) {
    ctx.moveTo(startPos.x + (currentPos.x - startPos.x) / 2, startPos.y);
    ctx.lineTo(startPos.x, currentPos.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.closePath();
  }

  ctx.stroke();
}

function drawFreeLine() {
  ctx.lineTo(currentPos.x, currentPos.y);
  ctx.stroke();
}

// UTILITY FUNCTIONS
function getMouseCoordsOnCanvas(e, canvas) {
  // let rect = canvas.getBoundingClientRect();
  // let x = e.clientX - rect.left;
  // let y = e.clientY - rect.top;
  // return {x: x, y: y};
  return {x: e.offsetX, y: e.offsetY};
}

function isLegitValue(input, min, max) {
  input.value > max ? input.value = max : input.value
  input.value < min ? input.value = min : input.value
}

function hexToRGB(hex) {
  let r = parseInt(hex.slice(1, 3), 16),
      g = parseInt(hex.slice(3, 5), 16),
      b = parseInt(hex.slice(5, 7), 16);

  return `${r}, ${g}, ${b}`
}

function getRadius(coord1, coord2) {
  const xPow = Math.pow(coord2.x - coord1.x, 2);
  const yPow = Math.pow(coord2.y - coord1.y, 2);
  return Math.sqrt(xPow + yPow);
}