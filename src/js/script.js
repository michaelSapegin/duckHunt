'use strict';

require('../styles/loader.css');
require('../styles/style.css');

var $ = require('jquery');



// параметры игры на разных уровнях
const LEVELS = [
	{ //1
		waves: 3, // количество волн
		ducks: 2, // количество уток в каждой волне
		minSpeed: 25, // минимальная скорость уток
		maxSpeed: 35, // максимальная скорость
		bullets: 4,
		time: 10
	},
	{ //2
		waves: 3,
		ducks: 3,
		minSpeed: 35,
		maxSpeed: 45,
		bullets: 5,
		time: 12
	},
	{ //3
		waves: 1,
		ducks: 10,
		minSpeed: 25,
		maxSpeed: 55,
		bullets: 15,
		time: 30
	},
];

// объект с параметрами текущего состояния 
const gameStat = {
	isStarted: false,
	isEnded: false,
	dogState: 0,
	currentLevel: 1,
	currentWave: 1,
	score: 0,
	bullets: 0,
	timer: 0
};

var ducks = [];
var booty = 0;

window.onload = function() {

	var userAg = navigator.userAgent;
	if (userAg.indexOf("Trident") > -1) {
		$('body').append('<div class="disclaimer">Sorry, this browser is not supported.' +
		 				'<br> Please use modern version</div>');
	}

	$('.btnExit').click( function() { // плавно скрываем содержимое и закрываем вкладку
		$('body').css('background-color', '#000'); 
		$('.container').fadeOut(2000);
		$('.menu').fadeOut(500);
		$('.banner').fadeOut(500);
		setTimeout( function() { 
			window.close();
		}, 2000);
	});

	$('.btnStart').click( function() { // стартуем игру
		$('.menu').fadeOut(500);
		$('.banner').fadeOut(500);
		$('.board').fadeIn(500);
		initGame(0);
	});

	$('.loader').fadeOut(500).remove(); // прячем окно загрузки
	$('.container').fadeIn(1500); // отображаем основное окно
	setTimeout ( function () {
		$('.menu').fadeIn(1500);
		$('.banner').fadeIn(1500);
		}, 2000); // отображаем основное окно

	// main loop ###########################################################
	setInterval( function() {
		if ( gameStat.isStarted ) {
			if ( gameStat.dogState === 2 ) {
				gameStat.dogState = 3; // jumping
				$('.dog').addClass('dog-jump').removeClass('dog-walk')
				.css({
					'transition': 'all 0s linear 0s'
				});
				setTimeout( function (){
					gameStat.dogState = 4; // hide dog
					$('.dog').hide(0);
					$('body').mousedown( clickDuck );
					$('*').css({
						cursor: "crosshair"
					});
					 // $('body').unbind('click', clickDuck) - для удаления
				}, 800);
			}

			if (gameStat.dogState > 3){ // собака в траве - утки летают
				
				let isAnyDuckFly = false;
				let ducksCount;

				ducksCount = 0;

				for (let i = 0; i < LEVELS[gameStat.currentLevel - 1].ducks; i++) {
					if ( ducks[i].state == 0 ) { //взлетаем
						ducks[i].state = 1;

						let x = parseInt (ducks[i].left);
						let y = parseInt (ducks[i].top);
						let tx = parseInt (ducks[i].targetX);
						let ty = parseInt (ducks[i].targetY);

						let timer = Math.round(
										Math.sqrt( (x - tx) * (x - tx) + 
										(y - ty)  * (y - ty) ) / ducks[i].speed * 100) / 100;

						$('.duck[data-number='+i+']').css({
							transition: 'top '+ timer + 's linear, left ' + timer + 's linear',
							left: ducks[i].targetX,
							top: ducks[i].targetY
						})

						isAnyDuckFly = true;
					}

					if ( ducks[i].state == 1 ) { // летаем

						let x = parseInt ( $('.duck[data-number='+i+']').css('left'));
						let y = parseInt ( $('.duck[data-number='+i+']').css('top'));
						let bodyWidth = parseInt ( $('body').css('width'));
						let bodyHeight = parseInt ( $('body').css('height'));
						let tx = bodyWidth * parseInt (ducks[i].targetX) / 100;
						let ty = bodyHeight * parseInt (ducks[i].targetY) / 100;

						if (( Math.abs(x - tx) < 5 ) || ( Math.abs(y - ty) < 5 )) { // разворот
							let coords = {
								x: Math.round (x / bodyWidth * 100), // x-координата утки
								y: Math.round (y / bodyHeight * 100),
								tx: ducks[i].targetX, // координаты точки, куда она полетит.
								ty: ducks[i].targetY, // анимацию сделает transition
								angle: ducks[i].angle // угол направления утки для выбора спрайта
							}
	
							setNewPoint (coords);

							ducks[i].left = coords.x + 'vw';
							ducks[i].top = coords.y + 'vh';
							ducks[i].targetX = coords.tx + 'vw';
							ducks[i].targetY = coords.ty + 'vh';
							ducks[i].angle = coords.angle;

							let timer = Math.round(
										Math.sqrt( (coords.x - coords.tx) * (coords.x - coords.tx) + 
													(coords.y - coords.ty)  * (coords.y - coords.ty) ) 
										/ ducks[i].speed * 100 ) / 100;

							$('.duck[data-number='+i+']').removeClass().addClass('duck').
								addClass( getDuckPicture(coords.angle, 1) ).css({
								transition: 'top '+ timer + 's linear, left ' + timer + 's linear',
								left: ducks[i].targetX,
								top: ducks[i].targetY
							});
						} // развернулись

						isAnyDuckFly = true;
						ducksCount++;
					}

					if ( ducks[i].state == 2 ) { // подбиты
						let x = parseInt ( $('.duck[data-number=' + i + ']').css('left') );
						let y = parseInt ( $('.duck[data-number=' + i + ']').css('top') );

						$('.duck[data-number=' + i + ']').removeClass().addClass('duck').
								addClass( getDuckPicture(ducks[i].angle, 2) ).css({
								transition: 'none',
								left: x,
								top: y,
							});

						$('<div class="feather" data-number = "' + i + '"></div>').appendTo('.sky').css({
							left: x,
							top: y
						});

						setTimeout( function (){ // надо будет удалить перья после отрисовки
							$('.feather[data-number=' + i + ']').remove();								
						}, 1800, i);							
						
						setTimeout( function (){
							
							let y = parseInt ( $('.duck[data-number='+i+']').css('top'));
							let bodyHeight = parseInt ( $('body').css('height'));
							y = y / bodyHeight * 100;
							let timer = Math.round( (70 - y) / 0.5 ) / 100;

							$('.duck[data-number=' + i + ']').removeClass().addClass('duck').
								addClass( getDuckPicture(ducks[i].angle, 3) ).css({
								transition: 'top ' + timer + 's ease-in',
								top: '70vh'
							});

							gameStat.score += 11;
							showScore();

						}, 150, i);

						ducks[i].state = 3;

						isAnyDuckFly = true;
					}

					if ( ducks[i].state == 3 ) { // анимация подбитой утки, просто ждем падения 
						let y = parseInt ( $('.duck[data-number='+i+']').css('top'));
						let bodyHeight = parseInt ( $('body').css('height'));
						y = y / bodyHeight * 100;
						if ( y > 65 ) { // утка упала
							ducks[i].state = 4;
						}
						isAnyDuckFly = true;
					}

					if ( ducks[i].state == 4 ) { // утка упала, собака покажет
						
						$('.duck[data-number=' + i + ']').remove();
						ducks[i].state = 5;
						booty++;
					}

				} // end loop for ducks
				
				if ( (booty > 0) && (gameStat.dogState == 4) ) {
					gameStat.dogState = 5; 
					if ( booty > 1 ) {
						dogShow(2);
						// booty -= 2;
					} else {
						dogShow(1);
						// booty--;
					}
				}

				if ( ducksCount == 0  || gameStat.bullets == 0) {
					$('.stat-board span').css({
						'animation-play-state': 'paused'
					});
				}

				if ( ( ducksCount > 0 && gameStat.bullets == 0 ) || 
					( $('.stat-board span').outerWidth() < 3 ) ){
					gameEnd ('lose');
					gameStat.isEnded = true;
				}

				if ( !isAnyDuckFly && booty == 0 && !gameStat.isEnded ) { // all ducks hitted & showed

					if (gameStat.currentWave < LEVELS[gameStat.currentLevel - 1].waves) {
						gameStat.currentWave++;
					} else {
						gameStat.currentWave = 1;
						gameStat.currentLevel++;
					}
					initGame( gameStat.currentLevel );
					if ( gameStat.isEnded ) gameEnd ('win');
				}

			} // end if dog in grass
		} // end if game is started

	}, 50);  // end of main loop ###########################################
		
// transition для движения собаки
}

