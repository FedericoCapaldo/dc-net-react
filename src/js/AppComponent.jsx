import React, { Component } from 'react';
import { updateOutput, sendMessage } from './socket-api';
import ConnectionComponent from './Connection';
import KeyGenerationComponent from './KeyGenerationComponent';

export default class AppComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      output: [],
    };

    updateOutput((type, output) => {
      this.setState({
        output: this.state.output.concat({ type, output }),
      });
    });
  }

  componentDidMount() {
    console.log('the component mounted');
  }

  sendInput() {
    sendMessage('something');
  }


  render() {
    return (
      <div className="title" onClick={this.sendInput}>
        DC-net simulation App
        {this.state.output &&
          this.state.output.map(function (ob) {
            if (ob.type === 'CONNECTION') {
              return <ConnectionComponent message={ob.output} />;
            } else if (ob.type === 'KEY-GENERATION') {
              return <KeyGenerationComponent generated={false} />;
            }
          })
        }
      </div>
    );
  }
}
