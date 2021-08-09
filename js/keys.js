// ---------- KEY PRESSING ---------- //
window.addEventListener("keydown", function(e) {
	keyPressed[e.keyCode] = true;
});

window.addEventListener("keyup", function(e) {
	delete keyPressed[e.keyCode];
	// up key released and player hasn't already double jumped, player can double jump
	if(e.keyCode == K_UP && !player.doubleJumped && player.midair) 
		player.canDoubleJump = true;
	//tilda released, set tildapressed to false
	if(e.keyCode == K_TILDA)
		tildaPressed = false;
})


//---------------------------------------------------------------
// keyHandler function
//		called every frame, checks for all keypresses
//---------------------------------------------------------------
function keyHandler() {
	// ------------- BALL FORM KEYPRESSES ------------- // 
	//space pressed when not in ball form, transform into ball
	if(keyPressed[K_SPACE] && !player.ballform && !player.initiatingBallForm) {
		player.initiatingBallForm = true;
		player.TRANSFORM_INTO_BALL.currentFrame = 0;
	}
	//space held while in ball form, still in ball form
	if(keyPressed[K_SPACE] && player.ballform && !player.initiatingBallForm) {
		player.ballform = true;
	}
	//space released while in ball form, look for a sprite to attack or transform out of ball form
	else if (player.ballform) {
		//loop through sprites and see if theres an enemy within distance
		var nearestDistance = 9999;
		var nearestSprite = null;
		for(var i=0; i<spriteList.length; i++) {
			var sprite = spriteList[i];
			if((sprite.type == 'floppit' || sprite.type == 'zombie') && !(sprite.dead || sprite.dying || sprite.underground)) { 
				var distance = player.findDistanceTo(sprite.position.x, sprite.position.y);
				if(distance < nearestDistance) {
					nearestDistance = distance;
					nearestSprite = sprite;
				}
			}
		}
		//if there was an enemy found, make player home to target
		if(nearestDistance < player.homingDistance) {
			player.ballform = false;
			player.homing = true;
			player.target = nearestSprite;
		}
		//no enemy found, transform out of ball form
		else {	
			player.ballform = false;
			player.endingBallForm = true;
			player.TRANSFORM_OUTOF_BALL.currentFrame = 0;
		}
	}

	// ------------- LEFT/RIGHT MOVEMENT KEYPRESSES ------------- // 
	if(keyPressed[K_LEFT] && !player.dashing) {
		player.moving = true;
		player.direction = 'left';
		player.idle = false;
		if(!player.midair && !player.onLadder && !player.dashing)
			loopAudio(stepSound);
	}
	if(keyPressed[K_RIGHT] && !player.dashing) {
		player.moving = true;
		player.direction = 'right';
		player.idle = false;
		if(!player.midair && !player.onLadder && !player.dashing)
			loopAudio(stepSound);
	}
	// left/right not pressed, stop moving
	if(!(keyPressed[K_LEFT] || keyPressed[K_RIGHT])) {
		player.moving = false;
		player.idle = true;
	}


	// ------------- JUMPING KEYPRESSES ------------- // 
	
	// if player jumps too soon after ground pounding, player slightly falls through tile
	// jumpcooldown set to 40 when player hits ground after ground pounding
	if(player.jumpCooldown > 0)
		player.jumpCooldown--;
	// if up is pressed and
	// player is either on the ground, or colliding left/right with a wall
	// and player is not already jumping, not on a ladder, and jump cooldown is 0...then JUMP
	if(keyPressed[K_UP] && (!player.midair||player.collidingLeft||player.collidingRight) && !player.jumping && !player.onLadder && player.jumpCooldown == 0) {
		// last jump = left, need right wall etc. if player has no last jump, jump off anything. if not colliding with any wall, jump like normal
		if((player.lastJump == 'left' && player.collidingRight) || (player.lastJump == 'right' && player.collidingLeft) || player.lastJump == null || !(player.collidingLeft || player.collidingRight)) {
			//set last jump, switch direction if jumping off wall
			if(player.collidingLeft) {
				player.lastJump = 'left';
				player.direction = 'left';
			}
			if(player.collidingRight) {
				player.lastJump = 'right';
				player.direction = 'right';
			}
			//give jump an initial boost
			player.velocity.y = -2;
			player.jumping = true;
			player.jumpTimer = 20;
			//if jumping off walls, give boosts in appropriate direction
			if(player.collidingLeft) {
				player.velocity.x -= 5;
			}
			if(player.collidingRight) {
				player.velocity.x += 5;
			}
			playAudio(jumpSound);
		}
		
	}

	//double jumping... can jump midair as long as player isn't already in the middle of a jump and player hasn't already double jumped
	else if(keyPressed[K_UP] && player.midair && !player.doubleJumping && !player.jumping && player.canDoubleJump) {
		//give jump an initial boost
		player.velocity.y = -2;
		player.doubleJumping = true;
		player.canDoubleJump = false;
		player.doubleJumped = true;
		player.jumpTimer = 25;
		playAudio(doubleJumpSound);
	}
	
	// ------------- END JUMPING KEYPRESSES ------------- // 

	
	// ground pound attack
	// if down key pressed while midair and not already hovering, start hovering
	if(keyPressed[K_DOWN] && !player.hovering && player.midair) {
		player.hovering = true;
		player.hoverTimer = 20;
	}

	//climbing up ladder
	if(keyPressed[K_UP] && player.onLadder) {
		player.position.y-=5;
		loopAudio(ladderSound);
	}
	//climbing down ladder
	if(keyPressed[K_DOWN] && player.onLadder) {
		player.position.y+=5;
		loopAudio(ladderSound);
	}

	// player dash
	// if shift pressed and player is not already dashing and dash cooldown is 0
	if(keyPressed[K_SHIFT] && !player.dashing && player.dashCooldown == 0) {
		player.dashing = true;
		player.dashTimer = 10;
		player.dashCooldown = 30;
		playAudio(swish);
	}
	else if (player.dashCooldown > 0)
		player.dashCooldown--;

	// press tilda, enter developer mode
	// using tildaPressed so developermode isn't immediately toggled on/off if key held for more than 1 single frame
	if(keyPressed[K_TILDA] && developerMode == false && !tildaPressed) {
		tildaPressed = true;
		developerMode = true;
	}
	else if(keyPressed[K_TILDA] && developerMode && !tildaPressed) {
		tildaPressed = true;
		developerMode = false;
	}


}