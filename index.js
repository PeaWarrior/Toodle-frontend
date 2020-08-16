const canvasContainer = document.querySelector('div.grid')

let background = document.createElement('canvas')
    background.width = 700
    background.height = 500
    background.className = "canvas bg"

    let backgroundCtx = background.getContext('2d')
    backgroundCtx.fillStyle = 'rgba(255, 255, 255)'
    backgroundCtx.fillRect(0, 0, background.width, background.height)

let canvas = document.createElement('canvas')
    canvas.className = "canvas first"
    canvas.width = 700
    canvas.height = 500

canvasContainer.append(background, canvas)
let ctx = canvas.getContext('2d')
// ctx.globalCompositeOperation = 'darker'

// default
ctx.lineJoin = 'round'
ctx.lineCap = 'round'
ctx.strokeStyle = 'rgba(0, 0, 0)'
ctx.fillStyle = 'rgba(0, 0, 0)'
ctx.lineWidth = 5

let toggleDraw = false
let lastPoint

let points = []
let canvasStates = []
let canvasRedoStates = []
canvasStates.push(canvas)

canvas.addEventListener('mousedown', mouseDownHandler)
canvas.addEventListener('mousemove', draw)
canvas.addEventListener('mouseup', mouseUpHandler)
canvas.addEventListener('mouseout', mouseUpHandler)

function mouseDownHandler(e) {
    toggleDraw = true
    lastPoint = {x: e.offsetX, y: e.offsetY}
    points.push(lastPoint)
    drawPoints(ctx, points)
}

function draw(e) {
    if (toggleDraw) {
        ctx.clearRect(0, 0, 700, 500)
        ctx.drawImage(canvasStates[canvasStates.length-1], 0, 0)
        lastPoint = {x: e.offsetX, y: e.offsetY}
        points.push(lastPoint)
        drawPoints(ctx, points)
    }
}

function drawPoints(ctx, points) {
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

function mouseUpHandler(e) {
    if (toggleDraw) {
        toggleDraw = false
        createNewCanvasState()
        points = [];
    }
}

function createNewCanvasState() {
    let canvasState = document.createElement('canvas');
        canvasState.width = 700;
        canvasState.height = 500;
    let cachedCtx = canvasState.getContext('2d');
        cachedCtx.drawImage(canvas, 0, 0)
    canvasStates.push(canvasState)

    if (canvasStates.length > 5) {
        canvasStates.shift()
    }
}

// undo
const undoBtn = document.querySelector('button#undo')
undoBtn.addEventListener('click', undoBtnHandler)

function undoBtnHandler() {
    if (canvasStates.length >= 2) {
        ctx.clearRect(0, 0, 700, 500)
        ctx.drawImage(canvasStates[canvasStates.length-2], 0, 0)
        canvasRedoStates.push(canvasStates.pop())
    }
}

// redo
const redoBtn = document.querySelector('button#redo')
redoBtn.addEventListener('click', redoBtnHandler)

function redoBtnHandler() {
    if (canvasRedoStates.length >= 1) {
        ctx.clearRect(0, 0, 700, 500)
        ctx.drawImage(canvasRedoStates[canvasRedoStates.length-1], 0, 0)
        canvasStates.push(canvasRedoStates.pop())
    }
}

// stroke color changer
const strokeColorInput = document.querySelector('input#stroke-color-input')
strokeColorInput.addEventListener('input', changeStrokeColor);

function changeStrokeColor() {
    ctx.strokeStyle = hexToRGB(strokeColorInput.value, (100-opacityInput.value)/100)
    ctx.fillStyle = hexToRGB(strokeColorInput.value, (100-opacityInput.value)/100)
};

// stroke size changer
const strokeSizeInput = document.querySelector('input#stroke-size-input')
const strokeSizeSlider = document.querySelector('input#stroke-size-slider')

strokeSizeInput.addEventListener('input', changeStrokeSize)
strokeSizeSlider.addEventListener('input', changeStrokeSize)

function changeStrokeSize() {
    isLegitValue(this, 1, 100)
    this.id === 'stroke-size-input' ? strokeSizeSlider.value = this.value : strokeSizeInput.value = this.value
    ctx.lineWidth = parseInt(this.value)
}

// stroke opacity changer
const opacityInput = document.querySelector('input#opacity-input')
const opacitySlider = document.querySelector('input#opacity-slider')

opacityInput.addEventListener('input', changeStrokeOpacity)
opacitySlider.addEventListener('input', changeStrokeOpacity)

function changeStrokeOpacity() {
    isLegitValue(this, 0, 100)
    this.id === 'opacity-input' ? opacitySlider.value = this.value : opacityInput.value = this.value
    changeStrokeColor()
}

// helpers

function isLegitValue(input, min, max) {
    input.value > max ? input.value = max : input.value
    input.value < min ? input.value = min : input.value
}

function hexToRGB(hex, alpha) {
    let r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// background changer
// let backgroundCtx = background.getContext('2d')
// backgroundCtx.fillStyle = 'white'
// backgroundCtx.fillRect(0, 0, canvas.width, canvas.height)

// let backgroundColor = document.querySelector('input#background-change')
//     backgroundColor.value = '#ffffff'
// backgroundColor.addEventListener('input', (e) => {
//     console.log(e.target.value)
    
//     backgroundCtx.fillStyle = e.target.value
//     backgroundCtx.fillRect(0, 0, background.width, background.height)
// })

// saving image
let save = document.querySelector('button#save')
let img = document.querySelector('img')
save.addEventListener('click', (e) => {
    let saveCanvas = document.createElement('canvas')
        saveCanvas.height = 500
        saveCanvas.width = 500
    let svCtx = saveCanvas.getContext('2d')
        svCtx.drawImage(background, 0, 0)
        svCtx.drawImage(canvas, 0, 0)

    // backgroundCtx.drawImage(canvas, 0, 0)
    let dataURL = saveCanvas.toDataURL()
    let imageObj = {
        image: {
            user_id: 2,
            art: dataURL
        }
    }
    fetch('http://localhost:3000/images', {
        method: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify(imageObj)
    })
    .then(resp => resp.json())
    .then(data => console.log(data))
    let a = document.createElement('a')
    asda = dataURL
    a.href = dataURL
    a.download = ''
    a.click()
});


// upload image
let upload = document.querySelector('button#upload')
upload.addEventListener('click', (e) => {
    let div = document.querySelector('div')
    let form = document.createElement('form')
    let uploadimg = document.createElement('input')
        uploadimg.type = 'text'
        uploadimg.id = 'uploadiimg'
    let uploadbtn = document.createElement('button')
        uploadbtn.innerText = 'use as background'
    form.append(uploadimg, uploadbtn)
    div.append(form)

    form.addEventListener('submit', (e) => {
        e.preventDefault()
        let imginput = document.createElement('img')
            imginput.src = e.target.uploadiimg.value
        backgroundCtx.drawImage(imginput, 0, 0)
        // console.log(e.target.uploadiimg.value)
    })
});

// bring image back

fetch(`http://localhost:3000/users/1`)
.then(resp => resp.json())
.then(data => data.forEach(artObj => {
    displayImages(artObj)
}))
let myImg = document.createElement('img')
myImg.addEventListener('click', (e) => {

})

function displayImages(artObj) {
    console.log(artObj.art.url)
    let img = document.createElement('img')
        img.src = `http://localhost:3000/${artObj.art.url}`
        img.width = 100
        img.height = 100
        img.style.border = "1px solid"
    const imageDisplay = document.querySelector('div#image-display')
    imageDisplay.append(img)
}

