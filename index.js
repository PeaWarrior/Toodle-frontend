const DOM = {
  canvasContainer: document.querySelector('div.canvas-container'),
  canvas: document.querySelector('canvas#drawing-canvas'),
  canvasMessage: document.querySelector('div#canvas-message'),
  canvasMessageP: document.querySelector('div#canvas-message p'),
  images: document.querySelector('#images'),
  imageTitle: document.querySelector('#image-title'),
  myDoodle: document.querySelector('#my-doodles'),
  form: document.querySelector('#form'),
  formUsername: document.querySelector('#username'),
  formPassword: document.querySelector('#password'),
  formConfirmPassword: document.querySelector('#confirm-password'),
  formButton: document.querySelector('#form-submit'),
  editForm: document.querySelector('#form-edit'),
  editFormUsername: document.querySelector('#username-edit'),
  editFormPassword: document.querySelector('#password-edit'),
  editFormConfirmPassword: document.querySelector('#confirm-password-edit'),
  formError: document.querySelector('#form-error'),
  formErrorP: document.querySelector('#form-error p'),
  formSuccess: document.querySelector('#form-success'),
  formSuccessP: document.querySelector('#form-success p'),
  loginButton: document.querySelector('#login-btn'),
  signupButton: document.querySelector('#signup-btn'),
  editProfileButton: document.querySelector('#edit-profile-btn'),
  logoutButton: document.querySelector('#logout-btn'),
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
  webcamFeedTag: document.querySelector('#webcam-video'),
}

const TEMPLATE = {
  blendOptions: document.querySelector('template#blend-options-template'),
  strokeSizeOptions: document.querySelector('template#stroke-size-options-template'),
  strokeOpacityOptions: document.querySelector('template#stroke-opacity-options-template'),
  shapeFillOptions: document.querySelector('template#shape-fill-options-template'),
  textOptions: document.querySelector('template#text-options-template'),
  starPointsOptions: document.querySelector('template#star-points-options-template'),
  innerRadiusOptions: document.querySelector('template#inner-radius-options-template'),
  filterOptions: document.querySelector('template#filter-options-template'),
  photoButtons: document.querySelector('template#photo-buttons-template'),
}

const baseURL = "http://localhost:3000";

let ctx = DOM.canvas.getContext('2d');

toggleCanvasHidden();

const TOOLS = {
  line: 'line',
  rectangle: 'rectangle',
  ellipse: 'ellipse',
  circle: 'circle',
  star: 'star',
  polygon: 'polygon',
  triangle: 'triangle',
  brush: 'brush',
  eraser: 'eraser',
  text: 'text',
  photo: 'photo',
}

const FILTERS = {
  "noFilter": noFilter,
  "redShift": redShift,
  "greenShift": greenShift,
  "blueShift": blueShift,
  "scramble": scramble,
  "blackAndWhite": blackAndWhite,
  "negative": negativeFilter,
}

const STATE = {
  activeTool: undefined,
  undo: [],
  redo: [],
  startPos: {x: 0, y: 0},
  currentPos: {x: 0, y: 0},
  userID: null,
  username: "",
  imageTitle: "",
  canvasID: null,
  pressedKeys: new Set(),
  currentFilter: undefined,
  stroke: {
    blend: 'source-over',
    brushColor: '0, 0, 0',
    fillColor: '255, 255, 255',
    width: 5,
    opacity: 1,
    shapeFill: 'outline',
  },
  star: {
    points: 5,
  },
  polygon: {
    innerRadius: 100, 
  },
  text: {
    drawTextInput: "",
    ctxFontSize: "40",
    ctxFontFamily: "Arial",
    textFill: 'outline'
  }
}

const startPos = {x: 0, y: 0};
const currentPos = {x: 0, y: 0};

let points = [];

let savedData;

STATE.activeTool = TOOLS.brush;
STATE.currentFilter = "noFilter";
let webcamInterval;

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
  clearChildren(DOM.toolOptions);
  renderOptions();
}

