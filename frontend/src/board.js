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
            "playerEval": 0
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
                    // result.info[1].score is {unit: "cp", value: 0} for draw
                    // result.info[1].score is {unit: "mate", value: 0} for mate
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
                if (this.state.humanTurn === "b") {
                    evaluation.value *= -1
                }
                if (evaluation.unit === "cp") {
                    prevEvalStates.playerEval = evaluation.value / 100;
                } else {
                    prevEvalStates.playerEval = ((evaluation.value < 0) ? `-#${-1 * evaluation.value}` : `#${evaluation.value}`)
                }
                this.setState({
                    'evalStates': prevEvalStates,
                    'fen': this.board.fen()
                })
            })
    }

    getPlayerMovesString() {
        let str = "Moves played: "
        this.state.evalStates.moves.forEach((elem, idx) => {
            if (idx % 2 === 1) {
                str += "("
            }
            str += elem
            if (idx % 2 === 1) {
                str += ")"
            }
            str += " "
        })
        return str
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
                        {this.getPlayerMovesString()}
                        <br></br>
                        Evaluation after your moves: {this.state.evalStates.playerEval}
                    </p>
                </div>
                }
            </div>
        );
    }
}

export { Board }