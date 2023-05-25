const express = require("express")
const bodyParser = require("body-parser")
const cors = require("cors")
const fs = require("fs")
const Engine = require("node-uci").Engine

wasmPath = require("path").join(__dirname, "node_modules", "stockfish", "src", "stockfish.wasm");
mod = {
    locateFile: function (path){
        if (path.indexOf(".wasm") > -1) {
            /// Set the path to the wasm binary.
            return wasmPath;
        } else {
            /// Set path to worker (self + the worker hash)
            return __filename;
        }
    },
};

// Temporary - will be put in a postgres database soon
const puzzles = fs.readFileSync("../positions/random_evals.csv", "utf-8").split("\n")
const numPuzzles = puzzles.length

const PORT = 4000
const app = express()

app.use(cors())
app.use(bodyParser.json())


const puzzleEndpoint = express.Router()

puzzleEndpoint.route("/").get((req, res) => {
    // Temporary - will be put in a postgres database soon
    let puzzleFen = puzzles[Math.floor(Math.random() * numPuzzles)].split(",")[0]
    res.json({
        fen: puzzleFen
    })
})

app.use('/getpuzzle', puzzleEndpoint)


// Eval stuff
const engine = new Engine('./stockfish/stockfish-windows-2022-x86-64-avx2.exe')


const evaluationEndpoint = express.Router()

evaluationEndpoint.route("/").get((req, res) => {
    let fen = req.body.fen
    engine.chain()
        .init()
        .setoption('MultiPV', 3)
        .position(fen)
        .go({depth: 10})
        .then(result => {
            res.send(JSON.stringify(result))
        })
})

app.use('/evaluate', evaluationEndpoint)


app.get('/', (req, res) => {
    res.send("Hello World!")
})

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})