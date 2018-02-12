import React, { Component } from 'react';
import { sendParticipantResponse,
         onConnection,
         recordEvent,
         startRound,
         startGeneratingKey,
         receiveRoundResult,
         hideChoiceDialog,
         receiveKey } from './socket-api';
import ConnectionComponent from './ConnectionComponent';
import DialogComponent from './DialogComponent';
import RoundComponent from './RoundComponent';
import { Round } from './Round';

export default class AppComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      events: [],
      rounds: [],
      showDiagol: false,
      roundNumber: 0,
      roundInProgress: false,
      whoami: '',
    };

    onConnection((name) => {
      this.reset();
      // const connectionMessage = 'New user \'' + name + 'connected';
      this.setState({
        whoami: name,
      });
    });

    startRound(() => {
      this.setState({
        roundNumber: ++this.state.roundNumber,
        rounds: [...this.state.rounds, new Round(this.state.roundNumber)],
        roundInProgress: true,
      });
    });

    startGeneratingKey(() => {
      const tempRounds = this.state.rounds;
      tempRounds[tempRounds.length - 1].isWaitingKeys = true;
      this.setState({
        rounds: tempRounds,
      });
    });

    receiveKey((keyName, keyValue) => {
      const tempRounds = this.state.rounds;
      const currentRound = tempRounds[tempRounds.length - 1];
      currentRound.keys = [...currentRound.keys, { keyName, keyValue }];

      if (currentRound.keys.length === 2) {
        currentRound.isWaitingKeys = false;
        this.setState({
          rounds: tempRounds,
          showDiagol: true,
        });
      } else if (currentRound.keys < 2) {
        this.setState({
          rounds: tempRounds,
        });
      }
      // consider taking actions if there are more than 2 keys.
    });

    recordEvent((eventType, myEvent) => {
      this.setState({
        events: this.state.events.concat({ eventType, myEvent }),
      });
    });

    hideChoiceDialog(() => {
      this.hideDialog();
    });

    receiveRoundResult((result) => {
      const tempRounds = this.state.rounds;
      tempRounds[tempRounds.length - 1].isWaitingRoundResult = false;
      tempRounds[tempRounds.length - 1].roundResult = result;
      tempRounds[tempRounds.length - 1].completed = true;
      this.setState({
        rounds: tempRounds,
        roundInProgress: false,
      });
    });

    this.hideDialog = this.hideDialog.bind(this);
    this.updateParticipantResponseAndSendToServer =
      this.updateParticipantResponseAndSendToServer.bind(this);
  }

  updateParticipantResponseAndSendToServer(response) {
    const tempRounds = this.state.rounds;
    const currentRound = tempRounds[tempRounds.length - 1];
    currentRound.participantResponse = response;
    currentRound.isWaitingRoundResult = true;

    const key1 = currentRound.keys[0].keyValue;
    const key2 = currentRound.keys[1].keyValue;
    currentRound.valueToServer =
      this.calculateXORValueToBroadcast(key1, key2, response);

    sendParticipantResponse(currentRound.valueToServer);

    this.setState({
      rounds: tempRounds,
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
      rounds: [],
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
            updateParticipantResponseAndSendToServer={this.updateParticipantResponseAndSendToServer}
          />
        }
      </div>
    );
  }
}
