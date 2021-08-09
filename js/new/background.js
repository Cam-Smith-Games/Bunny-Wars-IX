
//------------------------------------------------------------------------
// Background class: 
// 		layers have different images/heights and move different speeds 
// 		layer 1 = foreground, layer 4 = background
//      backgrounds are linked to their left/right neighbor backgrounds
//------------------------------------------------------------------------
class Background {

	constructor(x = 0, layer = 1) {
		this.x = x;
		this.width = canvas.width;
		this.layer = layer;

		if (layer == 1 || layer == 2) {
			this.height = canvas.height * 3 / 5;
			this.img = layer == 1 ? images["backgrounds/trees1"] : images["backgrounds/trees2"];
		}
		else if (layer == 3 || layer == 4) {
			this.height = canvas.height;
			this.img = layer == 3 ? images["backgrounds/mountain1"] : images["backgrounds/mountain2"];
		}

		this.leftNeighbor = false;
		this.rightNeighbor = false;
	}

}


//------------------------------------------------------------------------------------------------------
//	backgroundParallax 
//		moves all backgrounds in list, with different speeds according to their layer
//		when a background begins leaving the screen and has no neighbor for that side (moving left, gap on right side etc)
//		create new background with same layer and link them together
//		when background has completely left screen, remove it and unlink it from its neighbors
//------------------------------------------------------------------------------------------------------
Background.backgrounds = [];
Background.draw = function () {
	for (var i = 0; i < Background.backgrounds.length; i++) {
		var bg = Background.backgrounds[i];
		//want farther layers to appear to move LESS so make them follow players velocity MORE
		//if player is standing on a moving tile, make it follow that as well
		var tileSpeed = 0;
		if (player.currentTile != null && player.currentTile.moving)
			tileSpeed = player.currentTile.dx;
		if (bg.layer == 1) {
			bg.x += player.velocity.x / 3 + tileSpeed / 3;
			bg.y = -yOffset + canvas.height / 2.5;
		}
		if (bg.layer == 2) {
			bg.x += player.velocity.x / 2 + tileSpeed / 2;
			bg.y = -yOffset + canvas.height / 2.5;
		}
		if (bg.layer == 3) {
			bg.x += player.velocity.x / 1.5 + tileSpeed / 1.5;
			bg.y = -yOffset;
		}
		if (bg.layer == 4) {
			bg.x += player.velocity.x / 1.1 + tileSpeed / 1.1;
			bg.y = -yOffset - 200;
		}

		//right side of bg < right side of screen and > left side of screen (moving left off of screen) and no right neighbor
		if (bg.x + bg.width < -xOffset + canvas.width && bg.x + bg.width > -xOffset && !bg.rightNeighbor) {
			// want to slightly overlap all images to prevent gaps
			var x = bg.x + bg.width - 30;
			//creating neighbor for background
			var newBackground = new Background(x, bg.layer);
			bg.rightNeighbor = newBackground;
			newBackground.leftNeighbor = bg;
			backgrounds.push(newBackground);
		}
		//left side of bg > left side of screen and < right side of screen (moving right off of screen) and no left neighbor
		if (bg.x > -xOffset && bg.x < -xOffset + canvas.width && !bg.leftNeighbor) {
			//create a left neighbor for it
			if (bg.layer != 0)
				var x = bg.x - bg.width + 30;
			else
				var x = bg.x - bg.width;
			var newBackground = new Background(x, bg.layer);
			newBackground.rightNeighbor = bg;
			bg.leftNeighbor = newBackground;
			this.backgrounds.push(newBackground);
		}

		//when background has left screen, remove it
		if (bg.x + bg.width < -xOffset || bg.x > -xOffset + canvas.width) {
			bg.leftNeighbor.rightNeighbor = false;
			bg.rightNeighbor.leftNeighbor = false;
			this.backgrounds.splice(i, 1);
		}

	}

	//now re-loop through backgrounds and draw them in the correct order (according to layers, 4 3 2 1)
	for (var i = 4; i > 0; i--) {
		for (var j = 0; j < this.backgrounds.length; j++) {
			var bg = this.backgrounds[j];
			if (bg.layer == i) {
				ctx.drawImage(bg.img, bg.x, bg.y, canvas.width, bg.height);
			}
		}
	}
}