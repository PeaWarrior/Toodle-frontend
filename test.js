const DOM = {
  canvasContainer: document.querySelector('div.canvas-container'),
  canvas: document.querySelector('canvas#drawing-canvas'),
  images: document.querySelector('#images'),
  imageTitle: document.querySelector('#image-title'),
  myDoodle: document.querySelector('#my-doodles'),
  form: document.querySelector('#form'),
  formButton: document.querySelector('#form-submit'),
  newButton: document.querySelector('div[data-command="new"]'),
  downloadButton: document.querySelector('div[data-command="download"]'),
  saveButton: document.querySelector('div[data-command="save"]'),
  clearButton: document.querySelector('div[data-command="clear"]'),
  undoButton: document.querySelector('div[data-command="undo"]'),
  redoButton: document.querySelector('div[data-command="redo"]'),
  eraserButton: document.querySelector('div[data-command="eraser"]'),
  toolOptions: document.querySelector('div#tool-options'),
  strokeColorInput: document.querySelector('input#stroke-color-input'),
  fillColorInput: document.querySelector('input#fill-color-input'),
}

const TEMPLATE = {
  // brushOptions: document.querySelector('template#brush-options-template'),
  blendOptions: document.querySelector('template#blend-options-template'),
  strokeSizeOptions: document.querySelector('template#stroke-size-options-template'),
  strokeOpacityOptions: document.querySelector('template#stroke-opacity-options-template'),
  shapeFillOptions: document.querySelector('template#shape-fill-options-template'),
  textOptions: document.querySelector('template#text-options-template'),
}

const baseURL = "http://localhost:3000";

let ctx = DOM.canvas.getContext('2d');

toggleCanvasHidden();

const TOOLS = {
  line: 'line',
  rectangle: 'rectangle',
  ellipse: 'ellipse',
  triangle: 'triangle',
  brush: 'brush',
  eraser: 'eraser',
  text: 'text',
}

const STATE = {
  activeTool: undefined,
  undo: [],
  redo: [],
  startPos: {x: 0, y: 0},
  currentPos: {x: 0, y: 0},
  userID: 1,
  imageTitle: "",
  stroke: {
    blend: 'source-over',
    brushColor: '0, 0, 0',
    fillColor: '255, 255, 255',
    width: 5,
    opacity: 1,
    shapeFill: 'outline',
  },
  drawTextInput: "Help Pls",
  ctxFontSize: "40px",
  ctxFontFamily: "sans-serif",
}

const startPos = {x: 0, y: 0};
const currentPos = {x: 0, y: 0};

let points = [];

let savedData;

STATE.activeTool = TOOLS.brush;

// RUN
initCtx()
init();

document.querySelectorAll("[data-tool]").forEach(item => {
  item.addEventListener('click', toggleActiveTool)
})

function toggleActiveTool() {
  document.querySelector("[data-tool].activetool").classList.toggle("activetool");
  this.classList.toggle("activetool");
  STATE.activeTool = document.querySelector("[data-tool].activetool").dataset["tool"];
  DOM.toolOptions.innerHTML = ""
  renderOptions()
}

function renderOptions() {
  switch(STATE.activeTool) {
    case TOOLS.line:
    case TOOLS.rectangle:
    case TOOLS.ellipse:
    case TOOLS.triangle:
      renderShapeOptions();
      break;
    case TOOLS.brush:
      renderBrushOptions();
      break;
    case TOOLS.eraser:
      renderEraserOptions();
      break;
    case TOOLS.text:
      renderTextOptions();
      break;
  }
}

DOM.myDoodle.addEventListener('click', myDoodleFunc);

DOM.form.addEventListener('submit', authenticate);

function authenticate(e) {
  e.preventDefault();
  const form = DOM.form;
  const username = form['username'].value;
  const password = form['password'].value

  const submitValue = DOM.formButton.value;

  if (submitValue == "login") {
    login(username, password);
  } else {
    signup(username, password);
  }

  form.reset();
}

function signup(username, password) {
  const postConfig = {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      user: {
        username: username,
        password: password
      }
    })
  }

  fetch('http://localhost:3000/signup', postConfig)
    .then(res => res.json())
    .then(user => console.log(user))
    .catch(err => console.log(err));
}

function login(username, password) {
  const postConfig = {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      user: {
        username: username,
        password: password
      }
    })
  }

  fetch('http://localhost:3000/login', postConfig)
    .then(res => res.json())
    .then(user => STATE.userID = user.id)
    .catch(err => console.log(err));
}

// UI FUNCTIONS
function myDoodleFunc(e) {
  userResponse = confirm("WILL DESTROY EVERYTHING!!!")
  if (userResponse) {
    STATE.imageTitle = "";
    DOM.imageTitle.textContent = STATE.imageTitle;
    // HIDE CANVAS
    clearCanvas();
    toggleCanvasHidden();
    fetchAndShowUserWorks();
  } else {
    console.log("lol got scared for a sec...");
  }
}

