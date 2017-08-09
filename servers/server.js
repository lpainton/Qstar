const app = require('express')()
const bodyParser = require('body-parser')

app.use(bodyParser.json())

app.get('/health', (req, res) => res.send({status: 'ok'}))

app.post('/', processRequest)

function processRequest(req, res) {
    console.log('POST received')
    let state = req.body.state
    let me = req.body.you
    let action = getAction(me, state)
    res.json({
        action: action
    })
}

console.log('Running server...')
app.listen(3000)

function getAction(player, gamestate) {
    //Use state matrix and player location to determine action
    let resArr = [
        'N',
        'E',
        'S',
        'W',
        'NE',
        'NW',
        'SE',
        'SW',
    ]
    .map(seedRandom)

    resArr.sort((a,b) => a[0] - b[0])
    return resArr[0][1]
}

function seedRandom(seed) {
    return [Math.random(), seed]
}