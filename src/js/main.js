import React from 'react';
import ReactDOM from 'react-dom';
import AppComponent from './Components/AppComponent/AppComponent';

// load the stylesheet
require('../styles/main.scss');

ReactDOM.render(
  <AppComponent />, document.getElementById('main')
);
