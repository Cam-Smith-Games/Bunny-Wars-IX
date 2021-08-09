//--------------------------------------------------------------------------------
//	Sprite class
//		every object in game thats not a tile
//		has several functions to...
//		- find distance from a sprite to a x,y coordinate
//		- respawn at its initial spawn point. player only (for now at least)
//		- set its velocity and move it
//		- set its current animation according to what its doing
//		- make it do enemy stuff if its an enemy (AI)
//		- draws its health above its head
//		- draw it
//--------------------------------------------------------------------------------
function Sprite(type, hp, tileX, tileY, width, height, movespeed, flying) {
	this.type = type;
	this.hp = hp;
	this.maxHP = hp;
	
	this.width = width;
	this.height = height;
	//changing from tile coordinates to actual coordinates
	var x = tileX * 64 + 32 - this.width/2;;
	var y = tileY * 64 + 32 - this.height/2;;
	this.position = new Vector(x, y);
	this.spawnPoint = new Vector(x, y); 
	//previous coordinates used for collision
	this.previousX = x;
	this.previousY = y;


	this.velocity = new Vector(0, 0);
	this.moving = false;
	this.movespeed = movespeed;
	this.maxMoveSpeed = 20*this.movespeed;
	
	this.direction = 'right';
	this.idle = true;
	
	this.attacking = false;
	this.attackTimer = 0;

	this.jumping = false;
	this.jumpTimer = 0;
	this.jumpCooldown = 0;
	this.midair = true;

	this.flying = flying;
	this.yDirection = 'up';

	this.dashing = false;
	this.dashCooldown = 0;
	
	this.colliding = null;
	this.currentTile = null;

	this.animations = [];
	this.currentAnimation = null;

	
	//enemy attributes
	if(this.type == 'zombie' || this.type == 'floppit') {
		this.aggroRange = 300;
		this.aggressive = false;
		this.leaveRange = 900;
		this.attackRange = 200;
		this.roamRange = 200;
		this.fallingOffEdge = false;
	}

	//findDistanceTo: returns distance from this sprites position to a point
	this.findDistanceTo = function(x, y) {
		var xsquared = Math.pow(Math.abs(this.position.x+this.width/2 - x), 2);
		var ysquared = Math.pow(Math.abs(this.position.y+this.height/2 - y), 2);
		return Math.sqrt(xsquared + ysquared);
	}

	//respawn: respawns player at initial spawn point, resets background
	this.respawn = function() {
		this.spawning = false;
		var x = this.spawnPoint.x;
		var y = this.spawnPoint.y;
		var xDiff = x-this.position.x;
		//moving backgrounds to match where place spawns
		for(var i=0; i<backgrounds.length; i++) {
			backgrounds[i].x += xDiff;
			backgrounds[i].y = -yOffset;
		}
		this.position = new Vector(x,y);
		this.velocity = new Vector(0,0);
		this.hp = this.maxHP;
		this.coins = 0;
	}

	//move: sets sprites velocity then moves it
	this.move = function() {
		//update previous coordinates
		this.previousX = this.position.x;
		this.previousY = this.position.y;
		//if moving and velocity < max velocity, accelerate according to direction
		if(this.moving) {
			if(this.direction == 'left' && this.velocity.x > -this.maxMoveSpeed) 
				this.velocity.add(-this.movespeed, 0);
			if (this.direction == 'right' && this.velocity.x < this.maxMoveSpeed)
				this.velocity.add(this.movespeed, 0);

			//flying not currently implemented but will be
			if(this.flying) {
				if(this.yDirection == 'up' && this.velocity.y > -this.maxMoveSpeed)
					this.velocity.add(0, -this.movespeed/2);
				if(this.yDirection == 'down' && this.velocity.y < this.maxMoveSpeed)
					this.velocity.add(0, this.movespeed/2);
			}
		}

		//if not moving and on ground, slow down 
		else if (Math.abs(this.velocity.x) > 0 && !this.midair) {
			if(this.velocity.x >= this.maxMoveSpeed)
				this.velocity.x = this.maxMoveSpeed*3/4;
			if(this.velocity.x <= -this.maxMoveSpeed)
				this.velocity.x = -this.maxMoveSpeed*3/4;

			if(this.velocity.x > 0)
				this.velocity.add(-1, 0);
			if(this.velocity.x < 0)
				this.velocity.add(1, 0);
			if(Math.abs(this.velocity.x) < 1.5)
				this.velocity.x = 0;
		}
		//slowing down flying sprites
		if(this.flying && !this.moving) {
			if(this.velocity.y > 0)
				this.velocity.y--;
			if(this.velocity.y < 0)
				this.velocity.y++;
		}

		//making sprite jump
		if(this.jumping) {
			if(this.jumpTimer > 0) {
				this.velocity.addVector(jumpVector);
				this.jumpTimer--;
			}
			else //stop jumping after timer reaches 0
				this.jumping = false;
		}
		//making sprite double jump
		if(this.doubleJumping) {
			if(this.jumpTimer > 0) {
				this.velocity.addVector(jumpVector);
				//slowing down x velocity
				if(this.direction == 'left' && this.velocity.x < -1)
					this.velocity.x = -1;
				if(this.direction == 'right' && this.velocity.x > 1)
					this.velocity.x = 1;

				this.jumpTimer--;
			}
			else {
				this.doubleJumping = false;
				this.doubleJumped = true;
				player.currentAnimation = player.JUMP;
				player.currentAnimation.currentFrame = 4;
			}
		}

		//making sprite dash
		if(this.dashing) {
			this.velocity.y = 0;
			if(this.direction == 'right')
				this.velocity.x = 1.5*this.maxMoveSpeed;
			else
				this.velocity.x = -1.5*this.maxMoveSpeed;
		}

		//making sprite hover
		if(this.hovering) {
			if(this.hoverTimer > 0) {
				this.velocity = new Vector(0,0);
				this.flying = true;
				this.hoverTimer--;
			}
			else {
				this.hovering = false;
				this.groundPounding = true;
			}
		}

		//making sprite ground pound
		if(this.groundPounding || this.poundingGround) {
			this.velocity = new Vector(0, this.maxMoveSpeed*5);
			//pounding ground until timer == 0
			if(this.poundingGround && this.poundTimer > 0) {
				this.poundTimer--;
			}
			else {
				this.poundingGround = false;
			}
		}

		//if standing on a moving tile, move with it
		if(this.currentTile != null && this.currentTile.moving) {
			this.position.x += this.currentTile.dx;
			//make zombies roam areas follow tile as well
			if(this.type == 'zombie') {
				this.spawnPoint.x += this.currentTile.dx;
			}
		}

		//when floppit dies, it falls
		if(this.type == 'floppit' && this.dying || this.dead) {
			this.flying = false;
			this.velocity.y = 8;
		}

		//making player follow target when homing
		if(this.homing) {
			var enemyX = this.target.position.x+this.target.width/2;
			var enemyY = this.target.position.y+this.target.height/2;
			var xDiff = enemyX - this.position.x;
			var yDiff = enemyY - this.position.y;
			var distance = this.findDistanceTo(enemyX, enemyY);
			if(distance > this.target.width) 
				this.velocity = new Vector(xDiff/distance*25, yDiff/distance*25);
			else {
				this.target.hp -= this.BALL_DAMAGE;
				this.target = null;
				this.homing = false;
				this.velocity = new Vector(0, -30);
			}
		}


		//add gravity to sprites dy
		if(!this.flying && !this.onLadder)
			this.velocity.addVector(gravityVector);
		
		//dont move in ballform
		if(this.ballform) 
			this.velocity = new Vector(0, 0);
		//if appearing or attacking or underground (zombies), apply gravity but dont move left/right
		if(this.appearing || this.attacking || this.underground)
			this.velocity.x = 0;

		//now move sprite after setting velocity
		this.position.addVector(this.velocity);

		//if sprite falls off screen, respawn
		if(this.position.y > currentLevel.numRows * currentLevel.tileHeight + canvas.height && !(this.respawning||this.spawning)) {
			if(this.type == 'player') {
				playAudio(jingleLose);
				this.respawning = true;
				this.fellOff = true;
			}
			else 
				this.dying = true;
		}
	}; // end move


	// setAnimation: sets sprites current animation according to what its doing
	this.setAnimation = function() {
		var previousAnimation = this.currentAnimation;
		if(this.type != 'coin' && this.type != 'carrot') {
			//moving, set walk animation
			if(this.moving) 
				this.currentAnimation = this.WALK;
			//not moving and on ground, idle animation
			if(!this.moving && !this.midair && this.type != 'floppit') 
				this.currentAnimation = this.IDLE;
			//jump animation
			if(this.midair && this.type == 'player') 
				this.currentAnimation = this.JUMP;
			//double jump animation
			if(this.doubleJumping) 
				this.currentAnimation = this.DOUBLE_JUMP;
			//attacking animations
			if(this.attacking) { 	
				if(this.type == 'zombie')
					this.currentAnimation = this.ATTACK;
			}
			//dashing animation
			if(this.dashing) {
				if(this.dashTimer > 0) {
					this.dashTimer--;
					this.currentAnimation = this.DASH;
				}
				else
					this.dashing = false;
			}
			//hover animation
			if(this.hovering || this.groundPounding) {
				this.currentAnimation = this.HOVER;
			}
			//groundpound animation
			if(this.poundingGround)
				this.currentAnimation = this.LANDING;

			//ball form animations
			if(this.initiatingBallForm) {
				this.currentAnimation = this.TRANSFORM_INTO_BALL;
				//transform animation done, turn into ball form
				if(this.currentAnimation.currentFrame == this.currentAnimation.numFrames-1) {
					this.initiatingBallForm = false;
					this.ballform = true;
					playAudio(sonicSound);
				}
			}
			//player needs smaller height when in ball form
			if(this.ballform || this.homing) {
				this.currentAnimation = this.BALL_FORM;
				this.height = 90;
			}
			else if (this.type == 'player')
				this.height = 150;
			if(this.endingBallForm) {
				this.currentAnimation = this.TRANSFORM_OUTOF_BALL;
				if(this.currentAnimation.currentFrame == this.currentAnimation.numFrames-1) 
					this.endingBallForm = false;
			}

			//dying animation (if sprite has one)
			if(this.dying && this.DIE != null) {
				this.velocity = new Vector(0,0);
				this.currentAnimation = this.DIE;
				//once sprite reaches the end of its death animation, give it a timer
				if(this.currentAnimation.currentFrame == this.currentAnimation.numFrames-1 && !this.dead) {
					this.deathTimer = 100;
					this.dead = true;
				}
			}
			//final death animation if one exists
			if(this.dead && this.DEATH != null)
				this.currentAnimation = this.DEATH;

			//before player walks near zombie, it will be underground (invisible)
			if(this.type == 'zombie' && this.underground)
				this.currentAnimation = this.INVISIBLE; 
			//making zombies climb out of ground when first walked near
			if(this.type == 'zombie' && this.appearing) {
				this.currentAnimation = this.APPEAR;
				if(this.currentAnimation.currentFrame == this.currentAnimation.numFrames-1)
					this.appearing = false;
			}


			//if animation was changed, make sure current frame is 0
			if(previousAnimation != this.currentAnimation) 
				this.currentAnimation.currentFrame = 0;
			
		}
		
		if(this.type == 'coin')
			this.currentAnimation = this.SPIN;
		if(this.type == 'carrot')
			this.currentAnimation = this.IDLE;
	}; // end setAnimation



	// enemyAI: called if sprite is not player
	// makes enemys follow and attack player if within certain ranges
	this.enemyAI = function() {
		var distance = this.findDistanceTo(player.position.x+player.width/2, player.position.y+player.height/2);
		//player steps within aggro range, set to aggressive
		if(distance < this.aggroRange) {
			//make it climb out of ground if underground
			if(this.underground) {
				this.appearing = true;
				this.underground = false;
			}
			this.aggressive = true;
			this.idle = false;
		}

		//if sprite is aggressive and not overlapping player, make it follow player (if not dead or dying)
		if (this.aggressive && distance > this.width && !(this.dying || this.dead)) {
			//right of player, move left
			if(this.position.x > player.position.x) {
				this.direction = 'left';
				this.moving = true;
			}
			//left of player, move right
			if(this.position.x < player.position.x) {
				this.direction = 'right';
				this.moving = true;
			}
			if(this.flying) {
				if(this.position.y < player.position.y) {
					this.yDirection = 'down';
					this.moving = true;
				}
				if(this.position.y > player.position.y) {
					this.yDirection = 'up';
					this.moving = true;
				}
			}
			this.idle = false;
		}

		//if player leaves leave range, stop being aggressive
		if (distance > this.leaveRange) {
			this.aggressive = false;
			this.idle = true;
		}

		//sprite within attackRange of player and not overlapping player, attack
		if(distance < this.attackRange && distance > this.width && this.attackTimer == 0) {
			this.attackTimer = 100;
			this.attacking = true;
			this.idle = false;
			var index = Math.round(Math.random()*23);
			playAudio(zombieSounds[index]);
		}
		//attacking
		if (this.attackTimer > 0) {
			this.attackTimer--;
			//reached last frame in attack animation while attacking in range, hurt player
			if(this.attacking && distance < this.attackRange && this.currentAnimation.currentFrame == this.currentAnimation.numFrames-1) {
				player.hp -= 100;
				this.attacking = false;
			}
		}
		else
			this.attacking = false;


		//enemy idle AI 
		//certain distance from spawn point, return home
		//within distance from spawn point, walk back and forth 
		if(this.idle) {
			var distanceToHome = this.findDistanceTo(this.spawnPoint.x, this.spawnPoint.y);
			//outside of roam range, go back to spawn point
			if(distanceToHome > this.roamRange) {
				var previousDirection = this.direction;
				var previousYdirection = this.yDirection;
				if(this.position.x < this.spawnPoint.x) {
					this.moving = true;
					this.direction = 'right';
				}
				else if(this.position.x > this.spawnPoint.x) {
					this.moving = true;
					this.direction = 'left';
				}
				if(this.flying) {
					if(this.position.y < this.spawnPoint.y) {
						this.moving = true;
						this.yDirection = 'down';
					}
					if(this.position.y > this.spawnPoint.y) {
						this.moving = true;
						this.yDirection = 'up';
					}
				}
				//stop when direction is switched
				if(previousDirection != this.direction) {
					this.velocity.x = 0;
				}
				if(previousYdirection != this.yDirection)
					this.velocity.y = 0;
			}
			if(distanceToHome < this.roamRange)
				this.moving = true;
		}
	}; // end enemyAI

	// drawHealthBar: for sprites that have healthbars, draw number of hearts according to hp
	this.drawHealthBar = function() {
		if(!(this.dying || this.dead || this.appearing || this.underground)) {
			//drawing healthbar
			var numHearts = Math.ceil(this.hp / this.maxHP * 5);
			for(var i=0; i<numHearts; i++) {
				ctx.drawImage(heartIMG, this.position.x+this.width/2 -2.5*24 + 24*i, this.position.y-50, 24, 24);
			}
		}
	};

	// draw: draws sprites
	this.draw = function() {
		//drawing aggro range of enemies if developer mode
		if(developerMode && this.type == 'zombie') {
			//drawing aggro range
			ctx.strokeStyle = 'red';
			ctx.beginPath();
			ctx.arc(this.position.x+this.width/2, this.position.y+this.height/2, this.aggroRange, 0, Math.PI*2);
			ctx.stroke();
			// drawing attack range
			ctx.strokeStyle = 'white';
			ctx.beginPath();
			ctx.arc(this.position.x+this.width/2, this.position.y+this.height/2, this.attackRange, 0, Math.PI*2);
			ctx.stroke();
			//drawing leave range
			ctx.strokeStyle = 'greenyellow';
			ctx.beginPath();
			ctx.arc(this.position.x+this.width/2, this.position.y+this.height/2, this.leaveRange, 0, Math.PI*2);
			ctx.stroke();
			//drawing roam range
			ctx.strokeStyle = 'orange';
			ctx.beginPath();
			ctx.arc(this.spawnPoint.x, this.spawnPoint.y, this.roamRange, 0, Math.PI*2);
			ctx.stroke();
			//drawing spawn point
			ctx.fillStyle = 'red';
			ctx.fillRect(this.spawnPoint.x, this.spawnPoint.y, 5, 5);
		}
		//drawing homing distance of ball form if developer mode
		if(developerMode && this.type == 'player') {
			ctx.strokeStyle = 'red';
			ctx.beginPath();
			ctx.arc(this.position.x+this.width/2, this.position.y+this.height/2, this.homingDistance, 0, Math.PI*2);
			ctx.stroke();
		}
		//play current animation (increment frame)
		this.currentAnimation.play();
		//drawing current frame
		var frame = this.currentAnimation.frames[this.currentAnimation.currentFrame];
		//facing right, draw normal 
		if(this.direction == 'right')
			ctx.drawImage(frame.img, frame.frameX, frame.frameY, frame.frameWidth, frame.frameHeight, this.position.x, this.position.y, frame.frameWidth, frame.frameHeight);
		//facing left, invert canvas before drawing (to flip image)
		if(this.direction == 'left') {
			ctx.save();
			ctx.translate(this.position.x+this.width, this.position.y);
			ctx.scale(-1, 1);
			ctx.drawImage(frame.img, frame.frameX, frame.frameY, frame.frameWidth, frame.frameHeight, 0, 0, frame.frameWidth, frame.frameHeight);
			ctx.restore();
		}
	}; // end draw

} // end sprite class


