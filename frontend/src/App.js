import './App.css';
import React from 'react'
import { Board } from "./board.js"

class App extends React.Component {

  state = {
    "board_fen": "start",
    "puzzle_number": 0
  }

  getNewPuzzle() {
    this.setState({
      "board_fen": "r2qkbr1/pb1nn3/1ppp3p/8/3P1p2/2PB1N1P/PPQN1PP1/2K1R2R w q - 2 15",
      "puzzle_number": this.state.puzzle_number + 1
    })
  }

  render() {
    return (
      <div className="App">
        <Board board_fen={this.state.board_fen} puzzle_number={this.state.puzzle_number}></Board>
        <button onClick={this.getNewPuzzle.bind(this)}>Next board</button>
      </div>
    );
  }
}

export default App;
