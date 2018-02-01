import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { sendParticipantResponse } from './socket-api';

export default class DialogComponent extends Component {
    constructor(props) {
      super(props);
    }

    positiveClick(event) {
      // XOR with 1 reverses the result
      const result = this.prepareParticipantResponse(1);
      this.props.addMessageToAppState(
        'PARTICIPANT-RESPONSE',
        `The message that you will send to the server is ${result}`
      );
      sendParticipantResponse(result);
      this.props.hideDialog(event);
    }

    negativeClick(event) {
      const result = this.prepareParticipantResponse(0);
      this.props.addMessageToAppState(
        'PARTICIPANT-RESPONSE',
        `The message that you will send to the server is ${result}`
      );
      sendParticipantResponse(result);
      this.props.hideDialog(event);
    }

    prepareParticipantResponse(startValue) {
      let result = startValue;
      for (let x = 0; x < sessionStorage.length; ++x) {
        result += parseInt(sessionStorage.getItem(sessionStorage.key(x)));
      }
      result = result % 2;
      return result;
    }

    render() {
      return (
        <div className="row fixed-bottom secret-bit-question">
          <div className="col-12">
            <h2 className="question">Would you like to pay for the dinner?</h2>
          </div>
          <div className="col-2 offset-4 choice-button-container">
            <button
              type="button"
              id="yes-payer"
              className="choice-button btn btn-success btn-lg"
              onClick={this.positiveClick.bind(this)}
            >
              YES
            </button>
          </div>
          <div className="col-2 choice-button-container">
            <button
              type="button"
              id="no-payer"
              className="choice-button btn btn-danger btn-lg"
              onClick={this.negativeClick.bind(this)}
            >
              NO
            </button>
          </div>
        </div>
      );
    }
}

DialogComponent.propTypes = {
  hideDialog: PropTypes.function,
  addMessageToAppState: PropTypes.function,
};
