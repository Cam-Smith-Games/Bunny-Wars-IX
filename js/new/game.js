//--------------------------------------------------------------------------------
// game function
//		master function that calls all game functions (updates and renders)
//		1. handles key events
//		2. handles collisions
//		3. updates backgrounds 
//		4. updates tiles and draws them
//		5. updates sprites and draws them
//--------------------------------------------------------------------------------
const images = {}, sounds = {};
var canvas, ctx, canvas2, ctx2;

const game = {

	
	load: function () {

		canvas = document.getElementById("canvas");
		ctx = canvas.getContext("2d");
		canvas.width = 1920;
		canvas.height = 1080;

		canvas2 = document.getElementById("canvas2");
		ctx2 = canvas2.getContext("2d");
		canvas2.width = 1920;
		canvas2.height = 1080;

        // #region images
        let imagePaths = [
            "title", "player", "slime", "floppit", "zombies/zombie", "coins", "carrot", "healthbar", "heart",
            "backgrounds/bg", "backgrounds/mountain1", "backgrounds/mountain2", "backgrounds/trees1", "backgrounds/trees2", 
        ];
        for (i = 1; i < 18; i++) {
            imagePaths.push("tiles/grassland/" + i);
        }
        // #endregion

        // #region sounds
        let soundPaths = ["swish.ogg", "explode.ogg", "jingle.ogg", "jingle lose.ogg", "sonic.ogg", "jump.wav", "doublejump.wav", "ladder.ogg", "step.ogg", "coin.wav"];
        for (var i = 1; i < 25; i++) {
            soundPaths.push("zombies/zombie-" + i + ".ogg");
        }
        // #endregion



        let numResources = imagePaths.length + soundPaths.length;
		let loadCounter = 0, loadingtimer = 0;
        function onload() {
            loadCounter++;

			loadingtimer++;
			ctx.fillStyle = 'black';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = 'white';
			ctx.font = '60px feasfbrg';
			ctx.textAlign = 'center';
			ctx.fillText('loading...', canvas.width / 2, canvas.height / 2);
			ctx.fillText('objects loaded: ' + loadCounter, canvas.width / 2, canvas.height / 2 + 200);
			ctx.fillText(Math.floor(loadCounter / numResources * 100) + ' %', canvas.width / 2, canvas.height / 2 + 100);

            // TODO: progress bar 
            //console.log(loadCounter + " / " + numResources);
            if (loadCounter >= numResources) {
                game.init();
            }
        }

        // #region loading
        imagePaths.forEach(path => {
            let img = new Image();
            img.onload = onload;
            img.src = "../../img/" + path + ".png";
            images[path] = img;
        });
        soundPaths.forEach(path => sounds[path] = new Sound("../../audio/" + path, onload));
        // #region
    },


	init: function () {

		//create initial background layers
		Background.backgrounds = [new Background(0, 1), new Background(0, 2), new Background(0, 3), new Background(0, 4)];


		var opacity = 0; dir = 1;

		// START SCREEN
		const startScreen = setInterval(() => {
			ctx.save();
			xOffset = canvas.width / 2 - player.position.x - player.size.x / 2;
			yOffset = canvas.height / 2 - player.position.y - player.size.y / 2;
			ctx.translate(xOffset, yOffset);
			ctx.clearRect(-xOffset, -yOffset, canvas.width, canvas.height);
			ctx.drawImage(images["backgrounds/bg"], -xOffset, -yOffset, canvas.width, canvas.height);
			// setting players velocity to make background move, since sprite mover function isnt getting called
			// need to update x as well (velocity is doing nothing but making background move, not moving player)
			player.velocity.x = -5;
			player.position.x -= 5;


			//backgroundParallax();
			Background.draw();

			ctx.drawImage(images["title"], -xOffset, -yOffset, canvas.width, canvas.height);


			opacity += (0.04 * dir);
			if (opacity <= 0 || opacity >= 1) {
				dir *= -1;
			}

			ctx.textAlign = 'center';
			ctx.font = '60px feasfbrg';
			ctx.fillStyle = 'rgba(250, 250, 250, ' + opacity + ')';
			ctx.fillText('press enter to continue', -xOffset + canvas.width / 2, -yOffset + canvas.height / 2 + 150);

			// press enter to start game, stop startScreening
			//if (keyPressed[K_ENTER]) {
			//	sessionStorage.setItem('gameStarted', 'true');
			//	gameInterval = window.setInterval(function () {
			//		game();
			//	}, 1000 / 50);
			//	//running hud updater 1/5th speed of game
			//	hudInterval = window.setInterval(function () {
			//		hudUpdater();
			//	}, 1000 / 10);
			//	window.clearInterval(startScreenInterval);
			//}


			ctx.restore();
		}, 1000 / 30);

		KeyHandler.bind("keypress", KeyCodes.ENTER, function enterPress() {
			window.clearInterval(startScreen);
			KeyHandler.unbind("keypress", KeyCodes.ENTER, enterPress);
			game.start();
		});
	},

	start: function () {
		//sessionStorage.setItem('gameStarted', 'true');
		window.requestAnimationFrame(this.update);
	},

	update: function (deltaTime) {
		//increment frames for fps
		frames++;
		ctx.save();
		// translating to offset to follow players position
		// offset is the difference between the middle of the canvas screen and players position
		xOffset = canvas.width / 2 - player.position.x - player.size.x / 2;
		yOffset = canvas.height / 2 - player.position.y - player.size.y / 2;
		ctx.translate(xOffset, yOffset);

		ctx.clearRect(-xOffset, -yOffset, canvas.width, canvas.height);
		ctx.drawImage(images["backgrounds/bg"], -xOffset, -yOffset, canvas.width, canvas.height);

		//keyHandler();
		//collisionHandler();
		//backgroundParallax();
		//tileUpdater();
		//spriteUpdater();


		//HUD.update();

		ctx.restore();
	},

	sprites: [],
	tiles: [],

	collisionHandler: function() {
		//looping backwards to splice form list without causing index issues
		for (var i = this.sprites.length - 1; i > -1; i--) {
			let sprite = this.sprites[i];


			// variables initially set to false before looping
			// will be set to true after looping through all tiles to tell whether sprite is not colliding with anything
			let onGround = false;
			let onLadder = false;
			let colliding = false;
			let left, right, top, bottom = false;
		
			// ----------------- SPRITE TILE COLLISIONS ------------------- //
			//for each sprite, loop through tiles checking for collisions
			for (var j = 0; j < this.tiles.length; j++) {
				let tile = this.tiles[j];

				let colliding = tile.colliding(sprite);
				if (colliding) {
								//colliding with ladder: if player within range of center of ladder, put player on ladder and limit players dx to +- 3
					if (tile.type == "ladder") {
						var distance = Math.abs(sprite.position.x + sprite.width / 2 - (tile.x + tile.width / 2));
						if (distance < tile.width / 2) {
							onGround = true;
							sprite.velocity.y = 0;
							if (sprite.velocity.x > 3)
								sprite.velocity.x = 3;
							if (sprite.velocity.x < -3)
								sprite.velocity.x = -3;
							sprite.onLadder = true;
							onLadder = true;
						}
					}
					else {
						var leftCollision = sprite.previousX + sprite.width <= tile.x;
						var rightCollision = sprite.previousX >= tile.x + tile.width;
						var topCollision = sprite.previousY + sprite.height <= tile.y;
						var bottomCollision = sprite.previousY >= tile.y + tile.height;

						//if player homing and collides with anything but the ground, stop homing
						if (sprite.homing && !topCollision) {
							player.target = null;
							player.homing = false;
							player.velocity = new Vector(0, 0);
							player.ballform = false;
							player.endingBallForm = true;
							player.TRANSFORM_OUTOF_BALL.currentFrame = 0;
						}

						// top collision: put player on top of tile
						if (topCollision && !(leftCollision || rightCollision || bottomCollision)) {
							sprite.position.y = tile.y - sprite.height;

							//player moves so fast when ground pounding, need to move player up
							if (sprite.poundingGround || sprite.groundPounding) {
								sprite.position.y -= tile.height;
							}

							onGround = true;
							colliding = 'top';
							top = true;
							sprite.currentTile = tile;
						}

						// left collision: plut player to left of tile
						if (leftCollision && !(rightCollision || topCollision || bottomCollision)) {
							sprite.position.x = tile.x - sprite.width;
							sprite.velocity.x = 0;
							colliding = 'left';
							sprite.collidingLeft = true;
							left = true;
						}

						// right collision: put player to the right of tile
						if (rightCollision && !(leftCollision || topCollision || bottomCollision)) {
							sprite.position.x = tile.x + tile.width;
							sprite.velocity.x = 0;
							colliding = 'right';
							sprite.collidingRight = true;
							right = true;
						}

						// bottom collision: put player below tile
						if (bottomCollision && !(leftCollision || rightCollision || topCollision)) {
							sprite.position.y = tile.y + tile.height;
							sprite.jumping = false;
							sprite.jumpTimer = 0;
							sprite.velocity.y = 0;
							colliding = 'bottom';
							bottom = true;
						}
                    }
                }
			}

			sprite.colliding = colliding;

			if (!left)
				sprite.collidingLeft = false;
			if (!right)
				sprite.collidingRight = false;

			// after looping thru all tiles,
			// if player top collided with at least one of the tiles, hes on the ground
			if (onGround) {
				//when player hits ground, reset jump so he can bounce off any wall
				sprite.lastJump = null;
				sprite.midair = false;
				//sprite can no longer double jump once he hits the ground
				if (sprite.doubleJumped || sprite.canDoubleJump) {
					sprite.canDoubleJump = false;
					sprite.doubleJumped = false;
				}
				//if groundPounding, sprite is no longer groundPounding, now pound the ground
				if (sprite.groundPounding) {
					sprite.groundPounding = false;
					sprite.flying = false;
					sprite.velocity = new Vector(0, 0);
					sprite.poundingGround = true;
					sprite.poundTimer = 20;
					playAudio(explosion);
					//prevent player from jumping for 40 ticks (weird glitch happens if player jumps immediately)
					sprite.jumpCooldown = 40;
				}
				if (!sprite.jumping)
					sprite.velocity.y = 0;
				//if setting level for first time, done after player hits the ground
				if (sprite.type == 'player' && settingLevel)
					settingLevel = false;
			}
			// else, in air, gravity applied
			if (!onGround) {
				sprite.midair = true;
				sprite.currentTile = null;
			}
			if (!onLadder)
				sprite.onLadder = false;

			// ----------------- END SPRITE TILE COLLISIONS ------------------- //

			// ------------------ PLAYER/SPRITE COLLISIONS -------------------- //
			//checking for collision with player as long as sprite is not player
			if (collision(sprite, player) && sprite.type != 'player') {
				// player collides with coin: remove coin, play sound, add to players coins
				if (sprite.type == 'coin') {
					spriteList.splice(i, 1);
					playAudio(coinSound);
					player.coins++;
				}
				if (player.poundingGround)
					sprite.hp -= player.POUND_DAMAGE;
				//if player collides with top of floppit, bounce off
				if (sprite.type == 'floppit' && player.previousY + player.size.y <= sprite.position.y && !(sprite.dying || sprite.dead)) {
					player.velocity = new Vector(0, -30);
					sprite.dying = true;
				}
				//player collides with carrot, splice it, decrement levels carrots, if carrots==0, advance level
				if (sprite.type == 'carrot') {
					spriteList.splice(i, 1);
					playAudio(jingle);
					currentLevel.carrotsRemaining--;
					//if no carrots remaining, advance to next level
					if (currentLevel.carrotsRemaining == 0) {
						//remove first level form list, set new first to current level
						levelArray.splice(0, 1);
						currentLevel = levelArray[0];
						currentLevel.setCurrentLevel();
						break;
					}
				}
			}
		}
		},



    gravity: new Vector(0, 1.2),
};

game.load();