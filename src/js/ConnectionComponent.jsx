import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class ConnectionComponent extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        {this.props.data.type === 'connection' &&
          <p>New user {this.props.data.name} connected to the network</p>
        }
        {this.props.data.type === 'disconnection' &&
          <p>{this.props.data.name} disconnected from the network</p>
        }
      </div>
    );
  }
}

ConnectionComponent.propTypes = {
  data: PropTypes.object,
};