function fetchAndShowUserWorks() {
  fetch(`http://localhost:3000/users/${STATE.userID}`)
    .then(res => res.json())
    .then(user => {
      DOM.images.innerHTML = "";
      user.images.forEach(image => displayArt(image));
    });
}

function displayArt(image) {
  const figureElement = createFigureElement(image);
  DOM.images.append(figureElement);
}

// EVENT FUNCTIONS
function init() {
  DOM.canvas.onmousedown = e => onMouseDown(e);
  DOM.strokeColorInput.addEventListener('input', changeStrokeColor)
  DOM.fillColorInput.addEventListener('input', changeFillColor)
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
    ctx.clearRect(0, 0, DOM.canvas.width, DOM.canvas.height)
    ctx.putImageData(STATE.undo[STATE.undo.length-1], 0, 0)
    points.push(coords)
    drawFreeLine()
  } else if (STATE.activeTool === TOOLS.text) {
    drawText();
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
    case TOOLS.ellipse:
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
  points = [];
  savedData = ctx.getImageData(0, 0, DOM.canvas.width, DOM.canvas.height);
  STATE.undo.push(savedData);
  DOM.canvas.onmousemove = null;
  document.onmouseup = null;
}

// DRAW FUNCTIONS
function drawText() {
  ctx.font = getCtxText();
  ctx.putImageData(savedData, 0, 0);
  ctx.beginPath();
  ctx.strokeText(STATE.drawTextInput, startPos.x, startPos.y);
  ctx.closePath();
}

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
  } else if (STATE.activeTool == TOOLS.ellipse) {
    const radius = getRadius(startPos, currentPos);
    ctx.arc(startPos.x, startPos.y, radius, 0, Math.PI * 2, false);
  } else if (STATE.activeTool == TOOLS.triangle) {
    ctx.moveTo(startPos.x + (currentPos.x - startPos.x) / 2, startPos.y);
    ctx.lineTo(startPos.x, currentPos.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.closePath();
  }
  switch (STATE.stroke.shapeFill) {
    case "outline":
      break;
    case "outlineFill":
      ctx.fill()
      break;
    case "fill":
      ctx.fillStyle = `rgba(${STATE.stroke.brushColor}, ${STATE.stroke.opacity})`
      ctx.fill()
      ctx.fillStyle = `rgba(${STATE.stroke.fillColor}, ${STATE.stroke.opacity})`
      break;
    default:
      break;
  }
  ctx.stroke();
}