//-------------------------------------------------------------------
//	spriteUpdater function: 
//		master function for sprites, updates and draws all of them
//-------------------------------------------------------------------
function spriteUpdater() {
	//looping backwards for splicing without causing index issues
	for(i=spriteList.length-1; i>=0; i--) {
		var sprite = spriteList[i];
		
		sprite.setAnimation();
		if(sprite.type == 'zombie') {
			sprite.enemyAI();
			sprite.drawHealthBar();
		}
		sprite.move();
		sprite.draw();	

		// SPRITE DEATH
		if(sprite.hp <= 0)
			sprite.dying = true;
		if(sprite.dead && sprite.deathTimer > 0)
			sprite.deathTimer--;
		if(sprite.deathTimer == 0)
			spriteList.splice(i, 1);

		// player respawning
		// first show a black screen that says 'you died'
		// then make player hover for a few seconds
		// then respawn player
		if(sprite.respawning && !sprite.spawning) {
			sprite.groundPounding = true;
			//jingle done playing, respawn
			if(jingleLose.currentTime == jingleLose.duration || jingleLose.paused) {
				sprite.respawning = false;
				sprite.spawning = true;
				sprite.spawnTimer = 100;
			}
		}
		if(sprite.spawning && sprite.spawnTimer > 0) {
			sprite.spawnTimer--;
		}
		else if (sprite.spawning) {
			sprite.spawning = false;
			sprite.respawn();
			sprite.fellOff = false;
		}

	}
}



