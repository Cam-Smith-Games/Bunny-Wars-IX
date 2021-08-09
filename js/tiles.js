//--------------------------------------------------------
//	Tile class:
//		objects that do nothing but get collided with
//		has type, position, size, and img
//		can move a set distance
//		stored in a level's tilemap
//--------------------------------------------------------
function Tile(type, img, x, y, width, height, collide, moving, moveDistance) {
	this.type = type;
	this.img = img;
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.collide = collide;
	this.moving = moving;
	if(this.moving) {
		this.spawnX = x;
		this.dx = 1;
	}
	this.moveDistance = moveDistance
}


//-------------------------------------------------------------------
//	Level class:
//		has a name, size (numer of tiles wide, number of tiles high),
//		player spawn point, and a tilemap
//		tilemap is a 3d array:
//			this.map[0][0] is top left tile
//			this.map[numColumns][numRows] is bottom right tile
//-------------------------------------------------------------------
function Level(levelName, numColumns, numRows, spawnX, spawnY) {
	this.levelName = levelName;
	this.numColumns = numColumns;
	this.numRows = numRows;
	this.spawnPoint = new Vector(spawnX*64, spawnY*64);
	this.tileWidth = 64;
	this.tileHeight = 64;
	//carrot attributes incremented when a carrot spawns
	this.numCarrots = 0;
	this.carrotsRemaining = 0;
	this.map = [];
	//setup blank map
	for(var i=0; i<this.numColumns; i++) {
		this.map[i] = [];
		for(var j=0; j<this.numRows; j++) {
			this.map[i][j] = 0;
		}
	};

	//insert: inserts a single tile into map
	this.insert = function(tileX, tileY, tileType) {
		this.map[tileX][tileY] = new Tile(tileType, null, tileX*this.tileWidth, tileY*this.tileHeight, this.tileWidth, this.tileHeight, true);
		this.getTileImg(tileX,tileY);
	}

	//horizontalInsert: takes row#, inserts tiles horizontally from x1 column to x2 column
	this.horizontalInsert = function(tileX, tileY, amt, tileType, moving, moveDistance) {
		var x2 = tileX + amt;
		for(var i = tileX; i<x2; i++)
			this.map[i][tileY] = new Tile(tileType, null, i*this.tileWidth, tileY*this.tileHeight, this.tileWidth, this.tileHeight, true, moving, moveDistance*this.tileWidth);
		//now that theyve all been added, update all images
		for(var i=0; i<this.numColumns; i++) {
			for(var j=0; j<this.numRows; j++) {
				this.getTileImg(i, j);
			}
		}
	};

	//verticalInsert: takes column#, inserts tiles vertically from y1 row to y2
	this.verticalInsert = function(tileX, tileY, amt, tileType, moving, moveDistance) {
		var y2 = tileY + amt;
		for(var i=tileY; i<y2; i++) {
			this.map[tileX][i] = new Tile(tileType, null, tileX*this.tileWidth, i*this.tileHeight, this.tileWidth, this.tileHeight, true, moving, moveDistance*this.tileHeight);
		}
		//now that theyve all been added, update all images
		for(var i=0; i<this.numColumns; i++) {
			for(var j=0; j<this.numRows; j++) {
				this.getTileImg(i, j);
			}
		}
	};

	//diagonalInsert: inserts diagonally. starts at x1,y1 ends at x1+amount, y1+amount
	this.diagonalInsert = function(x1, y1, amount, tileType, tileShape) {
		var x2 = x1 + amount;
		var y = y1;
		for(var i=x1; i<x2; i++) {
			this.map[i][y] = new Tile(tileType, null, i*this.tileWidth, y*this.tileHeight, this.tileWidth, this.tileHeight, true, tileShape);
			y++;
		}
		//now that theyve all been added, update all images
		for(var i=0; i<this.numColumns; i++) {
			for(var j=0; j<this.numRows; j++) {
				this.getTileImg(i, j);
			}
		}
	};

	//spawnSprites: spawns sprites according to which level it is
	this.spawnSprites = function() {
		if(this.levelName == 'level 1: zombie land national park') {
			//level 1 sprites
			var coinX = [16, 18, 20, 18, 16, 16, 16, 14, 12, 29, 34, 44, 49];
			var coinY = [47, 45, 43, 41, 39, 37, 35, 35, 35, 5,  5,  5,  5];
			spawnCoins(coinX, coinY);
			spawnCarrot(25, 39);
			spawnCarrot(86, 0);
			spawnCarrot(39, 5);
			spawnFloppit(26, 11);
			spawnFloppit(31, 11);
			spawnFloppit(36, 11);
			spawnFloppit(41, 11);
			spawnFloppit(46, 11);
			spawnFloppit(51, 11);
			spawnZombie(19, 28);
			spawnZombie(32,22);
			spawnZombie(45,27);
			spawnZombie(26,40);
			spawnZombie(14,47);
		}
	}

	//getTileImg: looks at tiles surrounding a tile to find proper image for it
	this.getTileImg = function(x, y) {
		var top, left, right, bottom, bottomleft, bottomright;
		var tile = this.map[x][y];
		
		if(y > 0) 
			top = this.map[x][y-1].type;
		if(x > 0)
			left = this.map[x-1][y].type;
		if(x < this.numColumns-1)
			right = this.map[x+1][y].type;
		if(y < this.numRows-1) {
			bottom = this.map[x][y+1].type;
			if(x > 0)
				bottomleft = this.map[x-1][y+1].type;
			if(x < this.numColumns-1)
				bottomright = this.map[x+1][y+1].type;
		}
		if(tile.type == 'grass') {
			//middle tiles, grass above/below
			if(bottom == 'grass' && top == 'grass') {
				if(left != 'grass' && right == 'grass')
					tile.img = grass6;
				if(left == 'grass' && right == 'grass') {
					tile.img = grass7;
					if(bottomleft != 'grass')
						tile.img = grass10;
					if(bottomright != 'grass')
						tile.img = grass11;
				}
				if(right != 'grass' && left == 'grass')
					tile.img = grass8;
				if(left == null && right == null)
					tile.img = grass7;
			}	
			//bottom tiles, grass above, nothing below
			if(bottom != 'grass' && top == 'grass') {
				if(left != 'grass' && right == 'grass')
					tile.img = grass9;
				if(right != 'grass' && left == 'grass')
					tile.img = grass12;
				if(left == 'grass' && right == 'grass')
					tile.img = grass13;
			}
			//top tiles, nothing above tile
			if(top == null) {
				if(left == 'grass' && right == 'grass') 
					tile.img = grass3;
				if(left != 'grass' && bottom == 'grass')
					tile.img = grass15;
				if(right == null && bottom == 'grass') 
					tile.img = grass14;
				if(bottomleft != 'grass' && left == 'grass' && right == 'grass') 
					tile.img = grass2;
				if(bottomright != 'grass' && left == 'grass' && right == 'grass') 
					tile.img = grass4;
				if(bottom != 'grass')
					tile.img = grass16;
				if(left != 'grass' && bottom != 'grass')
					tile.img = grass1;
				if(right != 'grass' && bottom != 'grass')
					tile.img = grass5;
			}

			if(right == 'diagonal grass' && top == 'diagonal grass')
				tile.img = grass7;

		}
		if(tile.type == 'diagonal grass')
			tile.img = grass17;
		if(tile.type == 'ladder')
			tile.img = ladder;
	} // end getTileImg


	//------------------------------------------------
	//	setCurrentLevel:
	//		1. sets the current level to this level
	//		2. clears previous tile and sprite lists
	//		3. respawns player
	//		4. creates all tiles from map
	//		5. spawns any necessary npcs
	//------------------------------------------------
	this.setCurrentLevel = function() {
		settingLevel = true;
		currentLevel = this;
		//clear previous sprites (except player) and tiles
		spriteList = [player];
		tileList = [];
		//respawn player at this levels spawn point
		player.spawnPoint = this.spawnPoint;
		//move player below everything for transitioning to next level
		player.position.y = canvas.height*100;
		player.respawning = true;
		//creating tiles
		for(var i=0; i<this.numColumns; i++) {	
			for(var j=0; j<this.numRows; j++) {
				var tile = this.map[i][j];
				if(tile != 0) 
					tileList.push(tile);
			}
		}
		//spawn sprites
		this.spawnSprites();
	}

}


//------------------------------------------------------
//	tileUpdater function: 
//		moves and/or draws all tiles on screen
//------------------------------------------------------
function tileUpdater() {
	for(i=0; i<tileList.length; i++) {
		var tile = tileList[i];
		if(tile.moving) {
			if(tile.x > tile.spawnX + tile.moveDistance) {
				tile.dx *= -1;
			}
			if(tile.x < tile.spawnX - tile.moveDistance)
				tile.dx *= -1;
			tile.x += tile.dx;
		}
		//only draw tiles on screen
		var leftboundary = player.position.x - canvas.width/2;
		var rightboundary = player.position.x + player.width + canvas.width/2;
		var topboundary = player.position.y - canvas.height/2;
		var bottomboundary = player.position.y + player.height + canvas.height/2;
		if(tile.x > leftboundary && tile.x < rightboundary && tile.y > topboundary && tile.y < bottomboundary)
			if(tile.img != null)
				ctx.drawImage(tile.img, tile.x, tile.y, tile.width, tile.height);
	}
}