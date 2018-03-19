import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './style.css';

export default class ConnectionComponent extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="connection-container">
        <i className="fa fa-plug" aria-hidden="true"></i>
        {this.props.data.type === 'connection' &&
          <span className="connection-message">
            {this.props.data.name} connected to the network
          </span>
        }
        {this.props.data.type === 'disconnection' &&
          <span className="disconnection-message">
            {this.props.data.name} disconnected from the network
          </span>
        }
      </div>
    );
  }
}

ConnectionComponent.propTypes = {
  data: PropTypes.object,
};
