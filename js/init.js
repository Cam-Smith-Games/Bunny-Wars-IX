// ----------------------- INTIALIZING VARIABLES ----------------------- //

//turning sound on if soundEnabled hasn't already been set this session
if(sessionStorage.getItem('soundEnabled') != 'false')
	sessionStorage.setItem('soundEnabled', 'true');

//fps variables
var frames = 0;
var previousFrames = 0;
var fps = 0;
//intervals for different game states
var loadingScreenInterval, startScreenInterval, gameInterval;

var loadingtimer=0;
var numObjectsLoaded = 0;

var developerMode = false;

// keeping track of which level player is on
var currentLevel;
var settingLevel = false;

//lists to store things
var spriteList = [];
var tileList = [];
var animationList = [];

//animation constants
var LOOP = true;
var NO_LOOP = false;

//keycode constants
var K_SPACE = 32, K_E = 69;
var K_LEFT = 37, K_UP = 38, K_RIGHT = 39, K_DOWN = 40; 
var K_W = 87, K_A = 65, K_S = 83, K_D = 68;
var K_SHIFT = 16; K_TILDA = 192; K_ENTER = 13;

//array of keys currently pressed
var keyPressed = [];
var tildaPressed = false;

// since camera follows player, need offset from center of screen to players position
var xOffset, yOffset;

// ----------------------- END INTIALIZING VARIABLES ----------------------- //

//create main canvas
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 1920;
canvas.height = 1080;
//create overlay canvas 
var canvas2 = document.getElementById("canvas2");
var ctx2 = canvas2.getContext("2d");
canvas2.width = 1920;
canvas2.height = 1080;


//function to simplify creating images and increment loaded elements
function newImage(src) {
	var temp = new Image();
	temp.src = src;
	temp.onload = function() {
		numObjectsLoaded++;
		//console.log(numObjectsLoaded);
	}
	return temp;
}
//function to simplify creating audio with volume and increment loaded elements
function newAudio(src, volume) {
	var temp = new Audio(src);
	temp.volume = volume;
	temp.oncanplaythrough = function() {
		numObjectsLoaded++;
		//console.log(numObjectsLoaded);
	}
	return temp;
}

//function to play audio only if sound is enabled
function playAudio(sound) {
	if(sessionStorage.getItem('soundEnabled') == 'true') {
		sound.load();
		sound.play();
	}
}
//function to play audio only if sound is enabled, doesn't load() so it will loop
function loopAudio(sound) {
	if(sessionStorage.getItem('soundEnabled') == 'true') {
		sound.play();
	}
}

// ---------- MUTE/UNMUTE BUTTONS ---------- //
var muteButton = document.getElementById("mute");
var unmuteButton = document.getElementById("unmute");

var buttonSize = window.innerWidth * 0.03 + 'px';
var buttonLeft = window.innerWidth * 0.01 + 'px';
muteButton.style.height = muteButton.style.width = unmuteButton.style.height = unmuteButton.style.width = buttonSize;
muteButton.style.backgroundSize = muteButton.style.backgroundSize = unmuteButton.style.backgroundSize = unmuteButton.style.backgroundSize = buttonSize+' '+buttonSize;
muteButton.style.left = unmuteButton.style.left = buttonLeft;


function mute() {
	console.log('muting');
    sessionStorage.setItem('soundEnabled', 'false');
    muteButton.style.visibility = 'hidden';
    unmuteButton.style.visibility = 'visible';
}
function unmute() {
	sessionStorage.setItem('soundEnabled', 'true');
    muteButton.style.visibility = 'visible';
    unmuteButton.style.visibility = 'hidden';
}

// -------------------- LOADING IMAGES -------------------- //
var startIMG = newImage('img/title.png');
var spriteSheet1 = newImage('img/player.png');
var slimeSheet = newImage('slime.png');
var floppitSheet = newImage('img/floppit.png');
var zombieSheet = newImage('img/zombies/zombie.png');
var coinSheet = newImage('img/coins.png');
var bgIMG = newImage('img/backgrounds/bg.png');
var carrotIMG = newImage('img/carrot.png')
var healthbarFrame = newImage('img/healthbar.png');
var healthbarFill = newImage('img/healthbar2.png');
var mountain1 = newImage('img/backgrounds/mountain1.png');
var mountain2 = newImage('img/backgrounds/mountain2.png');
var trees1 = newImage('img/backgrounds/trees1.png');
var trees2 = newImage('img/backgrounds/trees2.png');
var heartIMG = newImage('img/heart.png');
//loading grass tile images
for(i=1; i<18; i++) {
	window['grass'+i] = newImage('img/tiles/grassland/'+i+'.png');
}
var ladder = newImage('img/tiles/grassland/ladder.png');

