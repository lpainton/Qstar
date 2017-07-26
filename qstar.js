console.log("Script loading...")

const canvas = document.getElementById('game-area')
const context = canvas.getContext('2d')
const cellSize = 50
const gridColor = 'gray'

/**
 * Cell values
 * 0 = nothing
 * 1,2,4,8 = players 1-4
 * 16 = snitch
 * 32 = obstacle
 */

class GameMap {
    constructor(r, c) {
        this.rows = r
        this.cols = c
        this.cells = new ArrayBuffer(r * c)
        this.view = new DataView(this.cells)
    }

    setCell(r,c,value) {
        this.view.setInt8(r * c, value)
    }

    getCell(r,c) {
        this.view.getInt8(r * c)
    }
}

function calcCanvasSize(gamemap) {
    canvas.width = gamemap.cols * cellSize
    canvas.height = gamemap.rows * cellSize
    console.log(`Setting canvas size to ${canvas.width}px x ${canvas.height}px`)
}

function loadAssets(gamemap, endpoints) {
    sizeCanvas(gamemap)
}

function drawCell(r,c,cell) {
    
}

function drawCellBorder(r, c) {
    let x = c * cellSize
    let y = r * cellSize
    context.rect(x, y,  cellSize, cellSize)
}

function drawGrid(gamemap) {
    for (let i=0; i<gamemap.cols; i++) {
        for (let j=0; j<gamemap.rows; j++) {
            drawCellBorder(j,i)
            let cellVal = gamemap.getCell(j,i)
            if (cellVal) {
                drawCell(j,i,cellVal)
            }
        }
    }
    context.strokeStyle = gridColor
    context.stroke()
}

function clearCanvas() {
    context.clearRect(0,0,canvas.width, canvas.height)
}

function draw(gamemap) {
    clearCanvas()
    drawGrid(gamemap)
}