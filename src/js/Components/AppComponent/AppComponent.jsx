import React, { Component } from 'react';
import { debugBackEnd,
         abortRoundInProgress,
         connectionEvent,
         connectionSetup,
         hideChoiceDialog,
         messageRejectedWarning,
         receiveGeneralMessage,
         receiveMessageKeys,
         receiveRoundKey,
         receiveLengthRoundResult,
         receiveVotingRoundResult,
         receiveCommunicationRoundResult,
         sendParticipantVotingResponse,
         sendParticipantLengthRoundResponse,
         sendParticipantCommunicationRoundResponse,
         showCommunicatedMessage,
         startCommunicationRound,
         startVotingRound,
         startLengthMesuramentRound,
         substituteKeys,
         substituteMessageKeys,
         updateSecondsToStart,
         waitingConnections } from '../../socket-api';
import ConnectionComponent from '../ConnectionComponent/ConnectionComponent';
import DialogComponent from '../DialogComponent/DialogComponent';
import RoundComponent from '../RoundComponent/RoundComponent';
import HeaderComponent from '../HeaderComponent/HeaderComponent';
import UserMessageInputComponent from
  '../UserMessageInputComponent/UserMessageInputComponent';
import MessageComponent from '../MessageComponent/MessageComponent';

import { Round, Connection, Message } from '../../Objects';
import './style.css';

