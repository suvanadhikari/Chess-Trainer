import "./board.css"
import React from "react";
import { Chessboard } from 'react-chessboard'
import { Chess } from "chess.js"
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import StockfishInterface from "./stockfishInterface";


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
            "evalReady": false,
            "evalProgress": 0
        }
    }

    board = new Chess()
    engineInterface = new StockfishInterface()


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

        let options = {depth: this.props.settings.moveDepth}

        if (this.props.settings.limitStrength) {
            options.limitStrength = true;
            options.rating = this.props.settings.engineElo;
        }

        this.engineInterface.findBestMove(this.board.fen(), options, (move) => {
            this.board.move(move);
            this.setState({"fen": this.board.fen()})
        })
    }

    setEvals() {

        let getGameEnding = (position) => {
            let resultBoard = new Chess(position)
            if (resultBoard.isCheckmate() && resultBoard.turn() === "w") {
                return "0-1"
            } else if (resultBoard.isCheckmate() && resultBoard.turn() === "b") {
                return "1-0"
            }
            return "0.5-0.5"
        }

        let options = {
            depth: this.props.settings.reviewDepth,
            multipv: this.props.settings.reviewNumLines
        }
        let positionsToReview = []
        while (this.board.undo()) {}
        positionsToReview.push(this.board.fen())
        for (let i in this.state.evalStates.moves) {
            this.board.move(this.state.evalStates.moves[i])
            positionsToReview.push(this.board.fen())
        }
        this.engineInterface.reviewPositions(positionsToReview, options, (results) => {
            let prevEvalStates = this.state.evalStates;
            for (let moveIndex in results) {
                let positionResult = results[moveIndex]
                for (let lineIndex in positionResult) {
                    let line = positionResult[lineIndex]
                    let moves = line.pv.split(" ")
                    let conversionBoard = new Chess(positionsToReview[moveIndex])
                    for (let j in moves) {
                        conversionBoard.move(moves[j])
                    }
                    line.pv = conversionBoard.history().join(" ")
                    line.evaluation = this.getEvalDisplay(positionResult[lineIndex].score, moveIndex)
                }
                prevEvalStates.lines.push(positionResult)
                prevEvalStates.evals.push(positionResult.length ? positionResult[0].evaluation : getGameEnding(positionsToReview[moveIndex]))
                if (moveIndex > 0) {
                    prevEvalStates.evalsAfter.push(positionResult.length ? positionResult[0].evaluation : getGameEnding(positionsToReview[moveIndex]))
                }
            }
            prevEvalStates.evalReady = true;
            while (this.board.undo()) {}
            this.setState({evalStates: prevEvalStates})
        }, (progress)=>{
            let prevEvalStates = this.state.evalStates;
            prevEvalStates.evalProgress = progress * 100;
            this.setState({
                evalStates: prevEvalStates
            }, ()=>{console.log(this.state)})
        })


        // if (moveIndex > this.state.evalStates.moves.length) {
        //     let prevEvalStates = this.state.evalStates
        //     prevEvalStates.evalReady = true
        //     this.setState({
        //         evalStates: prevEvalStates
        //     })
        //     while (this.board.undo()) {}
        //     return
        // }
        // if (moveIndex > 0) {
        //     let move = this.state.evalStates.moves[moveIndex - 1]
        //     this.board.move(move)
        // }
        
        // let body = {fen: this.board.fen(), depth: this.props.settings.reviewDepth}
        // axios.post(`${process.env.REACT_APP_SERVER_LOCATION}/evaluate`, body)
        //     .then(response => {
        //         let maxDepthReached = response.data.info[response.data.info.length - 1].depth
        //         let lines = response.data.info.filter(elem => {
        //             return elem.depth === maxDepthReached && typeof(elem.pv) === "string"
        //         })
                
        //         for (let i in lines) {
        //             let line = lines[i]
        //             let conversionBoard = new Chess(this.board.fen())
        //             let evalMoves = line.pv.split(" ")
        //             for (let j in evalMoves) {
        //                 conversionBoard.move(evalMoves[j])
        //             }
        //             lines[i].pv = conversionBoard.history().join(" ")
        //             lines[i].evaluation = this.getEvalDisplay(lines[i].score, moveIndex)
        //         }
        //         let prevEvalStates = this.state.evalStates;
        //         prevEvalStates.lines.push(lines)
        //         prevEvalStates.evals.push(lines[0].evaluation)
        //         if (moveIndex > 0) {
        //             prevEvalStates.evalsAfter.push(lines[0].evaluation)
        //         }
        //         this.setState({evalStates: prevEvalStates}, () => {
        //             this.setEvals(moveIndex + 1)
        //         })
        //     })
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
        prevEvalStates.evalProgress = 0;

        this.setState({
            'evalStates': prevEvalStates,
            'fen': this.board.fen()
        }, () => {this.setEvals()})

    }

    getEvalDisplay(evaluation, moveIndex) {
        if (moveIndex !== undefined && moveIndex % 2 === 1) {
            evaluation.value *= -1
        }

        if (this.state.humanTurn === "b") {
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
                    {
                        this.state.evalStates.evalReady
                        ?
                        <>
                            <p>
                                {
                                    this.state.evalStates.moves.length > 0
                                    ?
                                    <span className="movesContainer">
                                        <span className="nowrap">Moves played:</span>
                                        <span key="-1" className={this.state.evalStates.moveIndex === 0 ? "selectedMove moveSpan" : "moveSpan"} onClick={() => {
                                            this.changeEvalLine(-1)
                                        }}>...</span>
                                        {this.state.evalStates.moves.map((elem, idx) => {
                                            if (idx % 2 === 0) {
                                                return <span key={idx} className={this.state.evalStates.moveIndex === idx + 1 ? "selectedMove moveSpan" : "moveSpan"} onClick={() => {
                                                    this.changeEvalLine(idx)
                                                }}>{`${elem}`}</span>
                                            } else {
                                                return <span key={idx} className={this.state.evalStates.moveIndex === idx + 1 ? "selectedMove moveSpan" : "moveSpan"} onClick={() => {
                                                    this.changeEvalLine(idx)
                                                }}>{`(${elem})`}</span>
                                            }
                                        })}
                                    </span>
                                    :
                                    <span> None</span>
                                }
                                <br></br><br></br>
                                Evaluation after all of your moves: {this.state.evalStates.evals[this.state.evalStates.evals.length - 1]}
                            </p>
                            <div className = "lines">
                                {
                                    this.state.evalStates.moves.length > 0 
                                    ?
                                    <span>
                                        <span>
                                            Evaluation in this position: 
                                            {" " + this.state.evalStates.evals[this.state.evalStates.moveIndex]}
                                        </span>
                                        <br></br>
                                        {
                                            this.state.evalStates.moveIndex < this.state.evalStates.moves.length
                                            &&
                                            <span>
                                                Evaluation after {this.state.evalStates.moves[this.state.evalStates.moveIndex]}:
                                                { " " + this.state.evalStates.evalsAfter[this.state.evalStates.moveIndex]}
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
                                    this.state.evalStates.lines[this.state.evalStates.moveIndex].map((elem, idx) => {
                                        return <p key={idx}>({elem.evaluation})  {elem.pv}</p>
                                    })
                                }
                            </div>
                        </>
                        :
                        <div className="progressDiv">
                            <CircularProgressbar 
                                value={this.state.evalStates.evalProgress} 
                                text={`${this.state.evalStates.evalProgress.toFixed(0)}%`}
                                styles={buildStyles({
                                    pathColor: "darkred",
                                    trailColor: "lightgray",
                                    textColor: "white",
                                    strokeLinecap: "rounded"
                                })}
                                >

                            </CircularProgressbar>
                        </div>
                    }
                </div>
                }
            </div>
        );
    }
}

export { Board }