import React, { Component } from 'react';
import { sendMessage } from './socket-api';

export default class MyComponent extends Component {
  constructor(props) {
    super(props);
  }

  sendInput() {
    // console.log('voglio farcela');
    sendMessage('something new yoooo');
  }

  render() {
    return (
      <div className="title" onClick={this.sendInput}>
        DC-net simulation App
      </div>
    );
  }
}
