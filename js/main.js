//--------------------------------------------------------------------------------
// game function
//		master function that calls all game functions (updates and renders)
//		1. handles key events
//		2. handles collisions
//		3. moves backgrounds and draws them
//		4. updates tiles and draws them
//		5. updates sprites and draws them
//--------------------------------------------------------------------------------
function game() {
	//increment frames for fps
	frames++;
	ctx.save();
	// translating to offset to follow players position
	// offset is the difference between the middle of the canvas screen and players position
	xOffset = canvas.width/2 - player.position.x - player.width/2;
	yOffset = canvas.height/2 - player.position.y - player.height/2;
	ctx.translate(xOffset, yOffset);
	
	ctx.clearRect(-xOffset, -yOffset, canvas.width, canvas.height);
	ctx.drawImage(bgIMG, -xOffset, -yOffset, canvas.width, canvas.height);

	keyHandler();
	collisionHandler();
	backgroundParallax();
	tileUpdater();	
	spriteUpdater();

	// press ~ to enter developerMode
	// sprites associated ranges will also be drawn in developer mode (in sprite draw function)
	if(developerMode) {
		//draw player hitbox
		ctx.fillStyle = 'red';
		ctx.fillRect(player.position.x, player.position.y, player.width, player.height);
		//draw tile grid
		ctx.font = '25px feasfbrg';
		ctx.strokeStyle = 'rgba(250, 250, 250, 0.25)';
		ctx.fillStyle = 'white';
		for(var i=0; i<100; i++) {
			for(var j=0; j<50; j++) {
				if(player.findDistanceTo(i*64+5, j*64+30) < canvas.width/2) {
					ctx.fillText(i+','+j, i*64+5, j*64+30);
					ctx.strokeRect(i*64, j*64, 64, 64);
				}
			}
		}
	}

	ctx.restore();
}

//------------------------------------------------------------
//	hudUpdater function
//		updates hud elements (coins, carrots, hp)
//		draws overlays when level is changed or player dies
//		has less fps than game
//------------------------------------------------------------
function hudUpdater() {
	ctx2.clearRect(0,0,canvas2.width, canvas2.height);
	//draw green overlay for hazey look
	ctx2.fillStyle = 'rgba(106,171,137,0.05)'
	ctx2.fillRect(0, 0, canvas2.width, canvas2.height-100);
	//draw hud background layer (black bar)
	ctx2.fillStyle = 'rgba(0, 0, 0, 0.35)';
	ctx2.fillRect(0, canvas2.height-100, canvas2.width, 100);
	//draw carrots
	for(var i=0; i<currentLevel.numCarrots; i++) {
		var x = canvas2.width - 32 - 64*(i+1);
		var y = canvas2.height - 96;

		if(i < currentLevel.carrotsRemaining)
			ctx2.drawImage(carrotIMG, 288, 0, 96, 96, x, y, 96, 96);
		if(i >= currentLevel.carrotsRemaining) 
			ctx2.drawImage(carrotIMG, 0, 0, 96, 96, x, y, 96, 96);
		
	}
	//draw coin text
	ctx2.fillStyle = 'white';
	ctx2.font = '35px feasfbrg';
	ctx2.textAlign = 'right';
	//draw carrot text
	var x = canvas2.width - currentLevel.numCarrots * 70;
	ctx2.fillText('carrots: ', x, canvas2.height-25);
	//draw player coins
	ctx2.textAlign = 'left';
	ctx2.fillText('coins: ', 25, canvas2.height-25);
	ctx2.drawImage(coinSheet, 384, 0, 96, 96, 100, canvas.height-68, 64, 64);
	ctx2.fillText('x ' + player.coins, 162, canvas.height-24);
	//draw player health
	ctx2.drawImage(healthbarFrame, canvas2.width/2-250, canvas2.height-70, 500, 40);
	ctx2.fillStyle = 'rgba(180, 0, 0, 0.6)';
	ctx2.fillRect(canvas2.width/2-250+4, canvas2.height-66, player.hp/2-8, 30);
	//draw fps
	ctx2.fillStyle = 'white';
	ctx2.fillText('FPS: ' + fps, canvas.width/4.5, canvas.height-25);
	//if player fell off screen, show 'you died' and a black overlay
	if((player.respawning || player.spawning) && player.fellOff) {
		ctx2.fillStyle = 'rgba(0, 0, 0, 0.55)';
		ctx2.fillRect(0, 0, canvas2.width, canvas2.height);
		ctx2.fillStyle = 'white';
		ctx2.font = '120px feasfbrg';
		ctx2.textAlign = 'center';
		ctx2.fillText('You Died!', canvas2.width/2, canvas2.height/2 - 250);
	}
	//if setting level, notify level name
	if(settingLevel) {
		ctx2.fillStyle = 'rgba(0, 0, 0, 0.55)';
		ctx2.fillRect(0, 0, canvas2.width, canvas2.height);
		ctx2.font = '120px feasfbrg';
		ctx2.fillStyle = 'white';
		ctx2.textAlign = 'center';
		ctx2.fillText(currentLevel.levelName, canvas2.width/2, canvas2.height/4);
	}
}

