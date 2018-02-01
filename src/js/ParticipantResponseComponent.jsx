import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class ParticipantResponseComponent extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <p>{this.props.message}</p>
    );
  }
}

ParticipantResponseComponent.propTypes = {
  message: PropTypes.string,
};
