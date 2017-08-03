const app = require('express')()
const bodyParser = require('body-parser')

app.use(bodyParser.json())

app.get('/health', (req, res) => res.send({status: 'ok'}))

app.post('/', (req, res) => {
    console.log('POST received')
    let state = req.body.state
    let me = req.body.you
    let action = getAction(me, state)
    res.json({
        action: action
    })
})

console.log('Running server...')
app.listen(3000)

function getAction(player, gamestate) {
    //User state matrix and player location to determine action
}