function renderOptions() {
  switch(STATE.activeTool) {
    case TOOLS.line:
    case TOOLS.rectangle:
    case TOOLS.circle:
    case TOOLS.triangle:
    case TOOLS.ellipse:
    case TOOLS.star:
    case TOOLS.polygon:
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
    case TOOLS.photo:
      renderWebcamOptions();
      setDOMPropsWebcam();
      break;
  }
}

// UI EVENT LISTENERS
DOM.myDoodle.addEventListener('click', myDoodleFunc);
DOM.form.addEventListener('submit', authenticate);
DOM.loginButton.addEventListener('click', showLoginForm);
DOM.signupButton.addEventListener('click', showSignupForm);
DOM.editForm.addEventListener('submit', patchUser);
DOM.editProfileButton.addEventListener('click', toggleEditForm);
DOM.logoutButton.addEventListener('click', logout);

function patchUser(e) {
  e.preventDefault();
  
  const username = DOM.editFormUsername || STATE.username;

  const patchConfig = {
    method: "PATCH",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      user: {
        username: username
      }
    })
  }

  fetch(`http://localhost:3000/users/${STATE.userID}`, patchConfig)
    .then(res => res.json())
    .then(user => {
      showFormSuccess(`username successfully updated to ${user.username}`);

    })

  DOM.editForm.reset();
}

function logout() {
  STATE.userID = "";
  STATE.username = "";
  clearCanvas()
  clearCanvasStates()
  clearImageTitle()
  hideDomElements();
  hideEditLogoutButtons();
  showLoginSignupButtons();
  showLoginForm();
}

function showLoginForm(e) {
  DOM.formButton.value = "login";
  DOM.formButton.textContent = "Login";
  DOM.form.hidden = false;
  DOM.formConfirmPassword.parentElement.hidden = true;
}

function showSignupForm(e) {
  DOM.formButton.value = "signup";
  DOM.formButton.textContent = "Sign Up";
  DOM.formConfirmPassword.parentElement.hidden = false;
}

function showEditForm(e) {
  DOM.editFormUsername.value = STATE.username;
  DOM.editForm.hidden = false;
}

function hideEditForm(e) {
  DOM.editForm.hidden = true;
}

function toggleEditForm(e) {
  hideDomElements()
  DOM.editFormUsername.value = STATE.username;
  DOM.editForm.hidden = !DOM.editForm.hidden;
}

function authenticate(e) {
  e.preventDefault();
  const form = DOM.form;
  const username = form['username'].value;
  const password = form['password'].value

  const submitValue = DOM.formButton.value;

  if (submitValue == "login") {
    login(username, password);
  } else if (submitValue == "signup") {
    signup(username, password);
  } else {
    return;
  }

  form.reset();
}

function signup(username, password) {
  const confirmPassword = DOM.formConfirmPassword.value;

  if (confirmPassword != password) {
    showFormError("passwords don't match");
    return;
  }

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
    .then(user => {
      if (user.status !== 200 && user.status !== 201) {
        throw new Error("Bad response from server")
      } else {
        STATE.userID = user.id;
        STATE.username = user.username;
        hideLoginSignupButtons();
        showEditLogoutButtons();
        DOM.form.hidden = true;
        toggleCanvasHidden();
      }
    })
    .catch(err => {
      showFormError("username is taken");
    });
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
    .then(user => {
      if (user.status !== 200 && user.status !== 201) {
        throw new Error("Bad response from server")
      } else {
        STATE.userID = user.id;
        STATE.username = user.username;
        hideLoginSignupButtons();
        showEditLogoutButtons();
        DOM.form.hidden = true;
        DOM.imageTitle.value = 'Untitled'
        toggleCanvasHidden();
      }
    })
    .catch(err => {
      showFormError("password doesn't match");
    });
}

DOM.imageTitle.addEventListener('input', selectTitleInput)

// UI FUNCTIONS
function hideDomElements() {
  clearChildren(DOM.images);
  clearImageTitle()
  DOM.canvasContainer.hidden = true;
  DOM.editForm.hidden = true;
}

