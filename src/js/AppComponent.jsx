import React, { Component } from 'react';
import { recordEvent, showChoiceDialog, hideChoiceDialog, reset, clearKeys } from './socket-api';
import ConnectionComponent from './ConnectionComponent';
import KeyGenerationComponent from './KeyGenerationComponent';
import DialogComponent from './DialogComponent';
import ParticipantResponseComponent from './ParticipantResponseComponent';

export default class AppComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      allEvents: [],
      showDiagol: false,
    };

    recordEvent((eventType, myEvent) => {
      this.setState({
        allEvents: this.state.allEvents.concat({ eventType, myEvent }),
      });
    });

    showChoiceDialog(() => {
      this.setState({
        showDiagol: true,
      });
    });

    hideChoiceDialog(() => {
      this.hideDialog();
    });

    reset(() => {
      this.setState({
        allEvents: [],
      });
      sessionStorage.clear();
    });

    clearKeys(() => {
      sessionStorage.clear();
    });

    this.hideDialog = this.hideDialog.bind(this);
    this.addMessageToAppState = this.addMessageToAppState.bind(this);
  }

  hideDialog(e) {
    if (e) {
      e.preventDefault();
    }
    this.setState({
      showDiagol: false,
    });
  }

  addMessageToAppState(eventType, myEvent) {
    this.setState({
      allEvents: this.state.allEvents.concat({ eventType, myEvent }),
    });
  }

  render() {
    return (
      <div className="title">
        DC-net simulation App
        {this.state.allEvents &&
          this.state.allEvents.map(function callback(ob) {
            if (ob.eventType === 'CONNECTION') {
              return <ConnectionComponent message={ob.myEvent} />;
            } else if (ob.eventType === 'KEY-GENERATION') {
              return <KeyGenerationComponent />;
            } else if (ob.eventType === 'PARTICIPANT-RESPONSE') {
              return <ParticipantResponseComponent message={ob.myEvent} />;
            } else if (ob.eventType === 'FINAL-ANSWER-PROGRESS') {
              return <p>{ob.myEvent}</p>;
            } else if (ob.eventType === 'ROUND-RESULT') {
              return <p>{ob.myEvent}</p>;
            }
          })
        }
        {this.state.showDiagol &&
          <DialogComponent
            hideDialog={this.hideDialog}
            addMessageToAppState={this.addMessageToAppState}
          />
        }
      </div>
    );
  }
}
