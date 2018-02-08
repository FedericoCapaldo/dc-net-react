import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class RoundComponent extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div id="round">
      <p>Round {this.props.round.number}</p>
      {this.props.round.isWaitingKeys &&
        <p>Waiting to receive secret keys</p>
      }

      {this.props.round.keys.length === 2 &&
        this.props.round.keys.map((k) => {
          return <p>{k.keyName} -> {k.keyValue}</p>;
        })
      }
      {this.props.round.valueToServer !== -1 &&
        <p>Your result to the server is {this.props.round.valueToServer}</p>
      }
      {this.props.round.isWaitingRoundResult &&
        <p>Waiting for other clients result...</p>
      }
      {this.props.round.roundResult !== -1 &&
        <p>Round result is {this.props.round.roundResult}</p>
      }
    </div>
    );
  }
}

RoundComponent.propTypes = {
  number: PropTypes.number,
  round: PropTypes.object,
};
