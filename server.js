require('./server.babel');
const path = require('path');
const http = require('http');
const fs = require('fs');
const express = require('express');
const webpack = require('webpack');
const ioServer = require('./lib/chat-server.js');
const normalizePort = require('normalize-port');

global.__DEVELOPMENT__ = process.env.NODE_ENV !== 'production';

var app = express();

// NOTE: when you import stuff, assume that they are visibile and omit src/ in the path
app.use(express.static('src'));

if (__DEVELOPMENT__) {
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
  console.error("Error on request %s %s", req.method, req.url);
  console.error(err.stack);
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
  console.info('==> 💻  Open http://%s:%s in a browser to view the app.', 'localhost', '9000');
});