//------------------------------------------------------------------------
// Background class: 
// 		layers have different images/heights and move different speeds 
// 		layer 1 = foreground, layer 4 = background
//      backgrounds are linked to their left/right neighbor backgrounds
//------------------------------------------------------------------------
function Background(x, layer) {
	this.x = x;
	this.width = canvas.width;
	this.layer = layer;

	if(this.layer == 1 || this.layer == 2) 
		this.height = canvas.height*3/5;
	if(this.layer == 1)
		this.img = trees1;
	if(this.layer == 2)
		this.img = trees2;

	if(this.layer == 3 || this.layer == 4) 
		this.height = canvas.height;
	if(this.layer == 3)
		this.img = mountain1;
	if(this.layer == 4)
		this.img = mountain2;
		
	this.leftNeighbor = false;
	this.rightNeighbor = false;
}

//create initial background layers
var backgrounds = [new Background(0, 1), new Background(0, 2), new Background(0, 3), new Background(0, 4)];

//------------------------------------------------------------------------------------------------------
//	backgroundParallax 
//		moves all backgrounds in list, with different speeds according to their layer
//		when a background begins leaving the screen and has no neighbor for that side (moving left, gap on right side etc)
//		create new background with same layer and link them together
//		when background has completely left screen, remove it and unlink it from its neighbors
//------------------------------------------------------------------------------------------------------
function backgroundParallax() {
	for(var i=0; i<backgrounds.length; i++) {
		var bg = backgrounds[i];
		//want farther layers to appear to move LESS so make them follow players velocity MORE
		//if player is standing on a moving tile, make it follow that as well
		var tileSpeed = 0;
		if(player.currentTile != null && player.currentTile.moving)
			tileSpeed = player.currentTile.dx;
		if(bg.layer == 1) {
			bg.x += player.velocity.x/3 + tileSpeed/3;
			bg.y = -yOffset+canvas.height/2.5;
		}
		if(bg.layer == 2) {
			bg.x += player.velocity.x/2 + tileSpeed/2;
			bg.y = -yOffset+canvas.height/2.5;
		}
		if(bg.layer == 3) {
			bg.x += player.velocity.x/1.5 + tileSpeed/1.5;
			bg.y = -yOffset;
		}
		if(bg.layer == 4) {
			bg.x += player.velocity.x/1.1 + tileSpeed/1.1;
			bg.y = -yOffset-200;
		}

		//right side of bg < right side of screen and > left side of screen (moving left off of screen) and no right neighbor
		if(bg.x+bg.width < -xOffset+canvas.width && bg.x+bg.width > -xOffset && !bg.rightNeighbor) {
			// want to slightly overlap all images to prevent gaps
			var x = bg.x+bg.width-30;
			//creating neighbor for background
			var newBackground = new Background(x, bg.layer);
			bg.rightNeighbor = newBackground;
			newBackground.leftNeighbor = bg;
			backgrounds.push(newBackground);
		}
		//left side of bg > left side of screen and < right side of screen (moving right off of screen) and no left neighbor
		if(bg.x > -xOffset && bg.x < -xOffset+canvas.width && !bg.leftNeighbor) {
			//create a left neighbor for it
			if(bg.layer != 0)
				var x = bg.x-bg.width+30;
			else
				var x = bg.x-bg.width;
			var newBackground = new Background(x, bg.layer);
			newBackground.rightNeighbor = bg;
			bg.leftNeighbor = newBackground;
			backgrounds.push(newBackground);
		}
		
		//when background has left screen, remove it
		if(bg.x + bg.width < -xOffset || bg.x > -xOffset+canvas.width) {
			bg.leftNeighbor.rightNeighbor = false;
			bg.rightNeighbor.leftNeighbor = false;
			backgrounds.splice(i, 1);
		}

	}

	//now re-loop through backgrounds and draw them in the correct order (according to layers, 4 3 2 1)
	for(var i=4; i>0; i--) {
		for(var j=0; j<backgrounds.length; j++) {
			var bg = backgrounds[j];
			if(bg.layer == i) {
				ctx.drawImage(bg.img, bg.x, bg.y, canvas.width, bg.height);
			}
		}
	}
}