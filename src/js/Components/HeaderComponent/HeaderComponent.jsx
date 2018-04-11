import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './style.css';

export default class HeaderComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isScrollingEnabled: true,
      areMessageHelpersEnabled: false,
    };

    this.toggleScrolling = this.toggleScrolling.bind(this);
    this.toggleMessageHelpers = this.toggleMessageHelpers.bind(this);
  }

  toggleScrolling() {
    this.setState({
      isScrollingEnabled: !this.state.isScrollingEnabled,
    });
    this.props.toggleScrollInApp();
  }

  toggleMessageHelpers() {
    this.setState({
      areMessageHelpersEnabled: !this.state.areMessageHelpersEnabled,
    });
    this.props.toggleMessageHelpersInApp();
  }

  render() {
    return (
      <header className="header-container">
        <h3 className="header-title">
          DC-net simulation App - {this.props.whoami && <span>You are: {this.props.whoami}</span>}
        </h3>
        <div className="dropdown float-right header-control-container">
          <h3 className="dropdown-title">Controls</h3>
          <div className="dropdown-content">
            <div className="dropdown-scrolling" onClick={this.toggleScrolling}>
              <p className="dropdown-element-title">
                Scrolling { this.state.isScrollingEnabled ? '(Enabled)' : '(Disabled)' }
              </p>
              <input className="form-check-input"
                type="checkbox"
                checked={this.state.isScrollingEnabled}
                id="defaultCheck1"
              />
            </div>
            <hr />
            <div className="dropdown-helpers" onClick={this.toggleMessageHelpers}>
              <p className="dropdown-element-title">
                Helpers { this.state.areMessageHelpersEnabled ? '(Enabled)' : '(Disabled)' }
              </p>
              <input className="form-check-input"
                type="checkbox"
                checked={this.state.areMessageHelpersEnabled}
                id="defaultCheck2"
              />
            </div>
          </div>
        </div>
        {this.props.leftToWait > 0 &&
          <p>{this.props.leftToWait} extra clients needed to start communication</p>
        }
      </header>
    );
  }
}

HeaderComponent.propTypes = {
  whoami: PropTypes.string,
  secondsToStart: PropTypes.number,
  leftToWait: PropTypes.number,
  toggleScrollInApp: PropTypes.function,
  toggleMessageHelpersInApp: PropTypes.function,
};
