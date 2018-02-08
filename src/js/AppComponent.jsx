import React, { Component } from 'react';
import { recordEvent,
         startRound,
         showChoiceDialog,
         hideChoiceDialog,
         receivedKeys,
         reset,
         clearKeys } from './socket-api';
import ConnectionComponent from './ConnectionComponent';
import DialogComponent from './DialogComponent';
import RoundComponent from './RoundComponent';
import { Round } from './Round';

export default class AppComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      allEvents: [],
      rounds: [],
      showDiagol: false,
      generated: false,
      roundNumber: 0,
      roundInProgress: false,
    };

    recordEvent((eventType, myEvent) => {
      this.setState({
        allEvents: this.state.allEvents.concat({ eventType, myEvent }),
      });

      if (eventType === 'ROUND-RESULT') {
        const tempRounds = this.state.rounds;
        tempRounds[tempRounds.length - 1].waiting = false;
        tempRounds[tempRounds.length - 1].completed = true;
        tempRounds[tempRounds.length - 1].finalResult = myEvent;
        this.setState({
          rounds: tempRounds,
          roundInProgress: false,
        });
        console.log(this.state);
      }
    });

    startRound((eventType) => {
      this.setState({
        allEvents: this.state.allEvents.concat({ eventType }),
        roundNumber: ++this.state.roundNumber,
        rounds: [...this.state.rounds, new Round(this.state.roundNumber)],
        roundInProgress: true,
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
        rounds: [],
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
        console.warn('MORE THAN 2 KEYS PRESENT');
      }

      const tempRounds = this.state.rounds;
      tempRounds[tempRounds.length - 1].keys =
        [...tempRounds[tempRounds.length - 1].keys, { keyName, keyValue }];

      this.setState({
        rounds: tempRounds,
      });
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
    const tempRounds = this.state.rounds;
    tempRounds[tempRounds.length - 1].participantResponse = myEvent;

    this.setState({
      allEvents: this.state.allEvents.concat({ eventType, myEvent }),
      rounds: tempRounds,
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
            }
          })
        }
        {this.state.rounds &&
          this.state.rounds.map((round) => {
            return <RoundComponent round={round} />;
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
