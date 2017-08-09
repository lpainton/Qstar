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

let gameState = undefined
let playerLinks = new Map()

var moves = 0
var flightTime = 0

var autoAdvance = null;

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
    getPlayerPos(num) {
        let player = `P${num}`
        let index = this.cells.indexOf(player)
        return [
            Math.floor(index/this.cols),
            (index%this.cols)
        ]
    }
}

function calcCanvasSize(gamemap) {
    canvas.width = gamemap.cols * cellSize
    canvas.height = gamemap.rows * cellSize
    console.log(`Setting canvas size to ${canvas.width}px x ${canvas.height}px`)
}

function loadAssets(gamemap, endpoint) {
    gameState = gamemap

    //Save links
    playerLinks.set('P0', endpoint)

    calcCanvasSize(gamemap)
    return loadImage('SN', snitchPath)
        .then(() => loadImage('BL',bludgerPath))
        .then(() => loadImage('P0',seekerPath))
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
    //console.log('Drawing the grid!')
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
    // console.log(`drawing layer ${layer}`)
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
    // console.log(`drawing tokens`)
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
    //console.log('drawing...')
    clearCanvas()
    drawGrid(gamemap)
    drawSpriteLayer(gamemap, 'BL')
    drawSpriteLayer(gamemap, 'SN')
    drawPlayerTokens(gamemap)
}

function drawState() {
    draw(gameState)
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
        drawState()
    })
}

function advanceState() {
    let startTime = Date.now()
    let handler = resp => {
        let body = JSON.parse(resp.srcElement.response)
        recordMetrics(startTime)
        console.log(body)
        resolveAction(0, body)
    }

    let req = makeRequest("P0", handler)
    req.send()
}

function autoAdvanceState() {
    if (!autoAdvance)
        autoAdvance = setInterval(advanceState, 500)
    else
        clearInterval(autoAdvance)
}

function makeRequest(player, rxHandler) {
    let body = {
        me: player,
        state: gameState.cells
    }

    let req = new XMLHttpRequest();
    req.addEventListener("load", rxHandler)
    req.open("POST", playerLinks.get('P0'))
    return req
}

//Map of directions to R,C coords
let vectorMap = new Map()
vectorMap.set('N', [-1,0])
vectorMap.set('E', [0,1])
vectorMap.set('S', [1,0])
vectorMap.set('W', [0,-1])

/**
 * Valid actions 
 * N, S, E, W or some binary composition thereof
 * e.g. NE, EN, WS
 * 
 * @param {Number} playerNum 
 * @param {String} action 
 */
function resolveAction(playerNum, action) {

    let actionString = action['action']
    let dirs = [actionString.charAt(0), actionString.charAt(1)]

    let vectors = getVectors(dirs)

    if (vectorsAreOrthagonal(vectors[0], vectors[1])) {
        let composite = makeCompositeVector(vectors)
        //console.log(`composite vector ${composite}`)
        let playerLoc = gameState.getPlayerPos(playerNum)
        //console.log(`player position at r=${playerLoc[0]} and c=${playerLoc[1]}`)
        let candidateLoc = [playerLoc[0] + composite[0], playerLoc[1] + composite[1]]
        //console.log(`candidate position ${candidateLoc}`)
        let collision = isCollision(candidateLoc)
        if (collision) { 
            console.log(`collision at ${candidateLoc}`)
            return;
        } else {
            let goal = isGoal(candidateLoc)
            if (goal) {
                let winString = `WINNER in ${moves} moves and ${flightTime} elapsed ms`
                console.log(winString)
                alert(winString)
                clearInterval(autoAdvance)
            }
            gameState.setCell(playerLoc[0], playerLoc[1], null)
            gameState.setCell(candidateLoc[0], candidateLoc[1], `P${playerNum}`)
            drawState()
        }
    } else {
        console.log(`Invalid action provided: ${actionString}`)
    }
}

function isGoal(loc) {
    return (gameState.getCell(loc[0], loc[1]) === 'SN')
}

function isCollision(loc) {
    //Out of bounds
    if (loc[0] < 0 
        || loc[0] > gameState.rows - 1
        || loc[1] < 0
        || loc[1] > gameState.cols - 1
    ) {
        return true
    } else {
        //Now check collisions with bludgers
        return (gameState.getCell(loc[0], loc[1]) === 'BL')
    }
}

function makeCompositeVector(vectors) {
    return [
        vectors[0][0] + vectors[1][0],
        vectors[0][1] + vectors[1][1]
    ]
}

function getVectors(dirs) {
    return dirs.map(dir => {
        return vectorMap.get(dir) || [0,0]
    })
}

function vectorsAreOrthagonal(a, b) {
    return ((a[0] * b[0]) + (a[1] * b[1])) === 0
}

function recordMetrics(startTime) {
    moves++
    flightTime += Date.now() - startTime
    console.log(`Moves: ${moves}, Time: ${flightTime}`)
}