require('./server.babel');
const path = require('path');
const http = require('http');
const fs = require('fs');
const express = require('express');
const webpack = require('webpack');
const ioServer = require('./lib/chat-server.js');
const normalizePort = require('normalize-port');
var app = express();

// function credit to https://stackoverflow.com/a/31144924/3245486
function requireHTTPS(req, res, next) {
  // The 'x-forwarded-proto' check is for Heroku
  if (!req.secure && req.get('x-forwarded-proto') !== 'https' && process.env.NODE_ENV !== "development") {
    return res.redirect('https://' + req.get('host') + req.url);
  }
  // allow next incoming requests
  next();
}

// NOTE: when you import stuff, assume that they are visibile and omit src/ in the path
app.use(express.static('public'));

if (process.env.NODE_ENV !== 'production') {
  var config = require('./webpack.config');
  var compiler = webpack(config);
  app.use(require('webpack-dev-middleware')(compiler, {
    noInfo: true,
    publicPath: config.output.publicPath
  }));
  app.use(require('webpack-hot-middleware')(compiler));
} else {
  var config = require('./webpack.prod.config');
  var compiler = webpack(config);
}

if(process.env.NODE_ENV === 'production') {
  app.use(requireHTTPS);
}

const server = new http.Server(app);

ioServer.listen(server);

const index = fs.readFileSync('./index.html', {
  encoding: 'utf-8'
});
const str = index;

app.get('*', function(req, res) {
  res.status(200).send(str);
});

app.get('*', function(req, res) {
  res.status(404).send('Server.js > 404 - Page Not Found');
});

app.use((err, req, res, next) => {
  res.status(500).send("Server error");
});

process.on('uncaughtException', evt => {
  console.log('uncaughtException ', evt);
});

const port = normalizePort(process.env.PORT || '9000');
server.listen(port, (err) => {
  if (err) {
    console.error(err);
  }
  console.info(`Application open on port ${port}`);
});
