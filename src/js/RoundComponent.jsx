import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class RoundComponent extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    console.log(this.props);
    return (
      <div id="round">
      <p>Round {this.props.round.number}</p>
      {this.props.round.keys &&
        this.props.round.keys.map((k) => {
          return <p>{k.keyName} -> {k.keyValue}</p>;
        })
      }
      {this.props.round.participantResponse !== -1 &&
        <p>Your result to the server is {this.props.round.participantResponse}</p>
      }
      {this.props.round.finalResult !== -1 &&
        <p>Round result is {this.props.round.finalResult}</p>
      }
    </div>
    );
  }
}

RoundComponent.propTypes = {
  number: PropTypes.number,
  round: PropTypes.object,
};
