//----------------------------------
//	Frame class
//		images for animation
//----------------------------------
function Frame(img, frameX, frameY, frameWidth, frameHeight) {
	this.img = img;
	this.frameX = frameX;
	this.frameY = frameY;
	this.frameWidth = frameWidth;
	this.frameHeight = frameHeight;
}

//----------------------------------------------------------------------------------------
//	Animation class: 
//		animations given to sprites, array of frames with a playspeed and a currentframe
//----------------------------------------------------------------------------------------
function Animation(loop, numFrames, xPos, yPos, spacing, img, tileWidth, tileHeight, playSpeed) {
	this.looping= loop;
	this.numFrames = numFrames;
	this.img = img;
	this.tileWidth = tileWidth;
	this.yPos = yPos;
	this.frames = [];
	this.currentFrame = 0;
	this.timer = 0;
	this.playing = false;
	this.playSpeed = playSpeed;
	//create frames for animation
	for(var i=0; i<this.numFrames; i++) {
		var newFrame = new Frame(this.img, xPos+i*tileWidth+i*spacing, yPos, tileWidth, tileHeight);
		this.frames.push(newFrame);
	}

	//play: increment currentframe based on play speed
	this.play = function() {
		if(this.currentFrame < this.numFrames) {
			var frame = this.frames[this.currentFrame];
			//updating timer
			if(this.timer < this.playSpeed) 
				this.timer++;
			//when timer resets, increment current frame
			else { 
				this.timer = 0;
				this.currentFrame++;
			}
			//if on last frame and looping, reset animation
			if (this.currentFrame == this.numFrames && this.looping)
				this.currentFrame = 0;
			//not looping, stay on last frame until played again
			else if (this.currentFrame == this.numFrames)
				this.currentFrame = this.numFrames-1;
		}
	}

	// reverseAnimation: loops through frames and reverses their order
	this.reverseAnimation = function() {
		var tempframes = [];
		tempframes.length = this.numFrames;
		for(i=0; i<this.numFrames; i++) {
			tempframes[tempframes.length-1-i] = this.frames[i];
		}
		this.frames = tempframes;
		return this;
	}

	// combineAnimations: adds another animations frames to this animations frames
	this.combineAnimations = function(animation2) {
		this.numFrames += animation2.numFrames;
		this.frames = this.frames.concat(animation2.frames);
	}
}


