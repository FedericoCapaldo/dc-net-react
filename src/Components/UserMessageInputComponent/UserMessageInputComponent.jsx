import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './style.css';

export default class UserMessageInputComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      message: '',
      messageLength: 0,
    };
    this.sendMessage = this.sendMessage.bind(this);
  }

  updateMessage(e) {
    e.preventDefault();
    const m = e.target.value;
    const len = m.length;
    this.setState({
      message: m,
      messageLength: len,
    });
  }

  sendMessage() {
    if (this.state.messageLength) {
      this.props.sendMessageLengthinResponse(this.state.message, this.state.messageLength);
      this.props.hideMessageInputDialog();
    }
  }

  render() {
    return (
      <div className="user_input-container row fixed-bottom">
        <div className="col-12 user_input-question-container">
          <h2 className="user_input-question">Please insert message to send:</h2>
        </div>
        <div className="offset-3 col-sm-5">
          <input
            type="text"
            name="fname"
            className="user_input-textbox"
            onChange={this.updateMessage.bind(this)}
          />
        </div>
        <div className="col-sm-3">
          <button
            type="button"
            className="choice-button btn btn-lg"
            onClick={this.sendMessage}
          >
            SEND
          </button>
        </div>
      </div>
    );
  }
}


UserMessageInputComponent.propTypes = {
  sendMessageLengthinResponse: PropTypes.function,
  hideMessageInputDialog: PropTypes.function,
};
