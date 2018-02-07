import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class RoundComponent extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <p>Round {this.props.number}</p>
    );
  }
}

RoundComponent.propTypes = {
  number: PropTypes.number,
};
