import './App.css';
import React from 'react'
import { Board } from "./board.js"
import { BrowserRouter as Router, Route, Link } from "react-router-dom"
import axios from "axios"

class App extends React.Component {

  state = {
    "board_fen": "start",
    "puzzle_number": 0
  }

  getNewPuzzle() {
    axios.get("http://localhost:4000/getpuzzle")
      .then(response => {
        this.setState({
          "board_fen": response.data.fen,
          "puzzle_number": this.state.puzzle_number + 1
        })
      })
      .catch(error => {
        console.log(error)
      })
  }

  render() {
    // TODO: Add routes and links for starting page and puzzle pages
    return (
      <Router>
        <div className="App">
          <Board board_fen={this.state.board_fen} puzzle_number={this.state.puzzle_number}></Board>
          <button onClick={this.getNewPuzzle.bind(this)}>Next board</button>
        </div>
      </Router>
    );
  }
}

export default App;