function dogShow(num) {
	if ( num > 0 ) {
		$('.dog').removeClass().addClass('dog dog-show');
		if ( num == 2 ) {
			$('.dog').addClass('dog-show2');
		};
		$('.dog').show(0);
		setTimeout( function () {
			$('.dog').hide(0);
			gameStat.dogState = 4;
			booty -= num;
		}, 2000, num);
	} else {
		$('.dog').removeClass().addClass('dog dog-laughs');
		$('.dog').show(0);
		setTimeout( function () {
			$('.dog').hide(0);
			gameStat.dogState = 4;
		}, 2000);
	}
}

function initGame (level) {
	$('body').unbind('mousedown', clickDuck);
	$('*').css({
		cursor: "default"
	});

	if ( level == 0 ) {
		gameStat.currentLevel = 1;
		gameStat.currentWave = 1;
		gameStat.score = 0;
	}

	if ( LEVELS.length < gameStat.currentLevel) {
		gameStat.isEnded = true;
		return;
	} 

	gameStat.isStarted = true;
	gameStat.isEnded = false;
	gameStat.dogState = 1; // walking

	showScore();

	$('.duck').remove();
	ducks.length = 0;
	booty = 0;
	
	for (let i = 0; i < LEVELS[gameStat.currentLevel - 1].ducks; i++) {
		let coords = {
			x: Math.round( 10 + 74 * Math.random() ), // x-координата утки
			y: 70,
			tx: 0, ty: 0,  // координаты точки, куда она полетит. анимацию сделает transition
			angle: 0 // угол направления утки
		}
		
		setNewPoint (coords);

		let duck = {
			number: i,
			left: coords.x + 'vw',
			top: '70vh',
			targetX: coords.tx + 'vw',
			targetY: coords.ty + 'vh',
			state: 0, // 0 - готова взлететь, 1 - летает, 
			 		  // 2 - подбита (надо менять спрайт и добавлять перья)
			 		  // 3 - идет анимация подбитой утки
			 		  // 4 - утка упала
			 		  // 5 - утка пропала
			angle: coords.angle,
			speed: LEVELS[gameStat.currentLevel - 1].minSpeed + 
				( LEVELS[gameStat.currentLevel - 1].maxSpeed - 
				LEVELS[gameStat.currentLevel - 1].minSpeed ) * Math.random()
		}
		ducks.push( duck );
		
		$('<div class="duck ' + getDuckPicture(duck.angle, 1) + '" data-number = "' + i + '"></div>').appendTo('.sky').css({
			left: duck.left,
			top: duck.top,
		});
	}

	$('.dog').removeClass().addClass('dog dog-walk');
	$('.dog').css({
		transition: 'none',
		left: "-13vw",
		bottom: "5vh"
	}).show(0);
	$('.dog').css({
		'transition': 'left 3s linear 1s',
		'left': '45vw'
	});

	setTimeout (function () {
		gameStat.dogState = 2; // ready to jump
	}, 4000);
	$('.stat-board i').remove();
	for (let i = 0; i < LEVELS[gameStat.currentLevel - 1].bullets; i++) {
		$('.stat-board p').append('<i></i>');
	}
	gameStat.bullets = LEVELS[gameStat.currentLevel - 1].bullets;
	gameStat.timer = LEVELS[gameStat.currentLevel - 1].time;
	$('.stat-board span').remove();
	$('<span></span>').appendTo('.stat-board').css({
		animation: 'timer ' + gameStat.timer + 's linear 5s 1 forwards',
		'animation-play-state': 'running'
	});
	
}

