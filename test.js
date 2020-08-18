const DOM = {
  canvasContainer: document.querySelector('div.canvas-container'),
  canvas: document.querySelector('canvas#drawing-canvas'),
  newButton: document.querySelector('div[data-command="new"]'),
  downloadButton: document.querySelector('div[data-command="download"]'),
  saveButton: document.querySelector('div[data-command="save"]'),
  clearButton: document.querySelector('div[data-command="clear"]'),
  undoButton: document.querySelector('div[data-command="undo"]'),
  redoButton: document.querySelector('div[data-command="redo"]'),
  eraserButton: document.querySelector('div[data-command="eraser"]'),
  colorPicker: document.querySelector('input#stroke-color-input'),
}

const TEMPLATE = {
  canvas: document.querySelector('template#canvas-template'),
}

let ctx

const TOOLS = {
  line: 'line',
  rectangle: 'rectangle',
  circle: 'circle',
  triangle: 'triangle',
  brush: 'brush',
  eraser: 'eraser',
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

let points = [];

let savedData

STATE.activeTool = TOOLS.brush;

// RUN
// init();
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
  DOM.colorPicker.addEventListener('input', changeStrokeColor)
}

function onMouseDown(e) {
  savedData = ctx.getImageData(0, 0, DOM.canvas.width, DOM.canvas.height);
  if (STATE.undo.length === 0) {
    STATE.undo.push(savedData)
  }
  DOM.canvas.onmousemove = e => onMouseMove(e);
  document.onmouseup = e => onMouseUp(e);
  coords = getMouseCoordsOnCanvas(e);
  startPos.x = e.offsetX;
  startPos.y = e.offsetY;
  if (STATE.activeTool === TOOLS.brush) {
    points.push(coords)
    drawFreeLine()
  }
}

function onMouseMove(e) {
  coords = getMouseCoordsOnCanvas(e, DOM.canvas);
  currentPos.x = e.offsetX;
  currentPos.y = e.offsetY;
  points.push(coords)

  switch(STATE.activeTool) {
    case TOOLS.line:
    case TOOLS.rectangle:
    case TOOLS.circle:
    case TOOLS.triangle:
      drawShape();
      break;
    case TOOLS.brush:
      drawFreeLine();
      break;
    case TOOLS.eraser:
      erase();
      break;
    default:
      break;
  }
}

function onMouseUp(e) {
  points = []
  savedData = ctx.getImageData(0, 0, DOM.canvas.width, DOM.canvas.height);
  STATE.undo.push(savedData)
  DOM.canvas.onmousemove = null;
  document.onmouseup = null;
}

function changeStrokeColor() {
  ctx.strokeStyle = `rgba(${hexToRGB(this.value)})`
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
  // ctx.globalCompositeOperation = 'source-over'
  STATE.redo = []
  if (points.length < 6) {
      let firstPoint = points[0];
      ctx.beginPath()
      ctx.arc(firstPoint.x, firstPoint.y, ctx.lineWidth / 2, 0, Math.PI * 2, !0)
      ctx.closePath()
      ctx.fill();
      return
  }
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (i = 1; i < points.length - 2; i++) {
      let a = (points[i].x + points[i + 1].x)/2,
          b = (points[i].y + points[i + 1].y)/2
          ctx.quadraticCurveTo(points[i].x, points[i].y, a, b)
      }
  ctx.quadraticCurveTo(points[i].x, points[i].y, points[i + 1].x, points[i +1].y)
  ctx.stroke()
}

function erase() {
  ctx.globalCompositeOperation = 'destination-out'
  drawFreeLine()
  ctx.globalCompositeOperation = 'source-over'
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

function createNewCanvasFromTemplate() {
  if (!!DOM.canvas && confirm('Your will lose all unsaved work.')) {
      DOM.canvas.remove()
  }
  let newCanvas = TEMPLATE.canvas.content.cloneNode(true).querySelector('canvas')
  DOM.canvas = newCanvas
  ctx = DOM.canvas.getContext('2d')
  init()
}

function clearCanvasStates() {
  STATE.undo.length = 0
  STATE.redo.length = 0
}

// COMMAND EVENTS
DOM.newButton.addEventListener('click', newCanvas)
DOM.downloadButton.addEventListener('click', downloadCanvas)
DOM.clearButton.addEventListener('click', clearCanvas)
DOM.undoButton.addEventListener('click', undoCanvas)
DOM.redoButton.addEventListener('click', redoCanvas)

// COMMAND FUNCTIONS
function newCanvas() {
  createNewCanvasFromTemplate()
  DOM.canvasContainer.append(DOM.canvas)
  clearCanvasStates()
}

function clearCanvas() {
  ctx.clearRect(0, 0, 700, 500)
  savedData = ctx.getImageData(0, 0, DOM.canvas.width, DOM.canvas.height);
  STATE.undo.push(savedData)
}

function downloadCanvas() {
  let tempLink = document.createElement('a')
  tempLink.href = DOM.canvas.toDataURL()
  tempLink.download = ''
  tempLink.click()
}

function undoCanvas() {
  if (STATE.undo.length > 1) {
    ctx.putImageData(STATE.undo[STATE.undo.length-2], 0, 0)
    STATE.redo.push(STATE.undo.pop())
  }
}

function redoCanvas() {
  if (STATE.redo.length) {
    ctx.putImageData(STATE.redo[STATE.redo.length-1], 0, 0)
    STATE.undo.push(STATE.redo.pop())
  }
}