//function to spawn floppits
function spawnFloppit(tileX,tileY) {
	// type, hp, tileX, tileY, width, height, movespeed, flying
	var floppit = new Sprite('floppit', 1000, tileX, tileY, 200, 200, 0.1, true);
	//loop, numFrames, xPos, yPos, spacing, img, tileWidth, tileHeight, playSpeed
	floppit.WALK = new Animation(LOOP, 10, 0, 0, 0, floppitSheet, 200, 200, 5);
	floppit.DIE = new Animation(NO_LOOP, 26, 0, 200, 0, floppitSheet, 200, 250, 4);
	floppit.DEATH = new Animation(NO_LOOP, 10, 0, 450, 0, floppitSheet, 200, 200, 5);
	floppit.currentAnimation = floppit.WALK;
	spriteList.push(floppit);
}

//function to spawn zombies
function spawnZombie(tileX, tileY) {
	// type, hp, tileX, tileY, width, height, movespeed, flying
	var zombie = new Sprite('zombie', 1000, tileX, tileY, 100, 156, 0.1);
	//loop, numFrames, xPos, yPos, spacing, img, tileWidth, tileHeight, playSpeed
	zombie.APPEAR = new Animation(NO_LOOP, 11, 0, 0, 0, zombieSheet, 110, 156, 5);
	zombie.IDLE = new Animation(LOOP, 6, 0, 156, 0, zombieSheet, 100, 156, 5);
	zombie.WALK = new Animation(LOOP, 10, 0, 312, 0, zombieSheet, 100, 156, 5);
	zombie.ATTACK = new Animation(NO_LOOP, 7, 0, 468, 0, zombieSheet, 187.5, 162, 5);
	zombie.DIE = new Animation(NO_LOOP, 8, 0, 630, 0, zombieSheet, 207.5, 156, 5);
	zombie.INVISIBLE = new Animation(LOOP, 1, 0, 0, 0, zombieSheet, 1, 1, 1);
	zombie.underground = true;
	spriteList.push(zombie)
}

