import React, { Component } from 'react';
import { connectionEvent,
         connectionSetup,
         hideChoiceDialog,
         messageRejectedWarning,
         receiveKey,
         receiveRoundResult,
         sendParticipantResponse,
         startGeneratingKey,
         startRound } from './socket-api';
import ConnectionComponent from './ConnectionComponent';
import DialogComponent from './DialogComponent';
import RoundComponent from './RoundComponent';
import { Round, Connection } from './Objects';

export default class AppComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentRoundIndex: 0,
      events: [],
      roundInProgress: false,
      roundNumber: 0,
      showDiagol: false,
      whoami: '',
    };

    connectionSetup((name) => {
      this.reset();
      this.setState({
        whoami: name,
      });
    });

    connectionEvent((name, type) => {
      this.setState({
        events: this.state.events.concat(new Connection(name, type)),
      });
    });

    startRound(() => {
      this.setState({
        currentRoundIndex: this.state.events.length,
        roundNumber: ++this.state.roundNumber,
        events: [...this.state.events, new Round(this.state.roundNumber)],
        roundInProgress: true,
      });
    });

    startGeneratingKey(() => {
      const tempEvents = this.state.events;
      tempEvents[this.state.currentRoundIndex].isWaitingKeys = true;
      this.setState({
        events: tempEvents,
      });
    });

    receiveKey((keyName, keyValue) => {
      const tempEvents = this.state.events;
      const currentRound = tempEvents[this.state.currentRoundIndex];
      currentRound.keys = [...currentRound.keys, { keyName, keyValue }];

      if (currentRound.keys.length === 2) {
        currentRound.isWaitingKeys = false;
        this.setState({
          events: tempEvents,
          showDiagol: true,
        });
      } else if (currentRound.keys < 2) {
        this.setState({
          events: tempEvents,
        });
      }
      // consider taking actions if there are more than 2 keys.
    });

    hideChoiceDialog(() => {
      this.hideDialog();
    });

    messageRejectedWarning(() => {
      const tempEvents = this.state.events;
      tempEvents[this.state.currentRoundIndex].messageRejected = true;
      this.setState({
        events: tempEvents,
      });
    });

    receiveRoundResult((result) => {
      const tempEvents = this.state.events;
      const currentRound = tempEvents[this.state.currentRoundIndex];
      currentRound.isWaitingRoundResult = false;
      currentRound.roundResult = result;
      currentRound.completed = true;
      this.setState({
        events: tempEvents,
        roundInProgress: false,
      });
    });

    this.hideDialog = this.hideDialog.bind(this);
    this.updateParticipantResponseAndSendToServer =
      this.updateParticipantResponseAndSendToServer.bind(this);
  }

  updateParticipantResponseAndSendToServer(response) {
    const tempEvents = this.state.events;
    const currentRound = tempEvents[this.state.currentRoundIndex];
    currentRound.participantResponse = response;
    currentRound.isWaitingRoundResult = true;

    const key1 = currentRound.keys[0].keyValue;
    const key2 = currentRound.keys[1].keyValue;
    currentRound.valueToServer =
      this.calculateXORValueToBroadcast(key1, key2, response);

    sendParticipantResponse(currentRound.valueToServer);

    this.setState({
      events: tempEvents,
    });
  }

  calculateXORValueToBroadcast(key1, key2, participantChoice) {
    const sum = key1 + key2 + participantChoice;
    return sum % 2;
  }

  reset() {
    this.setState({
      events: [],
      roundNumber: 0,
    });
    this.hideDialog();
  }


  hideDialog(e) {
    if (e) {
      e.preventDefault();
    }
    this.setState({
      showDiagol: false,
    });
  }

  render() {
    return (
      <div className="title">
        DC-net simulation App - {this.state.whoami && <span>You are: {this.state.whoami}</span>}
        {this.state.events &&
          this.state.events.map((ob) => {
            if (ob.constructor.name === 'Round') {
              return <RoundComponent round={ob} />;
            } else if (ob.constructor.name === 'Connection') {
              return <ConnectionComponent data={ob} />;
            }
          })
        }
        {this.state.showDiagol &&
          <DialogComponent
            hideDialog={this.hideDialog}
            updateParticipantResponseAndSendToServer={this.updateParticipantResponseAndSendToServer}
          />
        }
      </div>
    );
  }
}
