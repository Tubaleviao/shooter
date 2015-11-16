var players = [];

exports.code = function(socket){
	
	socket.on('turn', function(data){
		socket.broadcast.emit('turn', data);
	});

	socket.on('addPlayer', function(data){
		players.push({name: data.name});
		socket.broadcast.emit('oldPlayers', data);
		socket.broadcast.emit('addPlayer', data);
	});

	socket.on('oldPlayer', function(data){
		socket.broadcast.emit('loadPlayers', data);
	});

	socket.on('shoot', function(data){
		socket.broadcast.emit('shoot', data);
	});

	socket.on('setPosition', function(data){
		socket.broadcast.emit('setPosition', data);
	});

	socket.on('kill', function(data){
		socket.broadcast.emit('kill', data);
	});
}