//function to spawn multiple coins using x/y arrays
function spawnCoins(xArray, yArray) {
	for(var i=0; i<xArray.length; i++) {
		var coin = new Sprite('coin', 1, xArray[i], yArray[i], 96, 96, 0, true);
		coin.SPIN = new Animation(LOOP, 9, 0, 0, 0, coinSheet, 96, 96, 5);
		spriteList.push(coin);
	}
}

//funciton to spawn carrots, increments levels carrots
function spawnCarrot(tileX, tileY) {
	var carrot = new Sprite('carrot', 1, tileX, tileY, 96, 96, 0, true);
	carrot.IDLE = new Animation(LOOP, 6, 0, 0, 0, carrotIMG, 96, 96, 8);
	currentLevel.numCarrots++;
	currentLevel.carrotsRemaining++;
	spriteList.push(carrot);
}

//creating player
// type, hp, tileX, tileY, width, height, movespeed, flying (null)
var player = new Sprite('player', 1000, 0, 0, 80, 150, 0.7);
spriteList.push(player);
//player animations: loop, numFrames, xPos, yPos, spacing, img, tileWidth, tileHeight, playSpeed
player.IDLE = new Animation(LOOP, 4, 20, 10, 10, spriteSheet1, 80, 150, 10);
player.WALK = new Animation(LOOP, 6, 20, 170, 20, spriteSheet1, 100, 150, 5);
player.JUMP = new Animation(NO_LOOP, 6, 20, 330, 20, spriteSheet1, 100, 160, 5);
player.DOUBLE_JUMP = new Animation(NO_LOOP, 5, 20, 760, 30, spriteSheet1, 90, 210, 3);
player.HOVER = new Animation(LOOP, 3, 20, 990, 20, spriteSheet1, 110, 170, 5);
player.LANDING = new Animation(LOOP, 3, 500, 1010, 20, spriteSheet1, 150, 150, 5);
player.DASH = new Animation(LOOP, 5, 20, 620, 20, spriteSheet1, 100, 120, 2);
player.INVISIBLE = new Animation(NO_LOOP, 1, 0, 0, 0, spriteSheet1, 1, 1, 10);
player.TRANSFORM_INTO_BALL = new Animation(NO_LOOP, 2, 20, 510, 30, spriteSheet1, 90, 90, 4);
player.TRANSFORM_OUTOF_BALL =  new Animation(NO_LOOP, 2, 20, 510, 30, spriteSheet1, 90, 90, 4);
player.TRANSFORM_OUTOF_BALL.reverseAnimation();
player.BALL_FORM = new Animation(LOOP, 4, 255, 510, 30, spriteSheet1, 90, 90, 1);
// damage of players attacks
player.DASH_DAMAGE = 0;
player.POUND_DAMAGE = 50;
player.BALL_DAMAGE = 500;
//distance player can lock onto enemies in ball form
player.homingDistance = 600;
player.coins = 0;

/*creating slime
// type, hp, tileX, tileY, width, height, movespeed, flying
var slime = new Sprite('slime', 1000, 20, 20, 35, 35, 0.1);
spriteList.push(slime);
//loop, numFrames, xPos, yPos, spacing, img, tileWidth, tileHeight, playSpeed
slime.WALK = new Animation(LOOP, 3, 155, 31, 5, slimeSheet, 35, 35, 10);
slime.IDLE = new Animation(LOOP, 3, 20, 31, 5, slimeSheet, 35, 35, 10);
slime.JUMP = new Animation(NO_LOOP, 6, 5, 96, 5, slimeSheet, 35, 35, 5);
//adding reversed animations after animation to make them smooth
var temp = slime.WALK;
temp.reverseAnimation();
slime.WALK.combineAnimations(temp);
slime.currentAnimation = slime.WALK;
slime.currentAnimation.play(LOOP);
*/