function getDuckPicture (angle, state) {
	let res = '';
	if ( state == 1 ) {
		if ( angle > 0 ){
			if ( angle < 60 ) {
				res = 'duck-ne';
			} else {
			
			if ( angle < 120 ) {
				res = 'duck-e';
			
			} 
			else res = 'duck-se';
			
			}
		} else {
			if ( angle > -60 ) {
				res = 'duck-nw';
			} else {
			
			if ( angle > -120 ) {
				res = 'duck-w';
			
			} else res = 'duck-sw';
		}}
	}
	if ( state == 2 ) {
		if ( angle < 0 ) {
			res = 'duck-h-w';			
		}
		else {
			res = 'duck-h-e';
		}
	}
	if ( state == 3 ) {
		if ( angle < 0 ) {
			res = 'duck-f-w';			
		}
		else {
			res = 'duck-f-e';
		}
	}

	return res;
}

function showScore () {
	$('.score-board').html ('Score: ' + gameStat.score + '<br> Level: '+
		gameStat.currentLevel + ' Wave '+ gameStat.currentWave + '/' + 
		LEVELS[gameStat.currentLevel - 1].waves);
}

function clickDuck (event) {
	if (gameStat.bullets > 0) {
		$('body').append('<audio src="./snd/boom1.wav" autoplay></audio>');
		setTimeout( function () {
			$('audio').remove();
		}, 1400);
		$('.stat-board i')[0].remove();
		gameStat.bullets--;
		gameStat.score--;
		showScore();

		for (let i = 0; i < LEVELS[gameStat.currentLevel - 1].ducks; i++) {
			if (ducks[i].state === 1) {
				let x1 = parseInt ( $('.duck[data-number=' + i + ']').css('left'));
				let y1 = parseInt ( $('.duck[data-number=' + i + ']').css('top'));
				let x2 = x1 + parseInt ( $('.duck[data-number=' + i + ']').css('width'));
				let y2 = y1 + parseInt ( $('.duck[data-number=' + i + ']').css('height'));
				if ((event.pageX > x1) && (event.pageX < x2) 
					&& (event.pageY > y1) && (event.pageY < y2) ) {
					ducks[i].state = 2;
				}
			}
		}
	}
}

