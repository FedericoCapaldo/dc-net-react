import React, { Component } from 'react';
import PropTypes from 'prop-types';
import HelperComponent from '../HelperComponent/HelperComponent';
import './style.css';

export default class RoundComponent extends Component {
  constructor(props) {
    super(props);
  }

  getRoundType(round) {
    const { isVotingRound, isLengthRound } = round;
    if (isVotingRound) {
      return 'voting';
    } else if (isLengthRound) {
      return 'length';
    } else {
      return 'communication';
    }
  }

  displayRoundTitle(round) {
    const { isVotingRound, isLengthRound, number, totalRoundNumbers } = round;
    if (isVotingRound) {
      return 'Voting Round';
    } else if (isLengthRound) {
      if (round.lengthRoundAttempt) {
        return `Message Length Calculation Round (attempt ${round.lengthRoundAttempt})`;
      }
      return 'Message Length Calculation Round';
    } else {
      // normal communication round
      return `Round ${number}/${totalRoundNumbers}`;
    }
  }

  displayRoundResult(round) {
    const { isVotingRound, isLengthRound, roundResult } = round;
    if (isVotingRound) {
      return `Voting Round result is ${roundResult}.`;
    } else if (isLengthRound) {
      return `Length of message is ${roundResult}`;
    } else {
      // normal communication round
      return `Current round result is ${roundResult}`;
    }
  }

  roundContent(round, displayHelpers) {
    if (round.aborted) {
      return (
        <div className="round-line">
          <p className="round-title">Round Aborted!</p>
          {displayHelpers &&
            <HelperComponent
              helperPosition="aborted"
              roundType={this.getRoundType(round)}
            />
          }
          <p>{round.abortReason}</p>
        </div>
      );
    } else {
      return (
        <div>
        <div className="round-line">
          <p className="round-title">{this.displayRoundTitle(round)}</p>
          {displayHelpers &&
            <HelperComponent
              helperPosition="title"
              roundType={this.getRoundType(round)}
            />
          }
        </div>

        {round.isWaitingKeys &&
          <div className="round-line">
            <span>Waiting to receive secret keys</span>
            <span className="loading">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </div>
        }

        {round.keys.length === 2 &&
          round.keys.map((k) => {
            return (
              <div className="round-line">
                <span>{k.keyName} -> {k.keyValue}</span>
                {displayHelpers &&
                  <HelperComponent
                    helperPosition="key"
                    roundType={this.getRoundType(round)}
                    keyName={k.keyName}
                    keyValue={k.keyValue}
                  />
                }
              </div>
            );
          })
        }
        {round.valueToServer !== -1 &&
          <div className="round-line">
            <span>Your message to the server is {round.valueToServer}</span>
            {displayHelpers &&
              <HelperComponent
                helperPosition="sent-to-server"
                roundType={this.getRoundType(round)}
                result={round.valueToServer}
              />
            }
          </div>
        }
        {round.messageRejected &&
          <div className="round-line">
            <span className="warning">Warning: </span>
            <span>You lost the voting round. Try again later.</span>
            {displayHelpers &&
              <HelperComponent
                helperPosition="rejection"
                roundType={this.getRoundType(round)}
              />
            }
          </div>
        }
        {round.isWaitingRoundResult &&
          <div className="round-line">
            <span>Waiting for other clients results</span>
            <span className="loading">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
            {displayHelpers &&
              <HelperComponent
                helperPosition="waiting-result"
                roundType={this.getRoundType(round)}
              />
            }
          </div>
        }
        {round.roundResult !== -1 &&
          <div className="round-result-message round-line">
            <span>{this.displayRoundResult(round)}</span>
            {displayHelpers &&
              <HelperComponent
                helperPosition="round-result"
                roundType={this.getRoundType(round)}
                result={round.roundResult}
              />
            }
          </div>
        }
      </div>
      );
    }
  }


  render() {
    return (
      <div className="round-container">
        {this.roundContent(this.props.round, this.props.displayHelpers)}
      </div>
    );
  }
}

RoundComponent.propTypes = {
  number: PropTypes.number,
  round: PropTypes.object,
  displayHelpers: PropTypes.boolean,
};
