import { Chess } from "chess.js"

class StockfishInterface {
    constructor() {
        this.board = new Chess()
        this.states = {
            UNINITIALIZED: 0,
            READY: 1,
            RUNNING: 2
        }
        this.currentState = this.states.UNINITIALIZED
        this.engine = new Worker("stockfish-nnue-16-single.js")
        this.engine.onmessage = this.messageCallback.bind(this);
        this.engine.onerror = this.errorCallback.bind(this);
        this.engine.postMessage("uci")
        this.engine.postMessage("ucinewgame")
        this.engine.postMessage("isready")
        
    }

    formatVariation(resultString) {
        let depth = parseInt(resultString.match(/ depth \d{2}/g)[0].split(" ")[2]);
        let pv = resultString.split(" pv ")[1]
        let multipv = parseInt(resultString.split(" multipv ")[1].split(" ")[0])
        let scoreSplit = resultString.split(" score ")[1].split(" ")
        let scoreUnit = scoreSplit[0]
        let scoreValue = parseInt(scoreSplit[1])
        return {
            depth: depth,
            score: {
                unit: scoreUnit,
                value: scoreValue
            },
            pv: pv,
            multipv: multipv
        }
    }

    findBestMove(position, options, callback) {
        if (this.currentState !== this.states.READY) {
            return false;
        }

        // Options: depth, limitStrength, rating
        let depth = options.depth
        let limitStrength = options.limitStrength ? true : false
        let rating = options.rating

        let readyListener = (message) => {
            if (message.data === "readyok") {
                this.currentState = this.states.RUNNING;
                this.engine.postMessage(`position fen ${position}`)
                this.engine.postMessage(`go depth ${depth}`)
            }
        }

        let resultListener = (message) => {
            if (message.data.startsWith("bestmove")) {
                this.engine.removeEventListener("message", readyListener)
                this.engine.removeEventListener("message", resultListener)
                this.currentState = this.states.READY;
                callback(message.data.split(" ")[1])
            }
        }

        this.engine.addEventListener('message', readyListener)
        this.engine.addEventListener('message', resultListener)

        if (limitStrength) {
            this.engine.postMessage(`setoption name UCI_LimitStrength value true`)
            this.engine.postMessage(`setoption name UCI_Elo value ${rating}`)
        }
        this.engine.postMessage("isready")

    }

    reviewPositions(positions, options, callback) {
        if (this.currentState !== this.states.READY) {
            return false;
        }
        // Options: depth, multipv
        let depth = options.depth
        let multipv = options.multipv
        let readyListener = (message) => {
            if (message.data === "readyok") {
                this.currentState = this.states.RUNNING;
                for (let index in positions) {
                    let position = positions[index]
                    this.engine.postMessage(`position fen ${position}`)
                    this.engine.postMessage(`go depth ${depth}`)
                }
            }
        }
        let results = []
        for (let i = 0; i < positions.length; i++) {
            results.push([])
        }
        let positionsCalculated = 0;
        let resultListener = (message) => {
            if (message.data.startsWith(`info depth `) && message.data.includes("pv")) {
                results[positionsCalculated].push(message.data)
            } else if (message.data.startsWith("bestmove")) {
                positionsCalculated++;
                if (positionsCalculated === positions.length) {
                    this.engine.removeEventListener("message", readyListener);
                    this.engine.removeEventListener("message", resultListener);
                    for (let i = 0; i < results.length; i++) {
                        this.board.load(positions[i])
                        let numMoves = Math.min(multipv, this.board.moves().length)
                        results[i] = results[i].slice(-1 * numMoves)
                        for (let j = 0; j < results[i].length; j++) {
                            results[i][j] = this.formatVariation(results[i][j])
                        }
                    }
                    this.currentState = this.states.READY;
                    callback(results);
                }
            }
        }

        this.engine.addEventListener('message', readyListener)
        this.engine.addEventListener('message', resultListener)
        this.engine.postMessage(`setoption name MultiPV value ${multipv}`)

        this.engine.postMessage("isready")
    }

    stopCalculation() {
        if (this.currentState === this.states.RUNNING) {
            this.engine.postMessage("stop")
        }
    }

    go (position, options, callback) {
        // TODO: Implement infinite search for analysis board
        this.engine.postMessage("isready")
    }

    /**
     * 
     * @param {MessageEvent<any>} message 
     */
    messageCallback(message) {

        if (message.data === "readyok") {
            this.currentState = this.states.READY;
        }
    }

    /**
     * 
     * @param {ErrorEvent} error 
     */
    errorCallback(error) {
        console.error(error)
    }

}

export default StockfishInterface