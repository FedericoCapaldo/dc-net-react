import React, { Component } from 'react';
import { receivedKeys } from './socket-api';

export default class KeyGenerationComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      generated: false,
    };

    receivedKeys((keyName, keyValue) => {
      sessionStorage.setItem(keyName, keyValue);
      if (sessionStorage.length === 2) {
        this.setState({
          generated: true,
        });
      }
    });
  }

  render() {
    let message;
    if (this.state.generated) {
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
