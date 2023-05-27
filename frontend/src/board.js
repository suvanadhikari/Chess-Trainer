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
        while (this.board.undo()){}
        
        let prevEvalStates = this.state.evalStates;
        prevEvalStates.moves = history
        prevEvalStates.playerEval = 5;

        let body = {fen: this.board.fen()}
        
        axios.post("http://localhost:4000/evaluate", body)
            .then(response => {
                let results = response.data.info
                let evaluation = results.findLast(elem => {return elem.multipv === 1}).score.value
                prevEvalStates.playerEval = evaluation / 100;
                this.setState({
                    'evalStates': prevEvalStates,
                    'fen': this.board.fen()
                })
            })
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
                <Chessboard 
                    position={this.state.fen} 
                    onDrop={(move) => {
                        this.handleHumanMove({
                            from: move.sourceSquare,
                            to: move.targetSquare,
                        })
                    }}
                    orientation={this.state.humanTurn === "w" ? "white" : "black"}
                ></Chessboard>
                {this.props.mode === this.EVALUATION &&
                <div className = "evaluation">
                    <p>Your moves:</p> {this.state.evalStates.moves.map((elem, idx) => {return <p key={idx}>{elem} </p>})}
                    <br></br>
                    <p>Your evaluation: {this.state.evalStates.playerEval}</p>
                </div>
                }
            </div>
        );
    }
}

export { Board }