import './App.css';
import React from 'react'
import { Board } from "./board.js"
import { SettingsOverlay } from "./settingsOverlay.js"
import { StartScreen } from "./startScreen.js"
// import { BrowserRouter as Router, Route, Link } from "react-router-dom"
import axios from "axios"

class App extends React.Component {

  STARTING = 0
  PUZZLE = 1
  EVALUATION = 2
  

  state = {
    "board_fen": "start",
    "puzzle_number": -1,
    "mode": this.STARTING,
    "displayEvalButton": false,
    "settings": {
      "limitStrength": false,
      "engineElo": 3000,
      "moveDepth": 15,
      "reviewDepth": 17
    }
  }

  getNewPuzzle() {
    axios.get(`${process.env.REACT_APP_SERVER_LOCATION}/getpuzzle`)
      .then(response => {
        this.setState({
          "board_fen": response.data.fen,
          "puzzle_number": this.state.puzzle_number + 1,
          "mode": this.PUZZLE
        })
      })
  }

  allowEvalButton(newVal) {
    this.setState({
      displayEvalButton: newVal
    })
  }

  beginPuzzles() {
    this.setState({
      "mode": this.PUZZLE
    })
    this.getNewPuzzle()
  }

  evaluatePuzzle() {
    this.setState({
      "mode": this.EVALUATION,
      "displayEvalButton": false
    })
  }

  updateSettings(newSettings) {
    this.setState({"settings": newSettings})
  }

  render() {
    // TODO: Add routes and links for starting page and puzzle pages
    return (
      <div className="App">
        {
          this.state.mode === this.STARTING
          ?
          <div className="start">
            <StartScreen></StartScreen>
            <button onClick={this.beginPuzzles.bind(this)}>Begin Puzzles</button>
            <SettingsOverlay updateCallback={this.updateSettings.bind(this)}></SettingsOverlay>
          </div>
          :
          <div className="puzzle">
            <Board 
              board_fen={this.state.board_fen} 
              puzzle_number={this.state.puzzle_number} 
              mode={this.state.mode} 
              allow_eval_button={this.allowEvalButton.bind(this)}
              settings={this.state.settings}>
              </Board>
            <button onClick={this.getNewPuzzle.bind(this)}>Next Board</button>
            {
              (this.state.mode === this.PUZZLE && this.state.displayEvalButton)
              &&
              <button onClick={this.evaluatePuzzle.bind(this)}>Evaluate Position</button>
            }
            <SettingsOverlay updateCallback={this.updateSettings.bind(this)}></SettingsOverlay>
          </div>
        }

      </div>
    );
  }
}

export default App;
