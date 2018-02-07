import React, { Component } from 'react';
import { recordEvent,
         startRound,
         showChoiceDialog,
         hideChoiceDialog,
         receivedKeys,
         reset,
         clearKeys } from './socket-api';
import ConnectionComponent from './ConnectionComponent';
import KeyGenerationComponent from './KeyGenerationComponent';
import DialogComponent from './DialogComponent';
import ParticipantResponseComponent from './ParticipantResponseComponent';
import RoundComponent from './RoundComponent';

export default class AppComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      allEvents: [],
      showDiagol: false,
      generated: false,
      roundNumber: 0,
      roundInProgress: false,
    };

    recordEvent((eventType, myEvent) => {
      this.setState({
        allEvents: this.state.allEvents.concat({ eventType, myEvent }),
      });
    });

    startRound((eventType) => {
      this.setState({
        allEvents: this.state.allEvents.concat({ eventType }),
        roundNumber: ++this.state.roundNumber,
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
        roundNumber: 0,
      });
      sessionStorage.clear();
    });

    receivedKeys((keyName, keyValue) => {
      sessionStorage.setItem(keyName, keyValue);
      if (sessionStorage.length === 2) {
        this.setState({
          generated: true,
        });
      } else if (sessionStorage.length > 2) {
        // consider taking actions if there are more than 2 keys.
      }
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
          this.state.allEvents.map((ob) => {
            if (ob.eventType === 'CONNECTION') {
              return <ConnectionComponent message={ob.myEvent} />;
            } else if (ob.eventType === 'START-ROUND') {
              return <RoundComponent number={this.state.roundNumber} />;
            } else if (ob.eventType === 'KEY-GENERATION') {
              return <KeyGenerationComponent generated={this.state.generated} />;
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
