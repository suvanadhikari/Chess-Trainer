import "./settingOverlay.css"
import React from "react"
import ReactModal from "react-modal"

class SettingsOverlay extends React.Component {
    state = {
        showOverlay: false,
    }

    openOverlay() {
        this.setState({showOverlay: true})
    }

    closeOverlay() {
        this.setState({showOverlay: false})
    }

    updateSettings(settingChange) {
        let newSettings = {...this.props.settings, ...settingChange}
        this.props.updateCallback(newSettings)
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
                    Limit engine strength (for opponent's moves): <input type="checkbox" checked={this.props.settings.limitStrength} onChange={(e)=>{this.updateSettings({limitStrength: e.target.checked})}}></input>
                    <br></br>
                    {
                        this.props.settings.limitStrength &&
                        <>
                            <br></br>
                            Engine strength (for opponent's moves):
                            <br></br>
                            <div className="settingDiv">
                                <input type="range" min="1320" max="3190" value={this.props.settings.engineElo} step="10" onChange={(e)=>{this.updateSettings({engineElo: parseInt(e.target.value)})}}></input>
                                <label className="sliderNumber">{this.props.settings.engineElo}</label>
                            </div>
                        </>
                    }
                    <br></br>
                    Engine depth (for opponent's moves):
                    <br></br>
                    <div className="settingDiv">
                        <input type="range" min="10" max="20" value={this.props.settings.moveDepth} onChange={(e)=>{this.updateSettings({moveDepth: parseInt(e.target.value)})}}></input>
                        <label className="sliderNumber">{this.props.settings.moveDepth}</label>
                    </div>
                    <br></br>
                    Engine depth (for review):
                    <br></br>
                    <div className="settingDiv">
                        <input type="range" min="10" max="20" value={this.props.settings.reviewDepth} onChange={(e)=>{this.updateSettings({reviewDepth: parseInt(e.target.value)})}}></input>
                        <label className="sliderNumber">{this.props.settings.reviewDepth}</label>
                    </div>
                </ReactModal>
                <button onClick={this.openOverlay.bind(this)}>Settings</button>
            </>
        )
    }
}

export { SettingsOverlay }