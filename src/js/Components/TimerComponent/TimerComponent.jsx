import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './style.css';

export default class TimerComponent extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="counter-container">
        <p className="counter-text">
          {this.props.timerSeconds + ' seconds '}
          {this.props.timerMessage || ' seconds left'}
        </p>
      </div>
    );
  }
}

TimerComponent.propTypes = {
  timerSeconds: PropTypes.number,
  timerMessage: PropTypes.string,
};
