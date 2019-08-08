var http = require('http');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var socket_io = require('socket.io');

var app = express();

var server = http.createServer(app);
var io = socket_io.listen(server);

app.io = io;

var SERVER_PORT = 8004;

/*Backend*/
var backEnd = require('./backend');
backEnd.loadData();

/*Routes*/
var routes = require('./routes/index');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(routes);

app.use(function(req, res, next) {
  res.status(404);
  res.render('error', {error: 'Page not found!'});
});

io.on("connection", function(socket){
  backEnd.handleSocket(socket);
});


server.listen(SERVER_PORT, () => console.log('Explore.moe waiting for requests on port ' + SERVER_PORT));


module.exports = app;
