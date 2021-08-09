//function to return true if 2 things colliding
function collision(first, second) {
	return (first.position.x < second.position.x + second.width &&
			first.position.x + first.width > second.position.x &&
			first.position.y < second.position.y + second.height &&
			first.position.y + first.height > second.position.y);
}

// function to return true is sprite is colliding with tile 
// (different than normal collision because sprite has position and tile has x/y)
function tileCollision(sprite, tile) {
	return (sprite.position.x < tile.x + tile.width &&
			sprite.position.x + sprite.width > tile.x &&
			sprite.position.y < tile.y + tile.height &&
			sprite.position.y + sprite.height > tile.y);
}


//----------------------------------------------------
//	collisionHandler: 
//		called every update, handles all collisions
//----------------------------------------------------
function collisionHandler() {
	//looping backwards to splice form list without causing index issues
	for(i=spriteList.length-1; i>=0; i--) {
		// variables initially set to false before looping
		// will be set to true after looping through all tiles to tell whether sprite is not colliding with anything
		var onGround = false;
		var onLadder = false;
		var colliding = false;
		var left, right, top, bottom = false;
		var sprite = spriteList[i];
		// ----------------- SPRITE TILE COLLISIONS ------------------- //
		//for each sprite, loop through tiles checking for collisions
		for(var j=0; j<tileList.length; j++) {
			var tile = tileList[j];
			//colliding with any tile thats not a ladder
			if(tileCollision(sprite, tile) && tile.type != 'ladder') {
				var leftCollision = sprite.previousX + sprite.width <= tile.x;
				var rightCollision = sprite.previousX >= tile.x+tile.width;
				var topCollision = sprite.previousY+sprite.height <= tile.y;
				var bottomCollision = sprite.previousY >= tile.y+tile.height;
				//if player homing and collides with anything but the ground, stop homing
				if(sprite.homing && !topCollision) {
					player.target = null;
					player.homing = false;
					player.velocity = new Vector(0,0);
					player.ballform = false;
					player.endingBallForm = true;
					player.TRANSFORM_OUTOF_BALL.currentFrame = 0;
				}
				//top collision: put player on top of tile
				if(topCollision && !(leftCollision || rightCollision || bottomCollision)) {
					sprite.position.y = tile.y - sprite.height;
					//player moves so fast when ground pounding, need to move player up
					if(sprite.poundingGround || sprite.groundPounding)
						sprite.position.y -= tile.height;
					
					onGround = true;
					colliding = 'top';
					top = true;
					sprite.currentTile = tile;
				}
				//left collision: plut player to left of tile
				if(leftCollision && !(rightCollision || topCollision || bottomCollision)) {
					sprite.position.x = tile.x - sprite.width;
					sprite.velocity.x = 0;
					colliding = 'left';
					sprite.collidingLeft = true;
					left = true;
				}
				//right collision: put player to the right of tile
				if(rightCollision && !(leftCollision || topCollision || bottomCollision)) {
					sprite.position.x = tile.x + tile.width;
					sprite.velocity.x = 0;
					colliding = 'right';
					sprite.collidingRight = true;
					right = true;
				}
				//bottom collision: put player below tile
				if(bottomCollision && !(leftCollision || rightCollision || topCollision)) {
					sprite.position.y = tile.y + tile.height;
					sprite.jumping = false;
					sprite.jumpTimer = 0;
					sprite.velocity.y = 0;
					colliding = 'bottom';
					bottom = true;
				}
			}	
			//colliding with ladder: if player within range of center of ladder, put player on ladder and limit players dx to +- 3
			else if (tileCollision(sprite, tile) && tile.type == 'ladder') {
				var distance = Math.abs(sprite.position.x+sprite.width/2 - (tile.x+tile.width/2));
				if(distance < tile.width/2) {
					onGround = true;
					sprite.velocity.y = 0;
					if(sprite.velocity.x > 3)
						sprite.velocity.x = 3;
					if(sprite.velocity.x < -3)
						sprite.velocity.x = -3;
					sprite.onLadder = true;
					onLadder = true;
				}
			}
		}
		sprite.colliding = colliding;

		if(!left)
			sprite.collidingLeft = false;
		if(!right)
			sprite.collidingRight = false;
			
		// after looping thru all tiles,
		// if player top collided with at least one of the tiles, hes on the ground
		if(onGround) {
			//when player hits ground, reset jump so he can bounce off any wall
			sprite.lastJump = null;
			sprite.midair = false;
			//sprite can no longer double jump once he hits the ground
			if(sprite.doubleJumped || sprite.canDoubleJump) {
				sprite.canDoubleJump = false;
				sprite.doubleJumped = false;
			}
			//if groundPounding, sprite is no longer groundPounding, now pound the ground
			if(sprite.groundPounding) {
				sprite.groundPounding = false;
				sprite.flying = false;
				sprite.velocity = new Vector(0,0);
				sprite.poundingGround = true;
				sprite.poundTimer = 20;
				playAudio(explosion);
				//prevent player from jumping for 40 ticks (weird glitch happens if player jumps immediately)
				sprite.jumpCooldown = 40;
			}
			if(!sprite.jumping)
				sprite.velocity.y = 0;
			//if setting level for first time, done after player hits the ground
			if(sprite.type == 'player' && settingLevel)
				settingLevel = false;
		}
		// else, in air, gravity applied
		if(!onGround) {
			sprite.midair = true;
			sprite.currentTile = null;
		}
		if(!onLadder)
			sprite.onLadder = false;

		// ----------------- END SPRITE TILE COLLISIONS ------------------- //

		// ------------------ PLAYER/SPRITE COLLISIONS -------------------- //
		//checking for collision with player as long as sprite is not player
		if(collision(sprite, player) && sprite.type != 'player') {
			// player collides with coin: remove coin, play sound, add to players coins
			if(sprite.type == 'coin') {
				spriteList.splice(i, 1);
				playAudio(coinSound);
				player.coins++;
			}
			if(player.poundingGround)
				sprite.hp -= player.POUND_DAMAGE;
			//if player collides with top of floppit, bounce off
			if(sprite.type == 'floppit' && player.previousY+player.height <= sprite.position.y && !(sprite.dying || sprite.dead)) {
				player.velocity = new Vector(0, -30);
				sprite.dying = true;
			}
			//player collides with carrot, splice it, decrement levels carrots, if carrots==0, advance level
			if(sprite.type == 'carrot') {
				spriteList.splice(i, 1);
				playAudio(jingle);
				currentLevel.carrotsRemaining--;
				//if no carrots remaining, advance to next level
				if(currentLevel.carrotsRemaining == 0) {
					//remove first level form list, set new first to current level
					levelArray.splice(0, 1);
					currentLevel = levelArray[0];
					currentLevel.setCurrentLevel();
					break;
				}
			}
		}
	}
}
