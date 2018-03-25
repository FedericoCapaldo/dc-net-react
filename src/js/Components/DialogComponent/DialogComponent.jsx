import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './style.css';

export default class DialogComponent extends Component {
    constructor(props) {
      super(props);
    }

    // merger following two functions
    positiveClick(event) {
      this.props.updateParticipantResponseAndSendToServer(1);
      this.props.hideDialog(event);
    }

    negativeClick(event) {
      this.props.updateParticipantResponseAndSendToServer(0);
      this.props.hideDialog(event);
    }

    render() {
      return (
        <div className="dialog-container row fixed-bottom secret-bit-question">
          <div className="col-12">
            <h2 className="dialog-question">Want to send an anonymous message?</h2>
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
              className="dialog-choice-button btn btn-danger btn-lg"
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
  updateParticipantResponseAndSendToServer: PropTypes.function,
};
