const DOM = {
    canvas: document.querySelector('canvas#drawing-canvas'),
    toolBar: document.querySelector('div#tools'),
    toolOptions: document.querySelector('div#tool-options'),
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
    },
    strokeOptions: {
        strokeColorInput: document.querySelector('input#stroke-color-input'),
        strokeSizeInput: document.querySelector('input#stroke-size-input'),
        strokeSizeSlider: document.querySelector('input#stroke-size-slider'),
        opacityInput: document.querySelector('input#opacity-input'),
        opacitySlider: document.querySelector('input#opacity-slider')
    }
}

DOM.buttons.brush.addEventListener('click', (e)=> {
    for (const strokeOptionName in DOM.strokeOptions) {
        let strokeOption = DOM.strokeOptions[strokeOptionName].cloneNode()
        DOM.toolOptions.append(strokeOption)
    }
})

let ctx = DOM.canvas.getContext('2d')

// default
ctx.lineJoin = 'round'
ctx.lineCap = 'round'
ctx.strokeStyle = 'rgba(0, 0, 0)'
ctx.fillStyle = 'rgba(0, 0, 0)'
ctx.lineWidth = 5
let currentBrush = 'source-over'
let toggleDraw = false
let lastPoint

let points = []
let canvasStates = []
let canvasRedoStates = []
canvasStates.push(DOM.canvas)

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
DOM.strokeOptions.strokeColorInput.addEventListener('input', changeStrokeColor);
DOM.strokeOptions.strokeSizeInput.addEventListener('input', changeStrokeSize);
DOM.strokeOptions.strokeSizeSlider.addEventListener('input', changeStrokeSize);
DOM.strokeOptions.opacitySlider.addEventListener('input', changeStrokeOpacity);
DOM.strokeOptions.opacityInput.addEventListener('input', changeStrokeOpacity);

function mouseDownHandler(e) {
    toggleDraw = true
    lastPoint = {x: e.offsetX, y: e.offsetY}
    points.push(lastPoint)
    drawPoints(ctx, points)
}

function draw(e) {
    if (toggleDraw) {
        ctx.globalCompositeOperation = 'source-over'
        ctx.clearRect(0, 0, 700, 500)
        ctx.drawImage(canvasStates[canvasStates.length-1], 0, 0)
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
    canvasStates.push(canvasState)

    if (canvasStates.length > 5) {
        canvasStates.shift()
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
    if (canvasStates.length >= 2) {
        ctx.globalCompositeOperation = 'copy'
        ctx.clearRect(0, 0, 700, 500)
        ctx.drawImage(canvasStates[canvasStates.length-2], 0, 0)
        canvasRedoStates.push(canvasStates.pop())
    }
}

function redoBtnHandler() {
    if (canvasRedoStates.length >= 1) {
        ctx.clearRect(0, 0, 700, 500)
        ctx.drawImage(canvasRedoStates[canvasRedoStates.length-1], 0, 0)
        canvasStates.push(canvasRedoStates.pop())
    }
}

function clearCanvasHandler() {
    ctx.clearRect(0, 0, 700, 500)
    createNewCanvasState()
}

function changeStrokeColor() {
    ctx.strokeStyle = hexToRGB(DOM.strokeOptions.strokeColorInput.value, (DOM.strokeOptions.opacityInput.value)/100)
    ctx.fillStyle = hexToRGB(DOM.strokeOptions.strokeColorInput.value, (DOM.strokeOptions.opacityInput.value)/100)
};

function changeStrokeSize() {
    isLegitValue(this, 1, 100)
    this.id === 'stroke-size-input' ? strokeSizeSlider.value = this.value : strokeSizeInput.value = this.value
    ctx.lineWidth = parseInt(this.value)
}

function changeStrokeOpacity() {
    isLegitValue(this, 0, 100)
    this.id === 'opacity-input' ? DOM.strokeOptions.opacitySlider.value = this.value : DOM.strokeOptions.opacityInput.value = this.value
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

