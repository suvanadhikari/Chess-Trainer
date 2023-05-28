import "./board.css"
import React from "react";
import Chessboard from 'chessboardjsx'
import { Chess } from "chess.js"
import axios from "axios"

class Board extends React.Component {

    PUZZLE = 1
    EVALUATION = 2

    state = {
        "fen": "start",
        "humanTurn": "w",
        "evalStates": {
            "moves": [],
            "playerEval": 0,
            "lines": [],
            "moveIndex": 0
        }
    }

    board = new Chess()


    handleHumanMove(move) {
        if (this.board.turn() !== this.state.humanTurn || this.board.isGameOver()) {
            return
        }
        if (move.to[1] === "1" || move.to[1] === "8") {
            let piece = this.board.get(move.from).type
            if (piece === "p") {
                move.promotion = prompt("What would you like to promote to (q, r, b, n)?")
            }
        }
        try {
            this.board.move(move)
            this.setState({"fen": this.board.fen()})
            if (this.board.isGameOver()) {
                return
            }
            setTimeout(() => {
                this.performComputerMove()
            }, 300)
        }
        catch(err) {
            return
        }
    }

    performComputerMove() {
        let body = {fen: this.board.fen()}
        axios.post("http://localhost:4000/evaluate", body)
            .then(response => {
                let move = response.data.bestmove
                this.board.move(move)
                this.setState({"fen": this.board.fen()})
            })
    }

    updateLineEvals(index) {
        let prevEvalStates = this.state.evalStates
        prevEvalStates.moveIndex = index
        this.setState({
            evalStates: prevEvalStates
        })
        this.setLineEvals()
    }

    setLineEvals() {
        while (this.board.undo()){}

        let moveIndex = this.state.evalStates.moveIndex
        for (let i = 0; i < moveIndex; i++) {
            this.board.move(this.state.evalStates.moves[i])
        }

        let body = {fen: this.board.fen()}

        axios.post("http://localhost:4000/evaluate", body)
            .then(response => {
                let prevEvalStates = this.state.evalStates;
                let maxDepthReached = response.data.info[response.data.info.length - 1].depth
                prevEvalStates.lines = response.data.info.filter(elem => {
                    return elem.depth === maxDepthReached
                })

                for (let i in prevEvalStates.lines) {
                    let line = prevEvalStates.lines[i]
                    let conversionBoard = new Chess(this.board.fen())
                    let evalMoves = line.pv.split(" ")
                    for (let j in evalMoves) {
                        conversionBoard.move(evalMoves[j])
                    }
                    prevEvalStates.lines[i].pv = conversionBoard.history().join(" ")
                }

                this.setState({
                    "evalStates": prevEvalStates,
                    "fen": this.board.fen()
                })
            })
    }

    transitionToEval() {
        let history = this.board.history()
        let body = {fen: this.board.fen()}

        while (this.board.undo()){}

        let prevEvalStates = this.state.evalStates;
        prevEvalStates.moves = history
        
        axios.post("http://localhost:4000/evaluate", body)
            .then(response => {
                let results = response.data.info
                if (response.data.bestmove === '(none)') {
                    if (results[1].score.unit === "cp") {
                        prevEvalStates.playerEval = "0.5-0.5"
                    } else if ((history.length + (this.state.humanTurn === "w" ? 1 : 0)) % 2 === 0) {
                        prevEvalStates.playerEval = "1-0"
                    } else {
                        prevEvalStates.playerEval = "0-1"
                    }
                    this.setState({
                        'evalStates': prevEvalStates,
                        'fen': this.board.fen()
                    })
                    return
                }
                let evaluation = results.findLast(elem => {return elem.multipv === 1}).score
                prevEvalStates.playerEval = this.getEvalDisplay(evaluation)
                this.setState({
                    'evalStates': prevEvalStates,
                    'fen': this.board.fen()
                })
                this.setLineEvals(0)
            })
    }

    getEvalDisplay(evaluation) {
        if (this.state.humanTurn === "b") {
            evaluation.value *= -1
        }
        if (evaluation.unit === "cp") {
            return evaluation.value < 0 ? (evaluation.value / 100).toString() : "+" + evaluation.value / 100;
        } else {
            return ((evaluation.value < 0) ? `-#${-1 * evaluation.value}` : `#${evaluation.value}`)
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.puzzle_number !== this.props.puzzle_number) {
            this.board = new Chess(this.props.board_fen)
            this.setState({
                'fen': this.props.board_fen,
                'humanTurn': this.board.turn()
            })
        }
        if (prevProps.mode !== this.props.mode && this.props.mode === this.EVALUATION) {
            this.transitionToEval()
        }
    }

    render() {
        return (
            <div id="chessboard">
                <div>
                    {
                        this.props.mode === this.PUZZLE 
                        ?
                        <p>{this.state.humanTurn === "w" ? "White" : "Black"} to move.</p>
                        :
                        <p>You played {this.state.humanTurn === "w" ? "White": "Black"}.</p>
                    }
                </div>
                <Chessboard 
                    position={this.state.fen} 
                    onDrop={(move) => {
                        this.handleHumanMove({
                            from: move.sourceSquare,
                            to: move.targetSquare,
                        })
                    }}
                    orientation={this.state.humanTurn === "w" ? "white" : "black"}
                    width="560"
                ></Chessboard>
                {this.props.mode === this.EVALUATION &&
                <div className = "evaluation">
                    <p>
                        Moves played: 
                        {
                            this.state.evalStates.moves.length > 0
                            ?
                            this.state.evalStates.moves.map((elem, idx) => {
                                if (idx % 2 === 0) {
                                    return <span key={idx} onClick={() => {this.updateLineEvals(idx)}}>{` ${elem}`}</span>
                                } else {
                                    return <span key={idx}>{` (${elem})`}</span>
                                }
                            })
                            :
                            <span> None</span>
                        }
                        <br></br>
                        Evaluation after your moves: {this.state.evalStates.playerEval}
                    </p>
                    <div className = "lines">
                        {
                            this.state.evalStates.moves.length > 0 
                            ?
                            <span>Best lines (replacing {this.state.evalStates.moves[this.state.evalStates.moveIndex]}):</span>
                            :
                            <span>Best lines:</span>
                        }
                        
                        
                        {this.state.evalStates.lines.map((elem, idx) => {
                            return <p key={idx}>({this.getEvalDisplay(elem.score)})  {elem.pv}</p>
                        })}
                    </div>
                </div>
                }
            </div>
        );
    }
}

export { Board }