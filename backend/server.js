const express = require("express")
const bodyParser = require("body-parser")
const cors = require("cors")
const Engine = require("node-uci").Engine
const Pool = require('pg').Pool
require("dotenv").config()


const SERVER_PORT = process.env.PORT
const app = express()

app.use(cors())
app.use(bodyParser.json())

let isProduction = process.env.NODE_ENV === "production"

const pool = isProduction
    ? 
    new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    })
    :
    new Pool({
        user: process.env.PG_USER,
        host: process.env.PG_HOST,
        database: process.env.PG_DATABASE,
        password: process.env.PG_PASSWORD,
        port: process.env.PG_PORT
    })


const puzzleEndpoint = express.Router()



puzzleEndpoint.route("/").get((req, res) => {
    pool.query('SELECT fen FROM public."GeneralPositions" TABLESAMPLE SYSTEM(1) LIMIT 1 OFFSET floor(random() * (SELECT count(*) FROM public."GeneralPositions"));', (error, results) => {
        if (error) {
            throw error
        }
        res.json({
            fen: results.rows[0].fen
        })
    })
})

app.use('/getpuzzle', puzzleEndpoint)


const evaluationEndpoint = express.Router()

evaluationEndpoint.route("/").post((req, res) => {
    let fen = req.body.fen
    let depth = req.body.depth ? req.body.depth : 15
    let strength = req.body.strength
    const engine = new Engine(process.env.STOCKFISH_LOCATION)
    if (strength === undefined) {
        engine.chain()
            .init()
            .setoption('MultiPV', 4)
            .position(fen)
            .go({
                depth: depth
            })
            .then(result => {
                res.send(JSON.stringify(result))
            })
    } else {
        engine.chain()
            .init()
            .setoption('UCI_LimitStrength', true)
            .setoption('UCI_Elo', strength)
            .position(fen)
            .go({
                depth: depth
            })
            .then(result => {
                res.send(JSON.stringify(result))
            })

    }
})

app.use('/evaluate', evaluationEndpoint)


app.get('/', (req, res) => {
    res.send("This is the root endpoint.")
})

app.listen(SERVER_PORT, () => {
    console.log(`Listening on port ${SERVER_PORT}`)
})