import "./board.css"
import React from "react";
import Chessboard from 'chessboardjsx'
import { Chess } from "chess.js"


class Board extends React.Component {

    state = {
        "fen": "start",
        "humanTurn": "w"
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
                this.board.move(this.getComputerMove())
                this.setState({"fen": this.board.fen()})
            }, 300)
        }
        catch(err) {
            return
        }
    }

    getComputerMove() {
        let moves = this.board.moves()
        return moves[Math.floor(Math.random() * moves.length)]
    }

    componentDidUpdate(prevProps) {
        if (prevProps.puzzle_number !== this.props.puzzle_number) {
            this.board = new Chess(this.props.board_fen)
            console.log(this.board.turn())
            this.setState({
                'fen': this.props.board_fen,
                'humanTurn': this.board.turn()
            })
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
            </div>
        );
    }
}

export { Board }