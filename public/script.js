$(function(){

	var $window = $(window);
	var socket = io();
	var up=[], down=[], left=[], right=[];
	var pressed = [];
	var me = 'p1';
	var shooted = 0;
	var mouse = {};
	var life = 5;

	// Game over code

	socket.on('kill', function(data){
		$('#'+data.player).remove();
	});

	// Shooter code

	function getShootPoint(player, x, y, hipo){
		var cat_op, cat_ad, left, top;
		var matrix = $('#'+player).css('transform');
		var values = matrix.split('(')[1].split(')')[0].split(',');
        var a = values[0];
        var b = values[1];
        var angle = Math.round(Math.atan2(b, a) * (180/Math.PI));

		cat_op = Math.floor(Math.sin(Math.PI/180 * angle) * hipo);
		cat_ad = Math.floor(Math.sqrt(Math.pow(hipo, 2) - Math.pow(cat_op, 2)));

		if(angle > 90 || angle < -90){
			left = x - cat_ad;
		}else{
			left = x + cat_ad;
		}
		top = y + cat_op;
		return {left: left, top: top};
	}

	function fire(shooter, id, start, end, time){
		var $bullet = $('<div>').addClass('bullet').attr('id', id);
		$('body').append($bullet);

		$('#'+id).offset(start).each(function(){
			$(this).css('transform', $('#'+shooter).css('transform'));
			$(this).animate({
				left: end.left,
				top: end.top
			}, {duration: time, step: function(now, fx){
				if(shooter == me){
					var all = $('.player').overlaps($('.bullet'));
					if(all.hits.length){
						$(this).remove();
					}
				}else{
					if($('#'+me).length){
						var mehit = $(this).overlaps($('#'+me));
						if(mehit.hits.length){
							if(life>0){
								life -= 1;
								$('#log').text('Vidas: '+life);
							}else{
								$('#'+me).remove();
								$('.logout').show();
								socket.emit('kill', {player: me});
							}
							$(this).remove();
						}
					}
				}
			}, complete: function(){
				$(this).remove();
			}});
		});
	}

	$('body').on('click', function(event){
		var p = $('#'+me).position();
		var b_start = getShootPoint(me, p.left, p.top, 30);
		var b_end = getShootPoint(me, p.left, p.top, 500);
		var id = me+shooted;
		var time = 300;

		fire(me, id, b_start, b_end, time);

		var data = {shooter : me, bullet: id, start: b_start, end: b_end, time: time};
		socket.emit('shoot', data);
		shooted += 1;
	});

	socket.on('shoot', function(data){

		fire(data.shooter, data.bullet, data.start, data.end, data.time);
	});

	// Login and startup code

	$('#player').focus();

	function getNewPosition(){
		return {top: Math.floor(768*Math.random()), left: Math.floor(Math.random()*1366)};
	}

	function putPlayer(player, position){
		var $player = $('<div>').addClass('player')
						.attr('id', player)
						.append(player);
			$('body').append($player);
			$('#'+player).offset(position);
	}

	$('#player').keydown(function(event){
		if(event.which == 13 && $('#player').val() != ''){
			me = $('#player').val();
			var p = getNewPosition();
			putPlayer(me, p);
			socket.emit('addPlayer', {name: me, position: p});
			$('.login').hide();
			$('#p1').hide();
		}
	});

	socket.on('addPlayer', function(data){
		putPlayer(data.name, data.position);
	});

	socket.on('oldPlayers', function(data){
		data.old_name = me;
		data.old_position = $('#'+me).position();
		socket.emit('oldPlayer', data);
	});

	socket.on('loadPlayers', function(data){
		var $player = $('<div>').addClass('player')
						.attr('id', data.old_name)
						.append(data.old_name);
		$('body').append($player);
		$('#'+data.old_name).offset(data.old_position);
	});

	// Player rotation code
	
	function getDegree(x1, y1, x2, y2){
		var dx = x2 - x1;
		var dy = y2 - y1;
		return Math.atan2(dx,  dy) / Math.PI * 180;
	}

	function turn(player){
		var p = $('#'+player).position();
		var deg = getDegree(p.left, mouse.y, mouse.x, p.top)-90;
		$('#'+me).css('transform', 'rotate('+deg+'deg)');
		socket.emit('turn', {player: player, degree: deg});
	}

	$(document).on('mousemove', function(event){
		mouse.x = event.pageX;
		mouse.y = event.pageY;
		turn(me);
	});

	socket.on('turn', function(data){
		$('#'+data.player).css('transform', 'rotate('+data.degree+'deg)');
	});

	// Player movement code

	$window.keydown(function(event){
		turn(me);
		if(event.which == 87){ // up
			if(!pressed[87]){
				up.push(me);
				pressed[87] = true;
			}
		}else if (event.which == 83){ // down
			if(!pressed[83]){
				down.push(me);
				pressed[83] = true;
			}
		}else if (event.which == 65){ // left
			if(!pressed[65]){
				left.push(me);
				pressed[65] = true;
			}
		}else if (event.which == 68){ // right
			if(!pressed[68]){
				right.push(me);
				pressed[68] = true;
			}
		}
	});

	$window.keyup(function(event){
		if(event.which == 87){ // up
			if(up.indexOf(me)>=0){
				up.splice(up.indexOf(me), 1);
			}
			pressed[87] = false;
		}else if (event.which == 83){ // down
			if(down.indexOf(me)>=0){
				down.splice(down.indexOf(me), 1);
			}
			pressed[83] = false;
		}else if (event.which == 65){ // left
			if(left.indexOf(me)>=0){
				left.splice(left.indexOf(me), 1);
			}
			pressed[65] = false;
		}else if (event.which == 68){ // right
			if(right.indexOf(me)>=0){
				right.splice(right.indexOf(me), 1);
			}
			pressed[68] = false;
		}
	});
	
	function move(){
		up.forEach(function(pl){
			var p = $('#'+pl).offset();
			$('#'+pl).offset({top: p.top-1});
			socket.emit('setPosition', {player: me, pos: p});
		});
		down.forEach(function(pl){
			var p = $('#'+pl).offset();
			$('#'+pl).offset({top: p.top+1});
			socket.emit('setPosition', {player: me, pos: p});
		});
		left.forEach(function(pl){
			var p = $('#'+pl).offset();
			$('#'+pl).offset({left: p.left-1});
			socket.emit('setPosition', {player: me, pos: p});
		});
		right.forEach(function(pl){
			var p = $('#'+pl).offset();
			$('#'+pl).offset({left: p.left+1});
			socket.emit('setPosition', {player: me, pos: p});
		});
	}

	socket.on('setPosition', function(data){
		$('#'+data.player).offset(data.pos);
	});

	window.setInterval(move, 1);

});
