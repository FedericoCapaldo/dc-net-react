import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './style.css';

export default class HeaderComponent extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <header className="header-container">
        <h3 className="header-title">
          DC-net simulation App - {this.props.whoami && <span>You are: {this.props.whoami}</span>}
        </h3>
        {this.props.secondsLeft > 0 &&
          <p>{this.props.secondsLeft} seconds before communications starts</p>
        }
        {this.props.leftToWait > 0 &&
          <p>{this.props.leftToWait} extra clients needed to start communication</p>
        }
      </header>
    );
  }
}

HeaderComponent.propTypes = {
  whoami: PropTypes.string,
  secondsLeft: PropTypes.number,
  leftToWait: PropTypes.number,
};
