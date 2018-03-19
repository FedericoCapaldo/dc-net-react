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
      <div>
        <br/>
        <p>MESSAGE DIALOG</p>
        <input type="text" name="fname" onChange={this.updateMessage.bind(this)}/>
        <button
          type="button"
          id="yes-payer"
          className="choice-button btn btn-success btn-lg"
          onClick={this.sendMessage}
        >
        </button>
        <br/>
      </div>
    );
  }
}


UserMessageInputComponent.propTypes = {
  sendMessageLengthinResponse: PropTypes.function,
  hideMessageInputDialog: PropTypes.function,
};
