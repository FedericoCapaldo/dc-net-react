import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class ConnectionComponent extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <p>{this.props.message}</p>
    );
  }
}

ConnectionComponent.propTypes = {
  message: PropTypes.string,
};
