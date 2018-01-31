import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class KeyGenerationComponent extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    let message;
    if (this.props.generated) {
      message = 'keys generated';
    } else {
      message = 'key generation in progress';
    }

    return (
      <p>{message}</p>
    );
  }
}

KeyGenerationComponent.propTypes = {
  generated: PropTypes.boolean,
};