// -------------------- LOADING AUDIO -------------------- //
var swish = newAudio('audio/swish.ogg', 1);
var explosion = newAudio('audio/yd/explode.ogg', 1);
var jingle = newAudio('audio/little robot sound factory/jingle.ogg', 1);
var jingleLose = newAudio('audio/little robot sound factory/jingle lose.ogg', 0.5);
var sonicSound = newAudio('audio/sonic.ogg', 0.5);
var jumpSound = newAudio('audio/little robot sound factory/jump.wav', 0.25);
var doubleJumpSound = newAudio('audio/little robot sound factory/doublejump.wav', 0.25);
var ladderSound = newAudio('audio/yd/ladder.ogg', 1);
var stepSound = newAudio('audio/step.ogg', 0.75);
var coinSound = newAudio('audio/coin.wav', 0.5);
var zombieSounds = [];
for(var i=0; i<24; i++) {
	var number = i+1;
	var sound = newAudio('audio/zombies/zombie-'+number+'.ogg', 0.25);
	zombieSounds.push(sound);
}





//Vector class for positions, velocities, and accelerations
function Vector(x, y) {
	this.x = x;
	this.y = y;
	//funciton to add another vector to this vector
	this.addVector = function(vector2) {
		this.x += vector2.x;
		this.y += vector2.y;
	};
	//function to add x/y to this vectors x/y
	this.add = function(x, y) {
		this.x += x;
		this.y += y
	}
}

//gravity acceleration vector
var gravityVector = new Vector(0, 1.2);
//jump acceleration vector
var jumpVector = new Vector(0, -2);

//----------------------------------------------------------------------------------------------
//	loadingScreen function
//		draws out % and number of objects loaded, doesn't start game until everything is loaded
//		only happens if game hasn't already been loaded this session
//----------------------------------------------------------------------------------------------
function loadingScreen() {
	loadingtimer++;
	ctx.fillStyle = 'black';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = 'white';
	ctx.font = '60px feasfbrg';
	ctx.textAlign = 'center';
	ctx.fillText('loading...', canvas.width/2, canvas.height/2);
	ctx.fillText('objects loaded: ' + numObjectsLoaded, canvas.width/2, canvas.height/2+200);
	ctx.fillText(Math.floor(numObjectsLoaded/65*100) + ' %', canvas.width/2, canvas.height/2 + 100);
	//once everythings been loaded (currently 65 audio and image files)
	if(numObjectsLoaded >= 65 && loadingtimer >= 50) {
		//go to start screen
		startScreenInterval = window.setInterval(function() {
			startScreen();
		}, 1000/30);
		//stop loading 
		window.clearInterval(loadingScreenInterval);
		sessionStorage.setItem('loaded', 'true');
	}
}

//------------------------------------------------------------------------------
//	startScreen function
//		draws parallax background and sets players velocity to move it
//		draws title image over background
//		waits for user to press enter to start game
//		only happens if game hasn't already started this session
//------------------------------------------------------------------------------
var opacity = 0; fadingIn = true;
function startScreen() {
	ctx.save();
	xOffset = canvas.width/2 - player.position.x - player.width/2;
	yOffset = canvas.height/2 - player.position.y - player.height/2;
	ctx.translate(xOffset, yOffset);
	ctx.clearRect(-xOffset, -yOffset, canvas.width, canvas.height);
	ctx.drawImage(bgIMG, -xOffset, -yOffset, canvas.width, canvas.height);
	// setting players velocity to make background move, since sprite mover function isnt getting called
	// need to update x as well (velocity is doing nothing but making background move, not moving player)
	player.velocity.x = -5;
	player.position.x -= 5;
	backgroundParallax();
	ctx.drawImage(startIMG, -xOffset, -yOffset, canvas.width, canvas.height);
	if(opacity <= 0)
		fadingIn = true;
	if(opacity >= 1)
		fadingIn = false;
	//drawing 'press enter to continue'
	if(opacity<1 && fadingIn)
		opacity+=0.04;
	else if (opacity > 0 && !fadingIn)
		opacity-=0.04;
	ctx.textAlign = 'center';
	ctx.font = '60px feasfbrg';
	ctx.fillStyle = 'rgba(250, 250, 250, ' + opacity + ')';
	ctx.fillText('press enter to continue', -xOffset+canvas.width/2, -yOffset+canvas.height/2+150);
	
	// press enter to start game, stop startScreening
	if(keyPressed[K_ENTER]) {
		sessionStorage.setItem('gameStarted', 'true');
		gameInterval = window.setInterval(function(){
			game();
		}, 1000/50);
		//running hud updater 1/5th speed of game
		hudInterval = window.setInterval(function(){
			hudUpdater();
		}, 1000/10);
		window.clearInterval(startScreenInterval);
	}
	ctx.restore();

}

// ----------------------------- SETTING INTERVALS TO START GAME ----------------------------- //

//opening for first time (hasn't loaded), show loading screen
if(sessionStorage.getItem('loaded') != 'true') {
	//go to loading screen 
	loadingScreenInterval = window.setInterval(function(){
		loadingScreen();
	}, 1000/30);
}
//if already loaded and game hasn't started, go to start screen
else if(sessionStorage.getItem('gameStarted') != 'true') {
	//go to start screen
	startScreenInterval = window.setInterval(function() {
		startScreen();
	}, 1000/30);
}
//if game already loaded and game already started, just start game again (refresh)
else {
	gameInterval = window.setInterval(function(){
			game();
	}, 1000/50);
	//running hud updater 1/5th speed of game
	hudInterval = window.setInterval(function(){
		hudUpdater();
	}, 1000/10);
}

//every second, reset frames to 0 (for fps)
window.setInterval(function() {
	fps = frames;
	frames = 0;
}, 1000);










