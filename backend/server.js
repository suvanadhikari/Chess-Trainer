const express = require("express")
const bodyParser = require("body-parser")
const cors = require("cors")
const fs = require("fs")
const Engine = require("node-uci").Engine
const Pool = require('pg').Pool
require("dotenv").config()


const pool = new Pool({
    user: process.env.DATABASE_USER,
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_NAME,
    password: process.env.DATABASE_PASSWORD,
    port: process.env.DATABASE_PORT
})


const SERVER_PORT = 4000
const app = express()

app.use(cors())
app.use(bodyParser.json())


const puzzleEndpoint = express.Router()

puzzleEndpoint.route("/").get((req, res) => {

    pool.query('SELECT fen FROM public."GeneralPositions" TABLESAMPLE SYSTEM_ROWS(1);', (error, results) => {
        if (error) {
            throw error
        }
        res.json({
            fen: results.rows[0].fen
        })
    })
})

app.use('/getpuzzle', puzzleEndpoint)


// Eval stuff
const engine = new Engine('./stockfish/stockfish-windows-2022-x86-64-avx2.exe')

let engine_ready = false

engine.init().then(() => {
    engine_ready = true;
})


const evaluationEndpoint = express.Router()

evaluationEndpoint.route("/").post((req, res) => {
    let fen = req.body.fen
    engine.chain()
        .setoption('MultiPV', 4)
        .position(fen)
        .go({depth: 10})
        .then(result => {
            res.send(JSON.stringify(result))
        })
})

app.use('/evaluate', evaluationEndpoint)


app.get('/', (req, res) => {
    res.send("This is the root endpoint.")
})

app.listen(SERVER_PORT, () => {
    console.log(`Listening on port ${SERVER_PORT}`)
})