function clearImageTitle() {
  STATE.imageTitle = "";
  DOM.imageTitle.value = STATE.imageTitle;
}

function showFormError(message="wrong username or password") {
  DOM.formErrorP.textContent = message;
  DOM.formError.hidden = false;
  setTimeout(() => DOM.formError.hidden = true, 2000);
}

function showFormSuccess(message) {
  DOM.formSuccessP.textContent = message;
  DOM.formSuccess.hidden = false;
  setTimeout(() => DOM.formSuccess.hidden = true, 2000);
}

function showLoginSignupButtons() {
  DOM.loginButton.hidden = false;
  DOM.signupButton.hidden = false;
}

function hideLoginSignupButtons() {
  DOM.loginButton.hidden = true;
  DOM.signupButton.hidden = true;
}

function showEditLogoutButtons() {
  DOM.editProfileButton.hidden = false;
  DOM.logoutButton.hidden = false;
}

function hideEditLogoutButtons() {
  DOM.editProfileButton.hidden = true;
  DOM.logoutButton.hidden = true;
}

function showCanvasMessage(message) {
  DOM.canvasMessageP.textContent = message;
  DOM.canvasMessage.hidden = false;
  setTimeout(() => DOM.canvasMessage.hidden = true, 2000);
}

function myDoodleFunc(e) {
  if (!STATE.userID) {
    alert('You must be logged in to view your Doodles!')
  } else {
    if (!DOM.canvasContainer.hidden) {
      userResponse = confirm("All unsaved work will be lost.")
      if (userResponse) {
        clearImageTitle()
        clearCanvas();
        toggleCanvasHidden();
      } else return
    }
    hideDomElements()
    fetchAndShowUserWorks();
  }
}

function fetchAndShowUserWorks() {
  fetch(`http://localhost:3000/users/${STATE.userID}`)
    .then(res => res.json())
    .then(user => {
      clearChildren(DOM.images);
      user.images.forEach(image => displayArt(image));
    });
}

function displayArt(image) {
  const figureElement = createFigureElement(image);
  DOM.images.append(figureElement);
}

