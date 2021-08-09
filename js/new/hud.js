
//------------------------------------------------------------
//	HUD class
//		updates hud elements (coins, carrots, hp)
//		draws overlays when level is changed or player dies
//		has less fps than game
//------------------------------------------------------------
class HUD {
	constructor() { }


	update(deltaTime) {
		ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
		//draw green overlay for hazey look
		ctx2.fillStyle = 'rgba(106,171,137,0.05)'
		ctx2.fillRect(0, 0, canvas2.width, canvas2.height - 100);
		//draw hud background layer (black bar)
		ctx2.fillStyle = 'rgba(0, 0, 0, 0.35)';
		ctx2.fillRect(0, canvas2.height - 100, canvas2.width, 100);
		//draw carrots
		for (var i = 0; i < currentLevel.numCarrots; i++) {
			var x = canvas2.width - 32 - 64 * (i + 1);
			var y = canvas2.height - 96;

			if (i < currentLevel.carrotsRemaining)
				ctx2.drawImage(carrotIMG, 288, 0, 96, 96, x, y, 96, 96);
			if (i >= currentLevel.carrotsRemaining)
				ctx2.drawImage(carrotIMG, 0, 0, 96, 96, x, y, 96, 96);

		}
		//draw coin text
		ctx2.fillStyle = 'white';
		ctx2.font = '35px feasfbrg';
		ctx2.textAlign = 'right';
		//draw carrot text
		var x = canvas2.width - currentLevel.numCarrots * 70;
		ctx2.fillText('carrots: ', x, canvas2.height - 25);
		//draw player coins
		ctx2.textAlign = 'left';
		ctx2.fillText('coins: ', 25, canvas2.height - 25);
		ctx2.drawImage(coinSheet, 384, 0, 96, 96, 100, canvas.height - 68, 64, 64);
		ctx2.fillText('x ' + player.coins, 162, canvas.height - 24);
		//draw player health
		ctx2.drawImage(healthbarFrame, canvas2.width / 2 - 250, canvas2.height - 70, 500, 40);
		ctx2.fillStyle = 'rgba(180, 0, 0, 0.6)';
		ctx2.fillRect(canvas2.width / 2 - 250 + 4, canvas2.height - 66, player.hp / 2 - 8, 30);
		//draw fps
		ctx2.fillStyle = 'white';
		ctx2.fillText('FPS: ' + fps, canvas.width / 4.5, canvas.height - 25);
		//if player fell off screen, show 'you died' and a black overlay
		if ((player.respawning || player.spawning) && player.fellOff) {
			ctx2.fillStyle = 'rgba(0, 0, 0, 0.55)';
			ctx2.fillRect(0, 0, canvas2.width, canvas2.height);
			ctx2.fillStyle = 'white';
			ctx2.font = '120px feasfbrg';
			ctx2.textAlign = 'center';
			ctx2.fillText('You Died!', canvas2.width / 2, canvas2.height / 2 - 250);
		}
		//if setting level, notify level name
		if (settingLevel) {
			ctx2.fillStyle = 'rgba(0, 0, 0, 0.55)';
			ctx2.fillRect(0, 0, canvas2.width, canvas2.height);
			ctx2.font = '120px feasfbrg';
			ctx2.fillStyle = 'white';
			ctx2.textAlign = 'center';
			ctx2.fillText(currentLevel.levelName, canvas2.width / 2, canvas2.height / 4);
		}


		// press ~ to enter developerMode
		// sprites associated ranges will also be drawn in developer mode (in sprite draw function)
		if (developerMode) {
			//draw player hitbox
			ctx.fillStyle = 'red';
			ctx.fillRect(player.position.x, player.position.y, player.width, player.height);
			//draw tile grid
			ctx.font = '25px feasfbrg';
			ctx.strokeStyle = 'rgba(250, 250, 250, 0.25)';
			ctx.fillStyle = 'white';
			for (var i = 0; i < 100; i++) {
				for (var j = 0; j < 50; j++) {
					if (player.findDistanceTo(i * 64 + 5, j * 64 + 30) < canvas.width / 2) {
						ctx.fillText(i + ',' + j, i * 64 + 5, j * 64 + 30);
						ctx.strokeRect(i * 64, j * 64, 64, 64);
					}
				}
			}
		}
	}
}
