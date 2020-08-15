let background = document.querySelector('canvas#layer1')
let canvas = document.querySelector('canvas#layer2')
// canvas.style.border = '1px solid'
// canvas.style['box-sizing'] = 'border-box'
let drawX, drawY
let ctx = canvas.getContext('2d')
ctx.lineJoin = 'round'
ctx.lineCap = 'round'


// change color
// ctx.strokeStyle = '#B4D455'
// ctx.fillStyle = '#8'
ctx.lineWidth = 1
let toggleDraw = false

canvas.addEventListener('mousedown', (e) => {
    drawX = e.offsetX
    drawY = e.offsetY
    // [drawX, drawY] = [e.offsetX, e.offsetY]
    
    toggleDraw = true
});

let draw = (e) => {
    if (toggleDraw) {
        ctx.beginPath()
        ctx.moveTo(drawX, drawY)
        ctx.lineTo(e.offsetX, e.offsetY)
        ctx.stroke()
        // ctx.fill()
        drawX = e.offsetX
        drawY = e.offsetY
    }
}


canvas.addEventListener('mousemove', draw)
canvas.addEventListener('mouseup', (e) => toggleDraw = false)
canvas.addEventListener('mouseout', (e) => toggleDraw = false)

// colorchanger

const colorChanger = document.querySelector('input#color-change')
colorChanger.addEventListener('input', (e) => {
    ctx.strokeStyle = e.target.value
    
})
// linewidth changer
let brushSize = document.querySelector('select#brush')

brushSize.addEventListener('change', (e) => {
    ctx.lineWidth = parseInt(e.target.value)
})

// background changer
let backgroundCtx = background.getContext('2d')
backgroundCtx.fillStyle = 'white'
backgroundCtx.fillRect(0, 0, canvas.width, canvas.height)

let backgroundColor = document.querySelector('input#background-change')
    backgroundColor.value = '#ffffff'
backgroundColor.addEventListener('input', (e) => {
    console.log(e.target.value)
    
    backgroundCtx.fillStyle = e.target.value
    backgroundCtx.fillRect(0, 0, background.width, background.height)
})

let asda
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
