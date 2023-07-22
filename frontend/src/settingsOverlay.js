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

    render() {
        const modalStyle = {
            overlay: {
                zIndex: 999
            }
        }
        return (
            <>
                <ReactModal 
                    isOpen={this.state.showOverlay} 
                    onRequestClose={this.closeOverlay.bind(this)}
                    style={modalStyle}>
                    <p>Settings go here!</p>
                </ReactModal>
                <button onClick={this.openOverlay.bind(this)}>Settings</button>
            </>
        )
    }
}

export { SettingsOverlay }