export default class AppComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentRoundIndex: 0,
      events: [],
      leftToWait: 0,
      roundNumber: 1,
      secondsToStart: 0,
      showDiagol: false,
      showMessageDialog: false,
      whoami: '',
      amISender: false,
      message: '',
      messagePointer: 0,
      messageLength: 0,
      messageKeys: [],
    };

    connectionSetup((name) => {
      this.resetReconnection();
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

    startVotingRound(() => {
      const newRound = new Round();
      newRound.isVotingRound = true;
      newRound.isWaitingKeys = true;
      this.setState({
        currentRoundIndex: this.state.events.length,
        events: [...this.state.events, newRound],
      });
    });

    startLengthMesuramentRound(() => {
      const newRound = new Round();
      newRound.isLengthRound = true;
      newRound.isWaitingKeys = true;
      this.setState({
        currentRoundIndex: this.state.events.length,
        events: [...this.state.events, newRound],
      });
    });

    startCommunicationRound(() => {
      const totalRoundNumbers = this.state.messageLength;
      const newRound = new Round(this.state.roundNumber, totalRoundNumbers);
      const tempKeys = this.state.messageKeys;
      let keyName = tempKeys[0].keyName;
      let keyValue = tempKeys[0].keyValues[this.state.messagePointer];
      newRound.keys = [{ keyName, keyValue }];
      keyName = tempKeys[1].keyName;
      keyValue = tempKeys[1].keyValues[this.state.messagePointer];
      newRound.keys = [...newRound.keys, { keyName, keyValue }];
      if (isNaN(keyValue)) {
        // to be removed
        this.setState({
          events: [...this.state.events, new Message('we are done!')],
        });
      } else {
        this.setState({
          currentRoundIndex: this.state.events.length,
          roundNumber: ++this.state.roundNumber,
          events: [...this.state.events, newRound],
          messageKeys: tempKeys,
          messagePointer: ++this.state.messagePointer,
        });
        this.calculateAndSendResult();
      }
    });

    receiveRoundKey((keyName, keyValue) => {
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
        } else if (currentRound.isLengthRound) {
          if (this.state.amISender) {
            this.setState({
              events: tempEvents,
              showMessageDialog: true,
            });
          }

          let countDownTimer = 10;
          const myInterval = setInterval(() => {
            --countDownTimer;
            if (this.state.events[this.state.currentRoundIndex].aborted) {
              this.setState({
                secondsToStart: 0,
              });
              clearInterval(myInterval);
            } else {
              this.setState({ secondsToStart: countDownTimer });
              if (countDownTimer <= 0) {
                if (this.state.amISender) {
                  this.sendMessageLengthinResponse();
                } else {
                  this.calculateLengthRoundResultAndSendToServer();
                }
                clearInterval(myInterval);
              }
            }
          }, 1000);
          this.setState({ events: tempEvents });
        } else { // normal communication round
          this.calculateLengthRoundResultAndSendToServer();
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

    receiveMessageKeys((keyName, keyValues) => {
      this.setState({
        messageKeys: [...this.state.messageKeys, { keyName, keyValues }],
      });
    });

    receiveVotingRoundResult((result) => {
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

    receiveCommunicationRoundResult((singleAsciiLetter) => {
      const tempEvents = this.state.events;
      const currentRound = tempEvents[this.state.currentRoundIndex];
      currentRound.isWaitingRoundResult = false;
      currentRound.roundResult = singleAsciiLetter;
      currentRound.completed = true;

      let message = this.state.message;
      if (!this.state.amISender) {
        const letter = String.fromCharCode(singleAsciiLetter);
        message = message + letter;
      }

      this.setState({
        events: tempEvents,
        message,
      });
    });

    showCommunicatedMessage(() => {
      const mes =
        (this.state.amISender ? 'Message Anonymously sent: ' : 'Message Anonymously Received: ')
        + this.state.message;

      this.setState({
        events: [...this.state.events, new Message(mes)],
        roundNumber: 1,
      });
      this.resetEndOfRound();
    });


    messageRejectedWarning(() => {
      const tempEvents = this.state.events;
      tempEvents[this.state.currentRoundIndex].messageRejected = true;
      this.setState({
        amISender: false,
        events: tempEvents,
      });
    });

    abortRoundInProgress((abortReason) => {
      const tempEvents = this.state.events;
      const currentRound = tempEvents[this.state.currentRoundIndex];
      currentRound.aborted = true;
      currentRound.abortReason = abortReason;
      this.setState({
        events: tempEvents,
        showDiagol: false,
        showMessageDialog: false,
        amISender: false,
        message: '',
        messagePointer: 0,
        messageLength: 0,
        messageKeys: [],
        roundNumber: 1,
      });
    });

    hideChoiceDialog(() => {
      this.hideDialog();
    });

    // hideMessageDialog(() => {
    //   this.hideMessageInputDialog();
    // });

    updateSecondsToStart((secondsToStart) => {
      this.setState({ secondsToStart });
    });

    receiveGeneralMessage((message) => {
      this.setState({
        events: [...this.state.events, new Message(message)],
      });
    });

    substituteKeys((newKeys) => {
      const tempEvents = this.state.events;
      const currentRound = tempEvents[this.state.currentRoundIndex];
      currentRound.keys = newKeys;
      this.setState({
        events: tempEvents,
      });
    });

    substituteMessageKeys((newMessageKeys) => {
      this.setState({
        messageKeys: newMessageKeys,
      });
    });

    this.hideDialog = this.hideDialog.bind(this);
    this.hideMessageInputDialog = this.hideMessageInputDialog.bind(this);
    this.updateParticipantResponseAndSendToServer =
      this.updateParticipantResponseAndSendToServer.bind(this);
    this.saveMessageInput = this.saveMessageInput.bind(this);
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

    sendParticipantVotingResponse(currentRound.valueToServer);

    this.setState({
      events: tempEvents,
    });
  }

  sendMessageLengthinResponse() {
    const tempEvents = this.state.events;
    const currentRound = tempEvents[this.state.currentRoundIndex];
    // currentRound.participantResponse = response;
    currentRound.isWaitingRoundResult = true;

    const key1 = currentRound.keys[0].keyValue;
    const key2 = currentRound.keys[1].keyValue;
    currentRound.valueToServer =
      this.calculateXORValueToBroadcast(key1, key2, this.state.messageLength);

    sendParticipantLengthRoundResponse(currentRound.valueToServer);

    this.setState({
      events: tempEvents,
    });
  }

  saveMessageInput(message, messageLength) {
    this.setState({
      message,
      messageCopy: message,
      messageLength,
    });
  }


  calculateLengthRoundResultAndSendToServer() {
    const tempEvents = this.state.events;
    const currentRound = tempEvents[this.state.currentRoundIndex];
    // currentRound.participantResponse = 0;
    currentRound.isWaitingRoundResult = true;
    const key1 = currentRound.keys[0].keyValue;
    const key2 = currentRound.keys[1].keyValue;

    currentRound.valueToServer =
      this.calculateXORValueToBroadcast(key1, key2, 0);

    sendParticipantLengthRoundResponse(currentRound.valueToServer);

    this.setState({
      events: tempEvents,
    });
  }

  calculateAndSendResult() {
    const tempEvents = this.state.events;
    const currentRound = tempEvents[this.state.currentRoundIndex];
    currentRound.isWaitingRoundResult = true;
    const key1 = currentRound.keys[0].keyValue;
    const key2 = currentRound.keys[1].keyValue;

    let messageCopy = this.state.messageCopy;
    if (this.state.amISender) {
      currentRound.valueToServer =
        this.calculateOppositeValueToBroadcast(key1, key2, messageCopy.charCodeAt(0));
      messageCopy = messageCopy.substr(1);
    } else {
      currentRound.valueToServer =
        this.calculateOppositeValueToBroadcast(key1, key2, 0);
    }

    sendParticipantCommunicationRoundResponse(currentRound.valueToServer);

    this.setState({
      events: tempEvents,
      messageCopy,
    });
  }

  calculateXORValueToBroadcast(key1, key2, participantChoice) {
    return key1 ^ key2 ^ participantChoice;
  }

  calculateOppositeValueToBroadcast(key1, key2, participantChoice) {
    return key1 ^ key2 ^ participantChoice;
  }

  resetReconnection() {
    this.setState({
      events: [],
      roundNumber: 1,
      showMessageDialog: false,
      showDiagol: false,
      amISender: false,
      message: '',
      messagePointer: 0,
      messageLength: 0,
      messageKeys: [],
    });
  }

  resetEndOfRound() {
    this.setState({
      amISender: false,
      message: '',
      messagePointer: 0,
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
          secondsToStart={this.state.secondsToStart}
          leftToWait={this.state.leftToWait}
        />
        <div className="app-body">
        <button onClick={debugBackEnd}>debug</button>
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
              saveMessageInput={this.saveMessageInput}
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
