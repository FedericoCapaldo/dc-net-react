import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './style.css';

export default class HelperComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      explanationMessage: this.choseExplanation(this.props).replace(/ +(?= )/g, ''),
    };
  }

  fetchRelevantTitle(roundType) {
    if (roundType === 'voting') {
      return 'A voting round is used to decide the cryptogrepher\
        that will be able to send the message undisturbed for a series of rounds.\
        Using this voting round will avoid message collision betweeen cryptographers.';
    } else if (roundType === 'length') {
      return 'A length calculation round is used to establish the number of rounds that a\
        a cryptographer needs to send his message, and to communicate that to the rest of\
        the network, without revealing its identity.';
    } else {
      return 'This is a communication round. A single ASCII character is communicated\
        anonymously by the cryptographer that won the voting round previously.';
    }
  }

  fetchAbortMessage() {
    return 'This round has been aborted. This might be due to different reasons,\
      but in general is due to the fact that anonymity cannot be guaranteed to \
      the message sender. As a consequnce the round is immediately interrupted\
      by the central DC-Net service (the server).';
  }

  fetchKeyExchangeMessage(roundType, props) {
    const { keyName, keyValue } = props;
    if (roundType === 'voting') {
      return `This is a secret key securely exchanged. Its name ${keyName}\
        identifies the two participants in possesion of this key. The key\
        value is ${keyValue}. As this is the voting round a 1-bit key is enough,\
        as this is enough to express a particpant willinginess\
        to book the network bandwith (either yes or no).`;
    } else if (roundType === 'length') {
      return `This is a secret key securely exchanged. Its name ${keyName}\
        identifies the two participants in possesion of this key. The key\
        value is ${keyValue}. During the length calculation round, the keys\
        are long enough to allow the message sender to hide the message in\
        his response.`;
    } else {
      return `This is one of the secret keys exchanged in bulk before the\
        communication rounds started. Its name ${keyName}\
        identifies the two participants in possesion of this key. The key\
        value is ${keyValue}. During a communication round the key is just fetched\
        from the local storage`;
    }
  }

  fetchRoundRejectionMessage(roundType) {
    if (roundType === 'voting') {
      return 'Your message was rejected as some other participant won the\
        voting round. You can try to book the network bandwith again at the\
        next voting round. But be quick to answer \'Yes\'!';
    } else {
      return 'Your message was rejected by the server';
    }
  }

  // this could be improved.
  fetchResponseToServerMessage(roundType, props) {
    const { result } = props;
    if (roundType === 'voting') {
      return `The value sent to server is ${result}. This is the result of the XOR\
        of your two keys and your choice. If you said 'Yes' your keys will be XORed with 1\
        otherwise the message will remain unchanged (or XORed with 0).`;
    } else {
      return `The value sent to server is ${result}. This is the result of the XOR\
        of your two keys and of your possible message, if you are the message sender that\
        won the voting round`;
    }
  }

  fetchWaitingMessage() {
    return 'In order to ensure anonymity the server is waiting for all of the\
      clients results before computing and broadcasting the result of this round';
  }

  fetchRoundResultMessage(roundType, props) {
    const { result } = props;
    if (roundType === 'voting') {
      if (result) {
        return `The round result is ${result}. This means that a pariticipant in\
          the network is trying to send a message and has booked the network bandwith\
          for a number of rounds to be decided in the following round.`;
      } else {
        return 'The round result is 0. This means that no participant wanted\
          to send a message in this round.';
      }
    } else if (roundType === 'length') {
      return `The round result is ${result}. This means that the message sender\
        anonymously communicated that the length of his message is ${result}. The\
        same number of communication rounds will follow.`;
    } else {
      let sentChar = String.fromCharCode(result);
      if (result === 32) {
        sentChar = 'space';
      }
      return `The round result is ${result}. This means that the character anonymously\
        shared on the network is \"${sentChar}\", which is ASCII char number ${result}.`;
    }
  }

  choseExplanation(props) {
    const { helperPosition, roundType } = props;

    switch (helperPosition) {
      case 'title':
        return this.fetchRelevantTitle(roundType);
      case 'aborted':
        return this.fetchAbortMessage();
      case 'key':
        return this.fetchKeyExchangeMessage(roundType, props);
      case 'rejection':
        return this.fetchRoundRejectionMessage(roundType);
      case 'sent-to-server':
        return this.fetchResponseToServerMessage(roundType, props);
      case 'waiting-result':
        return this.fetchWaitingMessage();
      case 'round-result':
        return this.fetchRoundResultMessage(roundType, props);
      default:
        return 'This should be a message helper';
    }
  }


  render() {
    return (
      <div className="helper-container">
        <i className="fa fa-question-circle fa-sm helper"
          title={this.state.explanationMessage}
        >
        </i>
      </div>
    );
  }
}

HelperComponent.propTypes = {
  helperPosition: PropTypes.string,
  roundType: PropTypes.string,
};
