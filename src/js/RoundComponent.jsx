import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class RoundComponent extends Component {
  constructor(props) {
    super(props);
  }

  roundContent(props) {
    if (props.round.aborted) {
      return (
        <div>
          <h3>Round {props.round.number} Aborted!</h3>
          <p>{props.round.abortReason}</p>
        </div>
      );
    } else {
      return (
        <div>
        <p>Round {props.round.number}</p>
        {props.round.isWaitingKeys &&
          <p>Waiting to receive secret keys</p>
        }

        {props.round.keys.length === 2 &&
          props.round.keys.map((k) => {
            return <p>{k.keyName} -> {k.keyValue}</p>;
          })
        }
        {props.round.valueToServer !== -1 &&
          <p>Your result to the server is {props.round.valueToServer}</p>
        }
        {props.round.messageRejected &&
          <p>
            WANRING: Another client already sent a message in this round.
            Your message will not be flipped.
          </p>
        }
        {props.round.isWaitingRoundResult &&
          <p>Waiting for other clients result...</p>
        }
        {props.round.roundResult !== -1 &&
          <p>Round result is {props.round.roundResult}</p>
        }
      </div>
      );
    }
  }


  render() {
    return (
      <div id="round">
        {this.roundContent(this.props)}
      </div>
    );
  }
}

RoundComponent.propTypes = {
  number: PropTypes.number,
  round: PropTypes.object,
};
