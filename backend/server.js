const express = require("express")
const bodyParser = require("body-parser")
const cors = require("cors")
const fs = require("fs")

// Temporary - will be put in a postgres database soon
const puzzles = fs.readFileSync("../positions/random_evals.csv", "utf-8").split("\n")
const numPuzzles = puzzles.length

const PORT = 4000
const app = express()

const puzzleEndpoint = express.Router()

app.use(cors())
app.use(bodyParser.json())

puzzleEndpoint.route("/").get((req, res) => {
    // Temporary - will be put in a postgres database soon
    let puzzleFen = puzzles[Math.floor(Math.random() * numPuzzles)].split(",")[0]
    res.json({
        fen: puzzleFen
    })
})


app.use('/getpuzzle', puzzleEndpoint)

app.get('/', (req, res) => {
    res.send("Hello World!")
})

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})