import React from "react"

class StartScreen extends React.Component {
    render() {
        return (
            <>
                <h1>Welcome to Chess Trainer</h1>
                <p>
                    In this trainer, you will be given random positions found in games and must find a good continuation. 
                    Note that most positions do not include any tactics. You can also use right click + drag to draw arrows to help with calculations, and left click to clear all arrows.
                </p>
                <p>
                    Continue making moves as long as needed, then press evaluate to see how your moves stack up against an engine.
                    The engine evaluations have a degree of randomness - your evaluation might fluctuate even if you play the best move.
                    To switch to a different evaluated move, click on it in the moves list on the right. (Alternatively, you can press the left and right arrow keys.)
                </p>
                <p>
                    At any point during evaluation, you can move the board pieces to help you calculate. To reset the board, click one of the moves.
                </p>
                <p>
                    You can modify the strength of the Stockfish engine that plays your opponent's moves, as well as the depth of the engine
                    that evaluates your moves in the settings. Note that higher depth values can take a while to compute.
                </p>
            </>
        )
    }
}

export { StartScreen }