const express = require("express")
const bodyParser = require("body-parser")
const cors = require("cors")
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


app.listen(SERVER_PORT, () => {
    console.log(`Listening on port ${SERVER_PORT}`)
})