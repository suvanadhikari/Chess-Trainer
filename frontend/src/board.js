import "./board.css"
import React from "react";
import { Chessboard } from 'react-chessboard'
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
            "evals": [],
            "evalsAfter": [],
            "playerEval": 0,
            "lines": [],
            "moveIndex": 0,
            "evalReady": false
        }
    }

    board = new Chess()

    handleEvalMove(move) {
        if (this.board.isGameOver() || !this.state.evalStates.evalReady) {
            return
        }
        try {
            this.board.move(move)
            this.setState({"fen": this.board.fen()})
        }
        catch(err) {
            return
        }
    }


    handleHumanMove(move) {
        if (this.board.turn() !== this.state.humanTurn || this.board.isGameOver()) {
            return
        }
        try {
            this.board.move(move)
            this.props.allow_eval_button(true);
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
        let body = {fen: this.board.fen(), depth: this.props.settings.moveDepth}
        if (this.props.settings.limitStrength) {
            body['strength'] = this.props.settings.engineElo
        }
        axios.post(`${process.env.REACT_APP_SERVER_LOCATION}/evaluate`, body)
            .then(response => {
                let move = response.data.bestmove
                this.board.move(move)
                this.setState({"fen": this.board.fen()})
            })
    }


    setEvals(moveIndex) {
        if (moveIndex > this.state.evalStates.moves.length) {
            let prevEvalStates = this.state.evalStates
            prevEvalStates.evalReady = true
            this.setState({
                evalStates: prevEvalStates
            })
            while (this.board.undo()) {}
            return
        }
        if (moveIndex > 0) {
            let move = this.state.evalStates.moves[moveIndex - 1]
            this.board.move(move)
        }
        
        let body = {fen: this.board.fen(), depth: this.props.settings.reviewDepth}
        axios.post(`${process.env.REACT_APP_SERVER_LOCATION}/evaluate`, body)
            .then(response => {
                let maxDepthReached = response.data.info[response.data.info.length - 1].depth
                let lines = response.data.info.filter(elem => {
                    return elem.depth === maxDepthReached && typeof(elem.pv) === "string"
                })
                
                for (let i in lines) {
                    let line = lines[i]
                    let conversionBoard = new Chess(this.board.fen())
                    let evalMoves = line.pv.split(" ")
                    for (let j in evalMoves) {
                        conversionBoard.move(evalMoves[j])
                    }
                    lines[i].pv = conversionBoard.history().join(" ")
                    lines[i].evaluation = this.getEvalDisplay(lines[i].score, moveIndex)
                }
                let prevEvalStates = this.state.evalStates;
                prevEvalStates.lines.push(lines)
                prevEvalStates.evals.push(lines[0].evaluation)
                if (moveIndex > 0) {
                    prevEvalStates.evalsAfter.push(lines[0].evaluation)
                }
                this.setState({evalStates: prevEvalStates}, () => {
                    this.setEvals(moveIndex + 1)
                })
            })
    }

    changeEvalLine(idx) {
        if (!this.state.evalStates.evalReady) {
            return
        }
        if (idx < -1 || idx >= this.state.evalStates.moves.length) {
            return
        }
        let prevEvalStates = this.state.evalStates
        prevEvalStates.moveIndex = idx + 1;

        while (this.board.undo()){}

        for (let i = 0; i <= idx; i++) {
            this.board.move(this.state.evalStates.moves[i])
        }

        this.setState({
            evalStates: prevEvalStates,
            fen: this.board.fen()
        })
    }

    transitionToEval() {
        let history = this.board.history()

        while (this.board.undo()){}

        let prevEvalStates = this.state.evalStates;
        prevEvalStates.moves = history
        prevEvalStates.lines = []
        prevEvalStates.evals = []
        prevEvalStates.evalsAfter = []
        prevEvalStates.evalReady = false;

        this.setState({
            'evalStates': prevEvalStates,
            'fen': this.board.fen()
        }, () => {this.setEvals(0)})

    }

    getEvalDisplay(evaluation, moveIndex) {

        if (moveIndex === undefined && this.state.humanTurn === "b") {
            evaluation.value *= -1
        } else if (moveIndex !== undefined && ((this.state.humanTurn === "w" ? 0 : 1) + moveIndex) % 2 === 1) {
            evaluation.value *= -1
        }

        if (evaluation.unit === "cp") {
            return evaluation.value <= 0 ? (evaluation.value / 100).toFixed(2).toString() : "+" + (evaluation.value / 100).toFixed(2);
        } else {
            return ((evaluation.value < 0) ? `-#${-1 * evaluation.value}` : `#${evaluation.value}`)
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.mode !== this.props.mode) {
            if (this.props.mode === this.EVALUATION) {
                this.transitionToEval()
            } else if (this.props.mode === this.PUZZLE) {
                this.props.allow_eval_button(false)
                let prevEvalStates = this.state.evalStates
                prevEvalStates.evalReady = false
                prevEvalStates.moveIndex = 0
                this.setState({
                    evalStates: prevEvalStates
                })
            }
        }
        if (prevProps.puzzle_number !== this.props.puzzle_number) {
            this.board = new Chess(this.props.board_fen)
            this.setState({
                'fen': this.props.board_fen,
                'humanTurn': this.board.turn(),
            })
        }
    }

    handleKeyPress(event) {
        if (this.props.mode === this.EVALUATION && this.state.evalStates.evalReady) {
            if (event.key === "ArrowLeft") {
                this.changeEvalLine(this.state.evalStates.moveIndex - 2)
            } else if (event.key === "ArrowRight") {
                this.changeEvalLine(this.state.evalStates.moveIndex)
            }
        }
    }

    render() {
        return (
            <div id="chessboard" onKeyDown={this.handleKeyPress.bind(this)} tabIndex={-1}>
                <div className="boardBox">
                    <Chessboard
                        customDarkSquareStyle={{backgroundColor: 'rgb(112,102,119)'}}
                        customLightSquareStyle={{backgroundColor: 'rgb(204,183,174)'}}
                        position={this.state.fen} 
                        onPieceDrop={(sourceSquare, targetSquare, piece) => {
                            if (this.props.mode === this.PUZZLE) {
                                this.handleHumanMove({
                                    from: sourceSquare,
                                    to: targetSquare,
                                    promotion: piece[1].toLowerCase() ?? "q"
                                })
                            } else if (this.props.mode === this.EVALUATION) {
                                this.handleEvalMove({
                                    from: sourceSquare,
                                    to: targetSquare,
                                    promotion: piece[1].toLowerCase() ?? "q"
                                })
                            }
                        }}
                        boardOrientation={this.state.humanTurn === "w" ? "white" : "black"}
                        boardWidth="560"
                    ></Chessboard>
                    <div className="turnBox">
                        {
                            this.props.mode === this.PUZZLE 
                            ?
                            <p>{this.state.humanTurn === "w" ? "White" : "Black"} to move.</p>
                            :
                            <p>You played {this.state.humanTurn === "w" ? "White": "Black"}.</p>
                        }
                    </div>
                </div>
                {this.props.mode === this.EVALUATION &&
                <div className = "evaluationBox">
                    <p>
                        Moves played: 
                        {
                            this.state.evalStates.moves.length > 0
                            ?
                            <span>
                                <span key="-1" className={this.state.evalStates.moveIndex === 0 ? "selectedMove" : ""} onClick={() => {
                                    this.changeEvalLine(-1)
                                }}> ...</span>
                                {this.state.evalStates.moves.map((elem, idx) => {
                                    if (idx % 2 === 0) {
                                        return <span key={idx} className={this.state.evalStates.moveIndex === idx + 1 ? "selectedMove" : ""} onClick={() => {
                                            this.changeEvalLine(idx)
                                        }}>{` ${elem}`}</span>
                                    } else {
                                        return <span key={idx} className={this.state.evalStates.moveIndex === idx + 1 ? "selectedMove" : ""} onClick={() => {
                                            this.changeEvalLine(idx)
                                        }}>{` (${elem})`}</span>
                                    }
                                })}
                            </span>
                            :
                            <span> None</span>
                        }
                        <br></br><br></br>
                        Evaluation after all of your moves: {this.state.evalStates.evalReady ? this.state.evalStates.evals[this.state.evalStates.evals.length - 1] : "Calculating..."}
                    </p>
                    <div className = "lines">
                        {
                            this.state.evalStates.moves.length > 0 
                            ?
                            <span>
                                <span>
                                    Evaluation in this position: 
                                    {
                                        this.state.evalStates.evalReady
                                        ?
                                        " " + this.state.evalStates.evals[this.state.evalStates.moveIndex]
                                        :
                                        " Calculating..."
                                    }
                                </span>
                                <br></br>
                                {
                                    this.state.evalStates.moveIndex < this.state.evalStates.moves.length
                                    &&
                                    <span>
                                        Evaluation after {this.state.evalStates.moves[this.state.evalStates.moveIndex]}:
                                        {
                                            this.state.evalStates.evalReady
                                            ?
                                            " " + this.state.evalStates.evalsAfter[this.state.evalStates.moveIndex]
                                            :
                                            " Calculating..."
                                        }
                                    </span>
                                }
                                <br></br><br></br>
                                {this.state.evalStates.moveIndex < this.state.evalStates.moves.length ?
                                    <span>
                                        Best lines (replacing {this.state.evalStates.moves[this.state.evalStates.moveIndex]}):
                                    </span>
                                    :
                                    <span>
                                        Best continuations:
                                    </span>
                                }
                            </span>
                            :
                            <span>Best lines:</span>
                        }
                        
                        {
                            (this.state.evalStates.evalReady)
                            &&
                            this.state.evalStates.lines[this.state.evalStates.moveIndex].map((elem, idx) => {
                                return <p key={idx}>({elem.evaluation})  {elem.pv}</p>
                            })
                        }
                    </div>
                </div>
                }
            </div>
        );
    }
}

export { Board }