function selectTitleInput() {
  STATE.imageTitle = this.value
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
    case TOOLS.circle:
    case TOOLS.triangle:
    case TOOLS.star:
    case TOOLS.polygon:
    case TOOLS.ellipse:
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
  switch (STATE.text.textFill) {
    case "outline":
      break;
    case "outlineFill":
      ctx.fillText(STATE.text.drawTextInput, startPos.x, startPos.y)
      break;
    case "fill":
      ctx.fillStyle = `rgba(${STATE.stroke.brushColor}, ${STATE.stroke.opacity})`
      ctx.fillText(STATE.text.drawTextInput, startPos.x, startPos.y)
      ctx.fillStyle = `rgba(${STATE.stroke.fillColor}, ${STATE.stroke.opacity})`
      break;
    default:
      break;
  }
  ctx.strokeText(STATE.text.drawTextInput, startPos.x, startPos.y);
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
  } else if (STATE.activeTool == TOOLS.circle) {
    const radius = getRadius(startPos, currentPos);
    ctx.arc(startPos.x, startPos.y, radius, 0, Math.PI * 2, false);
  } else if (STATE.activeTool == TOOLS.triangle) {
      ctx.moveTo(startPos.x + (currentPos.x - startPos.x) / 2, startPos.y);
      ctx.lineTo(startPos.x, currentPos.y);
      ctx.lineTo(currentPos.x, currentPos.y);
      ctx.closePath();
  } else if (STATE.activeTool == TOOLS.star) {
      const centerX = currentPos.x;
      const centerY = currentPos.y;

      const points = STATE.star.points; // user can vary this using sliders
      const outerRadius = getPythagoreanDistance(startPos, currentPos);
      const innerRadius = Math.round(outerRadius / 2);

      ctx.moveTo(centerX, centerY+outerRadius);

      for (let i=0; i < 2*points+1; i++) {
          const r = (i%2 == 0)? outerRadius : innerRadius;
          const a = Math.PI * i/points;
          ctx.lineTo(centerX + r*Math.sin(a), centerY + r*Math.cos(a));
      };

      ctx.closePath();
  } else if (STATE.activeTool == TOOLS.polygon) {
      const centerX = currentPos.x;
      const centerY = currentPos.y;

      const points = STATE.star.points;
      const outerRadius = getPythagoreanDistance(startPos, currentPos);
      const innerRadius = STATE.polygon.innerRadius;

      ctx.moveTo(centerX, centerY+outerRadius);

      for (let i=0; i < 2*points+1; i++) {
          const r = (i%2 == 0)? outerRadius : innerRadius;
          const a = Math.PI * i/points;
          ctx.lineTo(centerX + r*Math.sin(a), centerY + r*Math.cos(a));
      };

      ctx.closePath();
  } else if (STATE.activeTool == TOOLS.ellipse) {
      const a = Math.abs(currentPos.x - startPos.x);
      const b = Math.abs(currentPos.y - startPos.y);
      ctx.ellipse(startPos.x, startPos.y, a, b, Math.PI, 0, Math.PI * 2);
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

function getPythagoreanDistance(coords1, coords2) {
  const a = Math.abs(coords2.x) - Math.abs(coords1.x);
  const b = Math.abs(coords2.y) - Math.abs(coords1.y);
  const c = Math.sqrt(a ** 2 + b ** 2);
  return c;
}

function clearCanvasStates() {
  STATE.undo.length = 0
  STATE.redo.length = 0
}

function promptAndSetImageTitle() {
  STATE.imageTitle = prompt("Please enter a title (PG-13)");
  DOM.imageTitle.value = STATE.imageTitle || "Untitled";
}

function toggleCanvasHidden() {
  DOM.canvasContainer.hidden = !DOM.canvasContainer.hidden;
}

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
}

function getCtxText() {
  return `${STATE.text.ctxFontSize}px ${STATE.text.ctxFontFamily}`;
}

function setDOMPropsWebcam() {
  DOM.startWebcamBtn = document.querySelector('div#photo-buttons button#start-webcam-btn');
  DOM.stopWebcamBtn = document.querySelector('div#photo-buttons button#stop-webcam-btn');
  DOM.captureWebcamBtn = document.querySelector('div#photo-buttons button#capture-btn');
  DOM.filterSelect = document.querySelector('select#filter-select');
}

// COMMAND EVENTS
DOM.newButton.addEventListener('click', newCanvas)
DOM.downloadButton.addEventListener('click', downloadCanvas)
DOM.clearButton.addEventListener('click', clearCanvas)
DOM.undoButton.addEventListener('click', undoCanvas)
DOM.redoButton.addEventListener('click', redoCanvas)
DOM.saveButton.addEventListener('click', saveCanvas)

// COMMAND FUNCTIONS
function saveCanvas() {
  if (!STATE.userID) {
    alert('Please log in or sign up to begin Doodling!')
    return
  }
  let dataURL = DOM.canvas.toDataURL()
  let imageObj = {
      image: {
          user_id: `${STATE.userID}`,
          title: DOM.imageTitle.value,
          art: dataURL
      }
  }
  !!STATE.canvasID ? updateCanvas(imageObj) : postCanvas(imageObj)
}

function newCanvas() {
  if (!!STATE.userID) {
    hideDomElements()
    ctx.clearRect(0, 0, DOM.canvas.width, DOM.canvas.height)
    STATE.canvasID = null;
    promptAndSetImageTitle();
    clearCanvasStates();
    toggleCanvasHidden();
  } else {
    alert('Please log in or sign up to start Doodling!')
  }
}

function clearCanvas() {
  ctx.clearRect(0, 0, 700, 500)
  savedData = ctx.getImageData(0, 0, DOM.canvas.width, DOM.canvas.height);
  STATE.undo.push(savedData)
  showCanvasMessage('Cleared')
}

