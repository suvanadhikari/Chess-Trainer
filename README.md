# Chess Trainer
A webapp app to train chess abilities - similar to a tactics app, but there isn't always a right answer.

The app can be found [here](https://chess-trainer.netlify.app/). Instructions on how to use it are also found there.

## Structure
This app uses the PERN (Postgres, Express, React, Node) stack. The `frontend` folder contains the React application, while the `backend` folder contains the Express server (which is hosted on Heroku). The server handles puzzle generation (where it communicates with the puzzle database) and engine evaluation.
