import "./settingOverlay.css"
import React from "react"
import ReactModal from "react-modal"

class SettingsOverlay extends React.Component {
    state = {
        showOverlay: false,
        limitStrength: false,
        engineElo: 3190,
        moveDepth: 15,
        reviewDepth: 17
    }

    openOverlay() {
        this.setState({showOverlay: true})
    }

    closeOverlay() {
        this.setState({showOverlay: false})
    }

    updateSettings(settingChange) {
        this.setState(settingChange, () => {
            let {showOverlay: _, ...settings} = this.state
            this.props.updateCallback(settings)
        })
    }

    render() {
        const modalStyle = {
            content: {
                width: "35vw",
                height: "40vh",
                backgroundColor: "#232323",
                borderColor: "#232323",
                color: "white",
                left: "50%",
                right: "auto",
                top: "50%",
                transform: "translate(-50%, -50%)",
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
                    <h3 id="settingsHeader">Settings:</h3>
                    Limit engine strength (for opponent's moves): <input type="checkbox" value={this.state.limitStrength} onChange={(e)=>{this.updateSettings({limitStrength: e.target.checked})}}></input>
                    <br></br>
                    {
                        this.state.limitStrength &&
                        <>
                            <br></br>
                            Engine strength (for opponent's moves):
                            <br></br>
                            <div className="settingDiv">
                                <input type="range" min="1320" max="3190" value={this.state.engineElo} step="10" onChange={(e)=>{this.updateSettings({engineElo: parseInt(e.target.value)})}}></input>
                                <label className="sliderNumber">{this.state.engineElo}</label>
                            </div>
                        </>
                    }
                    <br></br>
                    Engine depth (for opponent's moves):
                    <br></br>
                    <div className="settingDiv">
                        <input type="range" min="10" max="20" value={this.state.moveDepth} onChange={(e)=>{this.updateSettings({moveDepth: parseInt(e.target.value)})}}></input>
                        <label className="sliderNumber">{this.state.moveDepth}</label>
                    </div>
                    <br></br>
                    Engine depth (for review):
                    <br></br>
                    <div className="settingDiv">
                        <input type="range" min="10" max="20" value={this.state.reviewDepth} onChange={(e)=>{this.updateSettings({reviewDepth: parseInt(e.target.value)})}}></input>
                        <label className="sliderNumber">{this.state.reviewDepth}</label>
                    </div>
                </ReactModal>
                <button onClick={this.openOverlay.bind(this)}>Settings</button>
            </>
        )
    }
}

export { SettingsOverlay }