function downloadCanvas() {
  if (!STATE.userID) {
    alert('Please log in or sign up to begin Doodling!')
    return
  } 
  if (DOM.canvasContainer.hidden === true) {
    return
  }
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
  const deleteBtn = document.createElement('span')
    deleteBtn.innerText = "x"
    deleteBtn.classList.add('delete-image')
    deleteBtn.dataset.imageId = image.id
  const img = document.createElement('img');
    img.crossOrigin = "Anonymous"
    img.src = `${baseURL}${image.art.url}`
  const figcaption = document.createElement('figcaption');
    figcaption.textContent = `${image.title}`;
  figure.append(deleteBtn, img, figcaption);
  img.addEventListener('click', displayImageOnCanvas(image));
  deleteBtn.addEventListener('click', promptDelete)
  return figure;
}

function promptDelete() {
  let response = confirm('Are you sure you want to delete this Doodle?')
  if (response) {
    deleteImage(this.dataset.imageId)
  }
}

function deleteImage(imageObjId) {
  fetch(`http://localhost:3000/images/${imageObjId}`, {
    method: 'DELETE'
  })
  .then(resp => resp.json())
  .then(data => fetchAndShowUserWorks())
}

function displayImageOnCanvas(imageObj) {
  return function() {
    STATE.imageTitle = imageObj.title;
    clearChildren(DOM.images);
    DOM.imageTitle.value = STATE.imageTitle;
    toggleCanvasHidden();
    ctx.drawImage(this, 0, 0);
    savedData = ctx.getImageData(0, 0, DOM.canvas.width, DOM.canvas.height);
    STATE.undo.length = 0;
    STATE.undo.push(savedData);
    STATE.canvasID = imageObj.id;
  }
}

function renderWebcamOptions() {
  DOM.toolOptions.append(renderToolHeader(), renderPhotoButtons(), renderFilterOptions());
}

function renderBrushOptions() {
  DOM.toolOptions.append(renderToolHeader(), renderBlendOptions(), renderSizeOptions(), renderOpacityOptions())
}

function renderShapeOptions() {
  DOM.toolOptions.append(renderToolHeader(), renderBlendOptions(), renderShapeFillOptions(), renderSizeOptions())
  if (STATE.activeTool !== 'polygon') {
    DOM.toolOptions.append(renderOpacityOptions())
  }
  if (STATE.activeTool === "star" || STATE.activeTool === 'polygon') {
    DOM.toolOptions.append(renderStarPointsOptions())
  }
  if (STATE.activeTool === 'polygon') {
    DOM.toolOptions.append(renderInnerRadiusOptions())
  }
}

function renderEraserOptions() {
  DOM.toolOptions.append(renderToolHeader(), renderSizeOptions(), renderOpacityOptions())
}

function renderToolHeader() {
  const toolHeader = document.createElement('h5')
    toolHeader.classList = "tool-header"
    toolHeader.innerText = `${STATE.activeTool.capitalize()} Tool`
  return toolHeader
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
  const textOptions = TEMPLATE.textOptions.cloneNode(true).content.querySelector('div#text-options')
  const textInput = textOptions.querySelector('input#text-input')
    textInput.value = STATE.text.drawTextInput
    textInput.addEventListener('input', changeDrawTextInput)
  const textFontFamily = textOptions.querySelector('select#text-font-family')
    textFontFamily.value = STATE.text.ctxFontFamily
    textFontFamily.addEventListener('input', changeFontFamily)
  const textFontSize = textOptions.querySelector('input#text-font-size')
    textFontSize.value = STATE.text.ctxFontSize
    textFontSize.addEventListener('input', changeFontSize)
  DOM.toolOptions.append(renderToolHeader(), renderShapeFillOptions(), textOptions)
}

function renderStarPointsOptions() {
  const starPointsOptions = TEMPLATE.starPointsOptions.cloneNode(true).content.querySelector('div#star-points-options')
  const starPointsInputs = starPointsOptions.querySelectorAll('input')
  starPointsInputs.forEach((input) => {
    input.value = STATE.star.points
    input.addEventListener('input', changeStarPoints)
  })
  return starPointsOptions
}