function drawFreeLine() {
  ctx.clearRect(0, 0, DOM.canvas.width, DOM.canvas.height)
  ctx.putImageData(STATE.undo[STATE.undo.length-1], 0, 0)
  STATE.redo = []
  if (points.length < 6) {
      ctx.fillStyle = `rgba(${STATE.stroke.brushColor}, ${STATE.stroke.opacity})`
      let firstPoint = points[0];
      ctx.beginPath()
      ctx.arc(firstPoint.x, firstPoint.y, ctx.lineWidth / 2, 0, Math.PI * 2, !0)
      ctx.closePath()
      ctx.fill();
      ctx.fillStyle = `rgba(${STATE.stroke.fillColor}, ${STATE.stroke.opacity})`
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
  ctx.globalCompositeOperation = STATE.stroke.blend
}

// UTILITY FUNCTIONS
function initCtx() {
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.globalCompositeOperation = STATE.stroke.blend
  ctx.strokeStyle = `rgba(${STATE.stroke.brushColor}, ${STATE.stroke.opacity})`
  ctx.fillStyle = `rgba(${STATE.stroke.fillColor}, ${STATE.stroke.opacity})`
  ctx.lineWidth = STATE.stroke.width
}
function getMouseCoordsOnCanvas(e) {
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

function clearCanvasStates() {
  STATE.undo.length = 0
  STATE.redo.length = 0
}

function promptAndSetImageTitle() {
  STATE.imageTitle = prompt("Please enter a title (PG-13)");
  DOM.imageTitle.textContent = STATE.imageTitle || "Untitled";
}

function toggleCanvasHidden() {
  DOM.canvasContainer.hidden = !DOM.canvasContainer.hidden;
}

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
}

function getCtxText() {
  return `${STATE.ctxFontSize} ${STATE.ctxFontFamily}`;
}

// COMMAND EVENTS
DOM.newButton.addEventListener('click', newCanvas)
DOM.downloadButton.addEventListener('click', downloadCanvas)
DOM.clearButton.addEventListener('click', clearCanvas)
DOM.undoButton.addEventListener('click', undoCanvas)
DOM.redoButton.addEventListener('click', redoCanvas)

// COMMAND FUNCTIONS
function newCanvas() {
  promptAndSetImageTitle();
  clearCanvasStates();
  toggleCanvasHidden();
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

// CREATE DOM ELEMENTS FUNCTIONS
function createFigureElement(image) {
  const figure = document.createElement('figure');
  const img = document.createElement('img');
    img.src = `${baseURL}${image.art.url}`
  const figcaption = document.createElement('figcaption');
    figcaption.textContent = `${image.title}`;
  figure.append(img, figcaption);
  return figure;
}

function renderBrushOptions() {
  const toolHeader = document.createElement('h6')
    toolHeader.innerText = `${STATE.activeTool.capitalize()} tool`
  DOM.toolOptions.append(toolHeader, renderBlendOptions(), renderSizeOptions(), renderOpacityOptions())
}

function renderShapeOptions() {
  const toolHeader = document.createElement('h6')
    toolHeader.innerText = `${STATE.activeTool.capitalize()} tool`
  DOM.toolOptions.append(toolHeader, renderShapeFillOptions(), renderBlendOptions(), renderSizeOptions(), renderOpacityOptions())
}

function renderEraserOptions() {
  const toolHeader = document.createElement('h6')
    toolHeader.innerText = `${STATE.activeTool.capitalize()} tool`
  DOM.toolOptions.append(toolHeader, renderSizeOptions(), renderOpacityOptions())
}

function renderBlendOptions() {
  const blendOptions = TEMPLATE.blendOptions.cloneNode(true).content.querySelector('div#stroke-blend-options')
  const blendSelector = blendOptions.querySelector('select#stroke-blend-select')
    blendSelector.value = STATE.stroke.blend
    blendSelector.addEventListener('input', changeBlend)
  return blendOptions
}

function renderSizeOptions() {
  const strokeSizeOptions = TEMPLATE.strokeSizeOptions.cloneNode(true).content.querySelector('div#stroke-size-options')
  const strokeSizeOptionInputs = strokeSizeOptions.querySelectorAll('input')
  strokeSizeOptionInputs.forEach((input) => {
    input.value = STATE.stroke.width
    input.addEventListener('input', changeStrokeSize)
  })
  return strokeSizeOptions
}

function renderOpacityOptions() {
  const strokeOpacityOptions = TEMPLATE.strokeOpacityOptions.cloneNode(true).content.querySelector('div#opacity-options')
  const strokeOpacityOptionInputs = strokeOpacityOptions.querySelectorAll('input')
  strokeOpacityOptionInputs.forEach((input) => {
    input.value = STATE.stroke.opacity*100
    input.addEventListener('input', changeStrokeOpacity)
  })
  return strokeOpacityOptions
}

function renderShapeFillOptions() {
  const shapeFillOptions = TEMPLATE.shapeFillOptions.cloneNode(true).content.querySelector('div#shape-fill-options')
  const shapeFillSelect = shapeFillOptions.querySelector('select#shape-fill-select')
  shapeFillSelect.value = STATE.stroke.shapeFill
  shapeFillSelect.addEventListener('input', changeShapeFill)
  return shapeFillOptions
}

function renderTextOptions() {
  const toolHeader = document.createElement('h6')
    toolHeader.innerText = `${STATE.activeTool.capitalize()} tool`
  const textOptions = TEMPLATE.textOptions.cloneNode(true).content.querySelector('div#text-options')
  const textInput = textOptions.querySelector('input#text-input')
    textInput.value = STATE.drawTextInput
    textInput.addEventListener('input', changeDrawTextInput)
    debugger
  const textFontFamily = textOptions.querySelector('select#text-font-family')
    textFontFamily.value = STATE.ctxFontFamily
    textFontFamily.addEventListener('input', changeFontFamily)
  const textFontSize = textOptions.querySelector('input#text-font-size')
    textFontSize.value = STATE.ctxFontSize
    textFontFamily.addEventListener('input', changeFontSize)
  DOM.toolOptions.append(toolHeader, textOptions)
}

// CHANGE STATE FUNCTIONS
function changeShapeFill() {
  console.log(this.value)
  STATE.stroke.shapeFill = this.value
}

function changeStrokeColor() {
  STATE.stroke.brushColor = hexToRGB(this.value);
  ctx.strokeStyle = `rgba(${STATE.stroke.brushColor}, ${STATE.stroke.opacity})`;
}

function changeFillColor() {
  STATE.stroke.fillColor = hexToRGB(this.value);
  ctx.fillStyle = `rgba(${STATE.stroke.fillColor}, ${STATE.stroke.opacity})`;
}

function changeBlend() {
  STATE.stroke.blend = this.value
  ctx.globalCompositeOperation = STATE.stroke.blend
}

function changeStrokeSize() {
  isLegitValue(this, 1, 100)
  this.id === "stroke-size-slider" ? this.nextElementSibling.value = this.value : this.previousElementSibling.value = this.value
  STATE.stroke.width = this.value
  ctx.lineWidth = STATE.stroke.width
}

function changeStrokeOpacity() {
  isLegitValue(this, 1, 100)
  this.id === "stroke-opacity-slider" ? this.nextElementSibling.value = this.value : this.previousElementSibling.value = this.value
  STATE.stroke.opacity = this.value/100
  ctx.globalAlpha = STATE.stroke.opacity
}

function changeDrawTextInput() {
  STATE.drawTextInput = this.value
}

function changeFontFamily() {
  STATE.ctxFontFamily = this.value
}

function changeFontSize() {
  STATE.ctxFontSize = this.value
}