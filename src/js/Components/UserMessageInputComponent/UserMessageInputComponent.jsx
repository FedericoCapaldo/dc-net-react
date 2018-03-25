import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './style.css';

export default class UserMessageInputComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      message: '',
      messageLength: 0,
      reasonInvalid: '',
      disabledButton: false,
    };
    this.sendMessage = this.sendMessage.bind(this);
  }

  updateMessage(e) {
    e.preventDefault();
    const message = this.removeExtraSpaces(e.target.value);
    const messageLength = message.length;

    if (this.isValid(message)) {
      this.setState({
        message,
        messageLength,
        reasonInvalid: '',
        disabledButton: false,
      });
    }
  }

  removeExtraSpaces(inputMessage) {
    return inputMessage.trim().replace(/ +(?= )/g, '');
  }

  isValid(message) {
    if (message.length === 0) {
      this.setState({
        reasonInvalid: 'Message cannot be empty',
        disabledButton: true,
      });
      return false;
    }

    // check if it is ASCII
    for (let x = 0; x < message.length; x++) {
      if (message.charCodeAt(x) > 255) {
        this.setState({
          reasonInvalid: 'Message is not ASCII encoded',
          disabledButton: true,
        });
        return false;
      }
    }

    return true;
  }

  sendMessage() {
    if (this.state.messageLength) {
      this.props.saveMessageInput(this.state.message, this.state.messageLength);
      this.props.hideMessageInputDialog();
    } else {
      this.setState({ reasonInvalid: 'Message appears to be empty' });
    }
  }

  checkToSendMessage(e) {
    if (e.key === 'Enter' && this.isValid(this.state.message)) {
      this.sendMessage();
    }
  }

  render() {
    return (
      <div className="user_input-container row fixed-bottom">
        <div className="col-12 user_input-question-container">
          <h2 className="user_input-question">Please insert message to send:</h2>
        </div>
        <div className="col-12 user_input-body">
          <div className="row">
            <div className="offset-3 col-5">
              <input
                type="text"
                name="fname"
                className="user_input-textbox"
                onChange={this.updateMessage.bind(this)}
                onKeyPress={this.checkToSendMessage.bind(this)}
              />
            </div>
            <div className="col-4">
              <button
                type="button"
                className="choice-button btn btn-lg"
                onClick={this.sendMessage}
                disabled={this.state.disabledButton}
              >
                SEND
              </button>
            </div>
          </div>
        </div>
        <div className="col-12">
          { this.state.reasonInvalid.length > 0 &&
            <div className="col-12 user_input-invalid_reason-container">
              <span className="user_input-invalid_reason">
                {this.state.reasonInvalid}
              </span>
            </div>
          }
        </div>
      </div>
    );
  }
}


UserMessageInputComponent.propTypes = {
  saveMessageInput: PropTypes.function,
  hideMessageInputDialog: PropTypes.function,
};