function renderInnerRadiusOptions() {
  const innerRadiusOptions = TEMPLATE.innerRadiusOptions.cloneNode(true).content.querySelector('div#inner-radius-options')
  const innerRadiusInputs = innerRadiusOptions.querySelectorAll('input')
  innerRadiusInputs.forEach((input) => {
    input.value = STATE.polygon.innerRadius
    input.addEventListener('input', changeInnerRadius)
  })
  return innerRadiusOptions
}

function renderFilterOptions() {
  const filterOptions = TEMPLATE.filterOptions.cloneNode(true).content.querySelector('div#filter-options');
  const filterSelector = filterOptions.querySelector('select#filter-select');
    filterSelector.value = STATE.currentFilter;
    filterSelector.addEventListener('input', changeFilter);
    return filterOptions;
}

function renderPhotoButtons() {
  const photoButtonsDiv = TEMPLATE.photoButtons.cloneNode(true).content.querySelector('div#photo-buttons');

  const startWebcamBtn = photoButtonsDiv.querySelector('button#start-webcam-btn');
    startWebcamBtn.classList.add("btn", "photo-btn");
    startWebcamBtn.addEventListener('click', () => {
      DOM.startWebcamBtn.hidden = true;
      DOM.stopWebcamBtn.hidden = false;
      DOM.filterSelect.disabled = false;
      getWebcamFeed();
    });

  const stopWebcamBtn = photoButtonsDiv.querySelector('button#stop-webcam-btn');
    stopWebcamBtn.classList.add("btn", "photo-btn");
    stopWebcamBtn.addEventListener('click', () => {
      DOM.startWebcamBtn.hidden = false;
      DOM.stopWebcamBtn.hidden = true;
      stopWebcamFeed();
      clearCanvas();
    })

  const captureBtn = photoButtonsDiv.querySelector('button#capture-btn');
    captureBtn.classList.add("btn", "photo-btn");
    captureBtn.addEventListener('click', () => {
      DOM.filterSelect.disabled = true;
      DOM.startWebcamBtn.hidden = false;
      DOM.stopWebcamBtn.hidden = true;
      takePhoto();
      stopWebcamFeed();
    });

  return photoButtonsDiv;
}

// REMOVE DOM ELEMENTS
function clearChildren(element) {
  let children = Array.from(element.children);
  children.forEach(child => {
    child.remove();
  });
}

