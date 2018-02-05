import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class KeyGenerationComponent extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    let message;
    if (this.props.generated) {
      message = 'keys generated!  ';
      message += 'Your keys are: ';
      for (let i = 0; i < sessionStorage.length; ++i) {
        const keyName = sessionStorage.key(i);
        const keyValue = sessionStorage.getItem(keyName);
        message += ` -${keyName}: ${keyValue}`;
      }
    } else {
      message = 'Key generation in progress';
    }
    return (
      <p>{message}</p>
    );
  }
}

KeyGenerationComponent.propTypes = {
  generated: PropTypes.boolean,
};
