console.log("Main script loading...")

const canvas = document.getElementById('game-area')
const cellSize = 50
const gridColor = 'gray'
const sprites = new Map()
const snitchPath = "./img/snitch.png"
const bludgerPath = "./img/bludger.png"
const seekerPath = "./img/seeker.png"

let playerColorMap = new Map()
playerColorMap.set('P0', 'white')
playerColorMap.set('P1', 'red')
playerColorMap.set('P2', 'blue')
playerColorMap.set('P3', 'green')
playerColorMap.set('P4', 'yellow')

/**
 * Valid Cell Values
 * P# = Player #
 * SN = Snitch
 * BL = Obstacle
 */

class GameMap {
    constructor(r, c) {
        this.rows = r
        this.cols = c
        this.cells = []
    }

    setCell(r,c,value) {this.cells[(r*this.cols) + c] = value}
    getCell(r,c) {return this.cells[(r*this.cols) + c]}
    setPlayer(r,c,num) {this.setCell(r,c,`P${num || 0}`)}
    setSnitch(r,c) {this.setCell(r,c,'SN')}
    setBludger(r,c) {this.setCell(r,c,'BL')}
}

function calcCanvasSize(gamemap) {
    canvas.width = gamemap.cols * cellSize
    canvas.height = gamemap.rows * cellSize
    console.log(`Setting canvas size to ${canvas.width}px x ${canvas.height}px`)
}

function loadAssets(gamemap, endpoints) {
    calcCanvasSize(gamemap)
    return loadImage('SN', snitchPath)
        .then(() => loadImage('BL',bludgerPath))
        .then(() => loadImage('P0',seekerPath))
        .then(() => loadImage('P1',seekerPath))
        .then(() => loadImage('P2',seekerPath))
        .then(() => loadImage('P3',seekerPath))
        .then(() => loadImage('P4',seekerPath))
}

function loadImage(name, path) {
    console.log(`loading image ${name} with path ${path}`)
    return new Promise(resolve => {
        let image = new Image()
        image.src = path
        image.onload = () => {
            resolve()
        }
        sprites.set(name, image)
    })
}

function drawCellBorder(r, c, context) {
    let x = c * cellSize
    let y = r * cellSize
    context.rect(x, y,  cellSize, cellSize)
}

function drawGrid(gamemap) {
    let context = canvas.getContext('2d')
    context.beginPath()
    context.strokeStyle = gridColor
    console.log('Drawing the grid!')
    for (let i=0; i<gamemap.cols; i++) {
        for (let j=0; j<gamemap.rows; j++) {
            drawCellBorder(j,i, context)
        }
    }
    context.stroke()
}

function drawSprite(r,c,name,context) {
    let x = c * cellSize
    let y = r * cellSize
    let sprite = sprites.get(name)
    context.drawImage(sprite, 0, 0, sprite.width, sprite.height, x+1, y+1, cellSize-2, cellSize-2)
}

function drawSpriteLayer(gamemap, layer) {
    console.log(`drawing layer ${layer}`)
    let context = canvas.getContext('2d')
    for (let i=0; i<gamemap.cols; i++) {
        for (let j=0; j<gamemap.rows; j++) {
            if (gamemap.getCell(j,i) === layer) {
                drawSprite(j,i,layer,context)
            }
        }
    }
}

function drawBox(r,c,name,context) {
    let x = c * cellSize
    let y = r * cellSize
    context.fillStyle = playerColorMap.get(name)
    context.fillRect(x+1, y+1, cellSize-2, cellSize-2)
}

function drawPlayerTokens(gamemap) {
    console.log(`drawing tokens`)
    let context = canvas.getContext('2d')
    for (let i=0; i<gamemap.cols; i++) {
        for (let j=0; j<gamemap.rows; j++) {
            let cell = gamemap.getCell(j,i)
            if (playerColorMap.has(cell)) {
                drawBox(j,i,cell,context)
                drawSprite(j,i,cell,context)
            }
        }
    }
}

function clearCanvas() {
    let context = canvas.getContext('2d')
    context.clearRect(0,0,canvas.width, canvas.height)
    context.stroke()
}

function draw(gamemap) {
    console.log('drawing...')
    clearCanvas()
    drawGrid(gamemap)
    drawSpriteLayer(gamemap, 'BL')
    drawSpriteLayer(gamemap, 'SN')
    drawPlayerTokens(gamemap)
}


/**
 * MAIN GAME LOGIC
 */
function loadGame(event, gamemap, players) {
    event.stopPropagation()
    event.preventDefault()

    let links = players.map(elt => document.getElementById(`endpoint-${elt}`).value)

    //Swap displayed
    document.getElementById('load-div').style.display='none'
    document.getElementById('game-div').style.display='block'

    loadAssets(gamemap, links).then(() => {
        draw(gamemap)
    })
}