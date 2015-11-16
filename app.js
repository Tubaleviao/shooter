var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io')(server);
var code = require('./code');

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
	res.render('index.ejs');
});

io.on('connection', code.code);

server.listen(3000, function(){
	console.log('Running at 3000');
});
