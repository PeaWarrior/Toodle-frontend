const DOM = {
    canvas: document.querySelector('canvas#drawing-canvas'),
    toolBar: document.querySelector('div#tools'),
    toolOptions: document.querySelector('div#tool-options'),
    brushOptions: document.querySelector('template#brush-options'),
    buttons: {
        brush: document.querySelector('button#brush'),
        undo: document.querySelector('button#undo'),
        redo: document.querySelector('button#redo'),
        clear: document.querySelector('button#clear'),
        normal: document.querySelector('button#normal'),
        erase: document.querySelector('button#erase'),
        multiply: document.querySelector('button#multiply'),
        screen: document.querySelector('button#screen'),
        darken: document.querySelector('button#darken'),
        lighten: document.querySelector('button#lighten'),
        difference: document.querySelector('button#difference')
    }
}

let stroke = {
    rgb: "0, 0, 0",
    size: 5,
    opacity: 100
}

let ctx = DOM.canvas.getContext('2d')

// default
let currentBrush = 'source-over'
let toggleDraw = false
let lastPoint

let canvasStates = {
    undo: [],
    redo: []
}
let points = []

canvasStates.undo.push(DOM.canvas)

DOM.canvas.addEventListener('mousedown', mouseDownHandler);
DOM.canvas.addEventListener('mousemove', draw);
DOM.canvas.addEventListener('mouseup', mouseUpHandler);
DOM.canvas.addEventListener('mouseout', mouseUpHandler);
DOM.buttons.normal.addEventListener('click', btnHandler);
DOM.buttons.erase.addEventListener('click', btnHandler);
DOM.buttons.multiply.addEventListener('click', btnHandler);
DOM.buttons.screen.addEventListener('click', btnHandler);
DOM.buttons.darken.addEventListener('click', btnHandler);
DOM.buttons.lighten.addEventListener('click', btnHandler);
DOM.buttons.difference.addEventListener('click', btnHandler);
DOM.buttons.undo.addEventListener('click', undoBtnHandler);
DOM.buttons.redo.addEventListener('click', redoBtnHandler);
DOM.buttons.clear.addEventListener('click', clearCanvasHandler);
DOM.buttons.brush.addEventListener('click', brushOptionsHandler)

function brushOptionsHandler() {
    clearToolOptions()
    let brushOptions = DOM.brushOptions.content.cloneNode(true)
    let strokeColorInput = brushOptions.querySelector('input#stroke-color-input')
        strokeColorInput.value = stroke.rgb
    let strokeSizeInput = brushOptions.querySelector('input#stroke-size-input')
        strokeSizeInput.value = stroke.size
    let strokeSizeSlider = brushOptions.querySelector('input#stroke-size-slider')
        strokeSizeSlider.value = stroke.size
    let strokeOpacityInput = brushOptions.querySelector('input#stroke-opacity-input')
        strokeOpacityInput.value = stroke.opacity
    let strokeOpacitySlider = brushOptions.querySelector('input#stroke-opacity-slider')
        strokeOpacitySlider.value = stroke.opacity
    strokeColorInput.addEventListener('input', changeStrokeColor)
    strokeSizeInput.addEventListener('input', changeStrokeSize)
    strokeSizeSlider.addEventListener('input', changeStrokeSize)
    strokeOpacityInput.addEventListener('input', changeStrokeOpacity)
    strokeOpacitySlider.addEventListener('input', changeStrokeOpacity)
    DOM.toolOptions.append(brushOptions)
}

function clearToolOptions() {
    var range = document.createRange();
    range.selectNodeContents(DOM.toolOptions);
    range.deleteContents();
}

function mouseDownHandler(e) {
    toggleDraw = true
    lastPoint = {x: e.offsetX, y: e.offsetY}
    points.push(lastPoint)
    drawPoints(ctx, points)
}

function setStroke() {
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.strokeStyle = `rgba(${stroke.rgb}, ${stroke.opacity/100})`
    ctx.fillStyle = `rgba(${stroke.rgb}, ${stroke.opacity/100})`
    ctx.lineWidth = stroke.size
}

