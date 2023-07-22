import React from "react"

class StartScreen extends React.Component {
    render() {
        return (
            <>
                <h1>Welcome to Chess Trainer</h1>
                <p>
                    In this trainer, you will be given random positions found in games and must find a good continuation. 
                    Note that most positions do not include any tactics.
                </p>
                <p>
                    Continue making moves as long as needed, then press evaluate to see how your moves stack up against an engine.
                    The engine evaluations have a degree of randomness - your evaluation might fluctuate even if you play the best move.
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