import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './style.css';

export default class RoundComponent extends Component {
  constructor(props) {
    super(props);
  }

  displayRoundTitle(round) {
    const { isVotingRound, isLengthRound, number, totalRoundNumbers } = round;
    if (isVotingRound) {
      return 'Voting Round';
    } else if (isLengthRound) {
      return 'Length Calculation Round';
    } else {
      // normal communication round
      return `Round ${number}/${totalRoundNumbers}`;
    }
  }

  roundContent(round) {
    if (round.aborted) {
      return (
        <div>
          <h3>Round {round.number} Aborted!</h3>
          <p>{round.abortReason}</p>
        </div>
      );
    } else {
      return (
        <div>
        <p className="round-title">{this.displayRoundTitle(round)}</p>
        {round.isWaitingKeys &&
          <p>Waiting to receive secret keys</p>
        }

        {round.keys.length === 2 &&
          round.keys.map((k) => {
            return <p>{k.keyName} -> {k.keyValue}</p>;
          })
        }
        {round.valueToServer !== -1 &&
          <p>Your result to the server is {round.valueToServer}</p>
        }
        {round.messageRejected &&
          <p>
            WANRING: Another client already sent a message in this round.
            Your message will not be flipped.
          </p>
        }
        {round.isWaitingRoundResult &&
          <p>Waiting for other clients result
            <span className="loading">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </p>
        }
        {round.roundResult !== -1 &&
          <p>Round result is {round.roundResult}</p>
        }
      </div>
      );
    }
  }


  render() {
    return (
      <div className="round-container">
        {this.roundContent(this.props.round)}
      </div>
    );
  }
}

RoundComponent.propTypes = {
  number: PropTypes.number,
  round: PropTypes.object,
};