function draw(e) {
    if (toggleDraw) {
        ctx.globalCompositeOperation = 'source-over'
        setStroke()
        ctx.clearRect(0, 0, 700, 500)
        canvasStates.redo = []
        ctx.drawImage(canvasStates.undo[canvasStates.undo.length-1], 0, 0)
        lastPoint = {x: e.offsetX, y: e.offsetY}
        points.push(lastPoint)
        ctx.globalCompositeOperation = currentBrush
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
        cachedCtx.drawImage(DOM.canvas, 0, 0)
    canvasStates.undo.push(canvasState)

    if (canvasStates.undo.length > 5) {
        canvasStates.undo.shift()
    }
}

function btnHandler() {
    for (const button in DOM.buttons) {
        DOM.buttons[button].classList.remove('selected')
      }
    this.classList.add('selected')
    currentBrush = this.dataset.brush
}

function undoBtnHandler() {
    if (canvasStates.undo.length >= 2) {
        ctx.globalCompositeOperation = 'copy'
        ctx.clearRect(0, 0, 700, 500)
        ctx.drawImage(canvasStates.undo[canvasStates.undo.length-2], 0, 0)
        canvasStates.redo.push(canvasStates.undo.pop())
    }
}

function redoBtnHandler() {
    if (canvasStates.redo.length >= 1) {
        ctx.clearRect(0, 0, 700, 500)
        ctx.drawImage(canvasStates.redo[canvasStates.redo.length-1], 0, 0)
        canvasStates.undo.push(canvasStates.redo.pop())
    }
}

function clearCanvasHandler() {
    ctx.clearRect(0, 0, 700, 500)
    createNewCanvasState()
}

function changeStrokeColor() {
    stroke.rgb = hexToRGB(this.value)
    setStroke()
};

function changeStrokeSize() {
    isLegitValue(this, 1, 100)
    this.parentNode.querySelector('#stroke-size-slider').value = this.value
    this.parentNode.querySelector('#stroke-size-input').value = this.value
    stroke.size = parseInt(this.value)
    setStroke()
}

function changeStrokeOpacity() {
    isLegitValue(this, 0, 100)
    this.parentNode.querySelector('#stroke-opacity-slider').value = this.value
    this.parentNode.querySelector('#stroke-opacity-input').value = this.value
    stroke.opacity = parseInt(this.value)
    setStroke()
}

// helpers

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
// let save = document.querySelector('button#save')
// let img = document.querySelector('img')
// save.addEventListener('click', (e) => {
//     let saveCanvas = document.createElement('canvas')
//         saveCanvas.height = 500
//         saveCanvas.width = 500
//     let svCtx = saveCanvas.getContext('2d')
//         svCtx.drawImage(background, 0, 0)
//         svCtx.drawImage(canvas, 0, 0)

//     // backgroundCtx.drawImage(canvas, 0, 0)
//     let dataURL = saveCanvas.toDataURL()
//     let imageObj = {
//         image: {
//             user_id: 2,
//             art: dataURL
//         }
//     }
//     fetch('http://localhost:3000/images', {
//         method: 'POST',
//         headers: {
//             'content-type': 'application/json'
//         },
//         body: JSON.stringify(imageObj)
//     })
//     .then(resp => resp.json())
//     .then(data => console.log(data))
//     let a = document.createElement('a')
//     asda = dataURL
//     a.href = dataURL
//     a.download = ''
//     a.click()
// });


// // upload image
// let upload = document.querySelector('button#upload')
// upload.addEventListener('click', (e) => {
//     let div = document.querySelector('div')
//     let form = document.createElement('form')
//     let uploadimg = document.createElement('input')
//         uploadimg.type = 'text'
//         uploadimg.id = 'uploadiimg'
//     let uploadbtn = document.createElement('button')
//         uploadbtn.innerText = 'use as background'
//     form.append(uploadimg, uploadbtn)
//     div.append(form)

//     form.addEventListener('submit', (e) => {
//         e.preventDefault()
//         let imginput = document.createElement('img')
//             imginput.src = e.target.uploadiimg.value
//         backgroundCtx.drawImage(imginput, 0, 0)
//         // console.log(e.target.uploadiimg.value)
//     })
// });

// // bring image back

// fetch(`http://localhost:3000/users/1`)
// .then(resp => resp.json())
// .then(data => data.forEach(artObj => {
//     displayImages(artObj)
// }))
// let myImg = document.createElement('img')
// myImg.addEventListener('click', (e) => {

// })

// function displayImages(artObj) {
//     console.log(artObj.art.url)
//     let img = document.createElement('img')
//         img.src = `http://localhost:3000/${artObj.art.url}`
//         img.width = 100
//         img.height = 100
//         img.style.border = "1px solid"
//     const imageDisplay = document.querySelector('div#image-display')
//     imageDisplay.append(img)
// }