function setNewPoint (coords) {
	if (coords.angle == 0) {
		coords.angle = 100 + 160 * Math.random();
		if ( coords.angle > 180 ) coords.angle -= 360;
	}

	let flag = ( Math.random() > 0.5 ) ? true : false;

	if ( Math.round(coords.y) < 10 ) { // отскок от верхней грани
		if ( coords.angle < 0 ) {
			if (flag) {
				coords.tx = 0;
				coords.ty = 10 + 50 * Math.random();
			} else {
				coords.tx = coords.x * 0.9 * Math.random();
				coords.ty = 70;
			}
			// coords.angle -= aDelta;
		} else {
			if (flag) {
				coords.tx = 94;
				coords.ty = 10 + 50 * Math.random();
			} else {
				coords.tx = coords.x + 10 + (80 - coords.x) * Math.random();
				coords.ty = 70;
			}
			// coords.angle += aDelta;
		}
	}

	if ( Math.round(coords.y) > 60 ) { // отскок от нижней грани
		if ( coords.angle < 0 ) {
			if (flag) {
				coords.tx = 0;
				coords.ty = 60 * Math.random();
			} else {
				coords.tx = coords.x * 0.9 * Math.random();
				coords.ty = 0;
			}
			// coords.angle -= aDelta;
		} else {
			if (flag) {
				coords.tx = 94;
				coords.ty = 60 * Math.random();
			} else {
				coords.tx = coords.x + 10 + (80 - coords.x) * Math.random();
				coords.ty = 0;
			}
			// coords.angle += aDelta;
		}
	}

	if ( Math.round(coords.x) < 10 ) { // отскок от левой грани
		if ( coords.angle > -90 ) {
			if (flag) {
				coords.tx = 94;
				coords.ty = coords.y * 0.9 * Math.random();
			} else {
				coords.tx = 10 + 80 * Math.random();
				coords.ty = 0;
			}
			// coords.angle += aDelta;

		} else {
			if (flag) {
				coords.tx = 94;
				coords.ty = coords.y + 10 + (50 - coords.y) * Math.random();
			} else {
				coords.tx = 10 + 80 * Math.random();
				coords.ty = 70;
			}
			// coords.angle -= aDelta;
		}	
	}

	if ( Math.round(coords.x) > 90 ) {
		if ( coords.angle < 90 ) {
			if (flag) {
				coords.tx = 0;
				coords.ty = coords.y * 0.9 * Math.random();
			} else {
				coords.tx = 10 + 80 * Math.random();
				coords.ty = 0;
			}
			// coords.angle += aDelta;

		} else {
			if (flag) {
				coords.tx = 0;
				coords.ty = coords.y + 10 + (50 - coords.y) * Math.random();
			} else {
				coords.tx = 10 + 80 * Math.random();
				coords.ty = 70;
			}
			// coords.angle -= aDelta;
		}
	}

	coords.angle = Math.atan2( (coords.tx - coords.x), (coords.y - coords.ty) ) / Math.PI * 180;
}

function gameEnd (stat) {
	$('*').css({
		cursor: "default"
	});
	if (stat === 'win') {
		$('.menu').fadeIn(3000);
		$('.banner').removeClass('banner-lose').addClass('banner-win').
			text('You win!').fadeIn(1000);
		gameStat.isStarted = false;

	} else {
		if ( (booty === 0) && (gameStat.dogState == 4) ) {
			gameStat.dogState = 6;
			dogShow(0);

			$('.menu').fadeIn(5000);
			$('.banner').addClass('banner-lose').removeClass('banner-win').
				text('You lose!').fadeIn(1000);
			gameStat.isStarted = false;
		}
	}
}