// CHANGE STATE FUNCTIONS
function changeShapeFill() {
  if (STATE.activeTool === 'text') {
    STATE.text.textFill = this.value
  } else {
    STATE.stroke.shapeFill = this.value
  }
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

function changeFilter() {
  STATE.currentFilter = this.value;
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
  STATE.text.drawTextInput = this.value
}

function changeFontFamily() {
  STATE.text.ctxFontFamily = this.value
}

function changeFontSize() {
  STATE.text.ctxFontSize = this.value
}

function changeStarPoints() {
  isLegitValue(this, 1, 100)
  this.id === "star-points-slider" ? this.nextElementSibling.value = this.value : this.previousElementSibling.value = this.value
  STATE.star.points = this.value
}

function changeInnerRadius() {
  isLegitValue(this, 1, 100)
  this.id === "inner-radius-slider" ? this.nextElementSibling.value = this.value : this.previousElementSibling.value = this.value
  STATE.polygon.innerRadius = this.value
}


// FETCH FUNCTIONS

function updateCanvas(imageObj) {
  fetch(`http://localhost:3000/images/${STATE.canvasID}`, {
      method: 'PATCH',
      headers: {
          'content-type': 'application/json'
      },
      body: JSON.stringify(imageObj)
  })
  .then(resp => resp.json())
  .then(imageData => showCanvasMessage(`Saved`))
}

function postCanvas(imageObj) {
  fetch(`http://localhost:3000/images/`, {
      method: 'POST',
      headers: {
          'content-type': 'application/json'
      },
      body: JSON.stringify(imageObj)
  })
  .then(resp => resp.json())
  .then(imageData => {
    STATE.canvasID = imageData.id
    showCanvasMessage(`Saved`)
  })
}

// KEYBOARD EVENT LISTENERS

function funcOnKeys(func, ...codes) {
  let pressed = new Set();

  document.addEventListener('keydown', function(event) {
    pressed.add(event.code);

    for (let code of codes) {
      if (!pressed.has(code)) {
        return;
      }
    }

    pressed.clear();
    func();
  })

  document.addEventListener('keyup', (event) => pressed.delete(event.code));
}

funcOnKeys(undoCanvas, "ControlLeft", "KeyZ");
funcOnKeys(undoCanvas, "MetaLeft", "KeyZ");
funcOnKeys(redoCanvas, "ShiftLeft", "KeyZ");

// FILTER FUNCTIONS
function applyFilter(filter) {
  let filterImage = ctx.getImageData(0, 0, DOM.canvas.width, DOM.canvas.height);
  filterImage = filter(filterImage);
  ctx.putImageData(filterImage, 0, 0);
}

function redShift(image) {
  for (let i = 0; i < image.data.length; i+=4) {
    image.data[i] = image.data[i] + 100;
    image.data[i + 1] = image.data[i + 1] - 100;
    image.data[i + 2] = image.data[i + 2] - 100;
  }
  return image;
}

function greenShift(image) {
  for (let i = 0; i < image.data.length; i+=4) {
    image.data[i] = image.data[i] - 100;
    image.data[i + 1] = image.data[i + 1] + 100;
    image.data[i + 2] = image.data[i + 2] - 100;
  }
  return image;
}

function blueShift(image) {
  for (let i = 0; i < image.data.length; i+=4) {
    image.data[i] = image.data[i] - 100;
    image.data[i + 1] = image.data[i + 1] - 100;
    image.data[i + 2] = image.data[i + 2] + 100;
  }
  return image;
}

function scramble(image) {
  for (let i = 0; i < image.data.length; i+=4) {
    image.data[i - 200] = image.data[i];
    image.data[i + 100] = image.data[i + 1];
    image.data[i - 200] = image.data[i + 2];
  }
  return image;
}

function blackAndWhite(image) {
  for (let i = 0; i < image.data.length; i+=4) {
    const avg = (image.data[i] + image.data[i+1] + image.data[i+2]) / 3;
    image.data[i] = avg;
    image.data[i + 1] = avg;
    image.data[i + 2] = avg;
  }

  return image;
}

function negativeFilter(image) {
  const threshold = 60;
  data = image.data;
  
  for (let i=0; i < data.length; i+=4) {
    let r = data[i];
    let g = data[i+1];
    let b = data[i+2];
    let v = (0.2126*r + 0.7152*g + 0.0722*b >= threshold) ? 255 : 0;
    data[i] = data[i+1] = data[i+2] = v;
  }

  return image;
}

function noFilter(image) {
  return image;
}

// WEBCAM FUNCTIONS
function getWebcamFeed() {
  navigator.mediaDevices.getUserMedia({video: true, audio: false})
    .then(localMediaStream => {
      DOM.webcamFeedTag.srcObject = localMediaStream;
      DOM.webcamFeedTag.play();
      webcamInterval = setInterval(() => {
        ctx.drawImage(DOM.webcamFeedTag, 0, 0, DOM.canvas.width, DOM.canvas.height);
        applyFilter(FILTERS[STATE.currentFilter]);
      }, 150);
    }).catch(err => console.log(err));
}

function stopWebcamFeed() {
  clearInterval(webcamInterval);
  DOM.webcamFeedTag.src = null;
}

function takePhoto() {
  let image = ctx.getImageData(0, 0, DOM.canvas.width, DOM.canvas.height);
  clearInterval(webcamInterval);
  ctx.putImageData(image, 0, 0);
}
