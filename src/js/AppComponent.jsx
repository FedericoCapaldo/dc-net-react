import React, { Component } from 'react';
import { abortRoundInProgress,
         connectionEvent,
         connectionSetup,
         hideChoiceDialog,
         messageRejectedWarning,
         receiveGeneralMessage,
         receiveMessageKeys,
         receiveKey,
         receiveLengthRoundResult,
         receiveRoundResult,
         sendParticipantResponse,
         sendParticipantLengthRoundResponse,
         startGeneratingKey,
         startRound,
         startVotingRound,
         startLengthMesuramentRound,
         timeToConnection,
         waitingConnections } from './socket-api';
import ConnectionComponent from '../Components/ConnectionComponent/ConnectionComponent';
import DialogComponent from '../Components/DialogComponent/DialogComponent';
import RoundComponent from '../Components/RoundComponent/RoundComponent';
import HeaderComponent from '../Components/HeaderComponent/HeaderComponent';
import UserMessageInputComponent from
  '../Components/UserMessageInputComponent/UserMessageInputComponent';
import MessageComponent from '../Components/MessageComponent/MessageComponent';

import { Round, Connection, Message } from './Objects';

export default class AppComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentRoundIndex: 0,
      events: [],
      leftToWait: 0,
      roundNumber: 0,
      secondsLeft: 0,
      showDiagol: false,
      showMessageDialog: false,
      whoami: '',
      amISender: false,
      message: '',
      messageLength: 0,
      messageKeys: [],
    };

    timeToConnection((secondsLeft) => {
      this.setState({ secondsLeft });
    });

    connectionSetup((name) => {
      this.reset();
      this.setState({
        whoami: name,
      });
    });

    waitingConnections((leftToWait) => {
      this.setState({ leftToWait });
    });

    connectionEvent((name, type) => {
      this.setState({
        events: [...this.state.events, new Connection(name, type)],
      });
    });

    startRound(() => {
      const newRound = new Round(this.state.roundNumber);
      this.setState({
        currentRoundIndex: this.state.events.length,
        roundNumber: ++this.state.roundNumber,
        events: [...this.state.events, newRound],
      });
    });

    startVotingRound(() => {
      const newRound = new Round(this.state.roundNumber);
      newRound.isVotingRound = true;
      this.setState({
        currentRoundIndex: this.state.events.length,
        roundNumber: ++this.state.roundNumber,
        events: [...this.state.events, newRound],
      });
    });

    startLengthMesuramentRound(() => {
      const newRound = new Round(this.state.roundNumber);
      newRound.isLengthMesuramentRound = true;
      this.setState({
        currentRoundIndex: this.state.events.length,
        roundNumber: ++this.state.roundNumber,
        events: [...this.state.events, newRound],
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
        if (currentRound.isVotingRound) {
          this.setState({
            events: tempEvents,
            showDiagol: true,
          });
        } else if (currentRound.isLengthMesuramentRound) {
          if (this.state.amISender) {
            this.setState({
              events: tempEvents,
              showMessageDialog: true,
            });
          } else {
            let countDownTimer = 4;
            const myInterval = setInterval(() => {
              --countDownTimer;
              this.setState({ secondsLeft: countDownTimer });
              if (countDownTimer <= 0) {
                this.calculateResultForServerAutomatically(0);
                clearInterval(myInterval);
              }
            }, 1000);
            this.setState({ events: tempEvents });
          }
        } else { // normal communication round
          this.calculateResultForServerAutomatically(0);
          this.setState({
            events: tempEvents,
          });
        }
      } else if (currentRound.keys < 2) {
        this.setState({
          events: tempEvents,
        });
      }
      // consider taking actions if there are more than 2 keys.
    });

    receiveMessageKeys((keyName, arrayOfNkeys) => {
      this.setState({
        messageKeys: [...this.state.messageKeys, { keyname: arrayOfNkeys }],
      });
    });

    hideChoiceDialog(() => {
      this.hideDialog();
    });

    // hideMessageDialog(() => {
    //   this.hideMessageInputDialog();
    // });

    messageRejectedWarning(() => {
      const tempEvents = this.state.events;
      tempEvents[this.state.currentRoundIndex].messageRejected = true;
      this.setState({
        amISender: false,
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
      });
    });

    receiveLengthRoundResult((messageLength) => {
      const tempEvents = this.state.events;
      const currentRound = tempEvents[this.state.currentRoundIndex];
      currentRound.isWaitingRoundResult = false;
      currentRound.roundResult = messageLength;
      currentRound.completed = true;
      this.setState({
        events: tempEvents,
        messageLength,
      });
    });

    abortRoundInProgress((abortReason) => {
      const tempEvents = this.state.events;
      const currentRound = tempEvents[this.state.currentRoundIndex];
      currentRound.aborted = true;
      currentRound.abortReason = abortReason;
      this.setState({
        events: tempEvents,
      });
    });

    receiveGeneralMessage((message) => {
      this.setState({
        events: [...this.state.events, new Message(message)],
      });
    });

    this.hideDialog = this.hideDialog.bind(this);
    this.hideMessageInputDialog = this.hideMessageInputDialog.bind(this);
    this.updateParticipantResponseAndSendToServer =
      this.updateParticipantResponseAndSendToServer.bind(this);
    this.sendMessageLengthinResponse = this.sendMessageLengthinResponse.bind(this);
  }

  componentDidUpdate() {
    this.scrollToBottom();
  }

  scrollToBottom() {
    this.messagesEnd.scrollIntoView({ behavior: 'smooth' });
  }

  updateParticipantResponseAndSendToServer(response) {
    if (response) {
      this.setState({ amISender: true });
    }
    const tempEvents = this.state.events;
    const currentRound = tempEvents[this.state.currentRoundIndex];
    // currentRound.participantResponse = response;
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

  sendMessageLengthinResponse(message, messageLength) {
    const tempEvents = this.state.events;
    const currentRound = tempEvents[this.state.currentRoundIndex];
    // currentRound.participantResponse = response;
    currentRound.isWaitingRoundResult = true;

    const key1 = currentRound.keys[0].keyValue;
    const key2 = currentRound.keys[1].keyValue;
    currentRound.valueToServer =
      this.calculateOppositeValueToBroadcast(key1, key2, messageLength);

    sendParticipantLengthRoundResponse(currentRound.valueToServer);

    this.setState({
      message,
      messageLength,
      events: tempEvents,
    });
  }

  calculateResultForServerAutomatically() {
    const tempEvents = this.state.events;
    const currentRound = tempEvents[this.state.currentRoundIndex];
    // currentRound.participantResponse = 0;
    currentRound.isWaitingRoundResult = true;
    const key1 = currentRound.keys[0].keyValue;
    const key2 = currentRound.keys[1].keyValue;

    currentRound.valueToServer =
      this.calculateOppositeValueToBroadcast(key1, key2, 0);

    sendParticipantLengthRoundResponse(currentRound.valueToServer);

    this.setState({
      events: tempEvents,
    });
  }


  calculateXORValueToBroadcast(key1, key2, participantChoice) {
    const sum = key1 + key2 + participantChoice;
    return sum % 2;
  }

  calculateOppositeValueToBroadcast(key1, key2, participantChoice) {
    return key1 + key2 + participantChoice;
  }

  reset() {
    this.setState({
      events: [],
      roundNumber: 0,
      showMessageDialog: false,
      showDiagol: false,
      amISender: false,
      message: '',
      messageLength: 0,
      messageKeys: [],
    });
  }


  hideDialog(e) {
    if (e) {
      e.preventDefault();
    }
    this.setState({
      showDiagol: false,
    });
  }

  hideMessageInputDialog(e) {
    if (e) {
      e.preventDefault();
    }
    this.setState({
      showMessageDialog: false,
    });
  }

  render() {
    return (
      <div>
        <HeaderComponent
          whoami={this.state.whoami}
          secondsLeft={this.state.secondsLeft}
          leftToWait={this.state.leftToWait}
        />
        <div className="content">
          {this.state.events &&
            this.state.events.map((ob) => {
              if (ob.constructor.name === 'Round') {
                return <RoundComponent round={ob} />;
              } else if (ob.constructor.name === 'Connection') {
                return <ConnectionComponent data={ob} />;
              } else if (ob.constructor.name === 'Message') {
                return <MessageComponent message={ob} />;
              }
            })
          }
          {this.state.showMessageDialog &&
            <UserMessageInputComponent
              sendMessageLengthinResponse={this.sendMessageLengthinResponse}
              hideMessageInputDialog={this.hideMessageInputDialog}
            />
          }
          {this.state.showDiagol &&
            <DialogComponent
              hideDialog={this.hideDialog}
              updateParticipantResponseAndSendToServer=
                {this.updateParticipantResponseAndSendToServer}
            />
          }
          <div id="dummy-component-for-scroll"
            style={{ float: 'left', clear: 'both' }}
            ref={(el) => { this.messagesEnd = el; }}
          >
          </div>
        </div>
      </div>
    );
  }
}
