import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './style.css';


export default class MessageComponent extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="message-container">
        <p className="message">
          {this.props.message.message}
        </p>
      </div>
    );
  }
}

MessageComponent.propTypes = {
  message: PropTypes.Object,
};
