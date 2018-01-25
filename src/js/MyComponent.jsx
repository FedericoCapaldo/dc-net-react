import React, { Component } from 'react';

export default class MyComponent extends Component {
  constructor(props) {
    super(props);
  }

  sendInput() {
    // console.log('voglio farcela');
  }

  render() {
    return (
      <div className="title" onClick={this.sendInput}>
        DC-net simulation App
      </div>
    );
  }
}
