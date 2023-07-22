import React from "react"
import ReactModal from "react-modal"

class SettingsOverlay extends React.Component {
    state = {
        showOverlay: false,
        limitStrength: false,
        engineElo: 3000,
        moveDepth: 15,
        reviewDepth: 20
    }

    openOverlay() {
        this.setState({showOverlay: true})
    }

    closeOverlay() {
        this.setState({showOverlay: false})
    }

    render() {
        const modalStyle = {
            content: {
                width: "35vw",
                height: "35vh",
                backgroundColor: "#232323",
                borderColor: "#232323",
                color: "white",
                left: "50%",
                right: "auto",
                top: "50%",
                transform: "translate(-50%, -50%)"
            },
            overlay: {
                zIndex: 999,
                backgroundColor: "rgba(0, 0, 0, 0.8)"
            }
        }
        return (
            <>
                <ReactModal 
                    isOpen={this.state.showOverlay} 
                    onRequestClose={this.closeOverlay.bind(this)}
                    style={modalStyle}>
                    <h3>Settings:</h3>
                    Limit engine strength (for opponent's moves): <input type="checkbox" onChange={(e)=>{this.setState({limitStrength: e.target.checked})}}></input>
                    <br></br>
                    {
                        this.state.limitStrength &&
                        <>
                            Engine strength (for opponent's moves): <input type="range" min="1000" max="3000" defaultValue="3000" onChange={(e)=>{this.setState({engineElo: e.target.value})}}></input>
                            <br></br>
                        </>
                    }
                    <br></br>
                    Engine depth (for opponent's moves): <input type="range" min="10" max="20" defaultValue="15" onChange={(e)=>{this.setState({moveDepth: e.target.value})}}></input>
                    <br></br>
                    Engine depth (for review): <input type="range" min="17" max="23" defaultValue="20" onChange={(e)=>{this.setState({reviewDepth: e.target.value})}}></input>
                </ReactModal>
                <button onClick={this.openOverlay.bind(this)}>Settings</button>
            </>
        )
    }
}

export { SettingsOverlay }