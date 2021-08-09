// static key code dicitonary
const KeyCodes = {
	SPACE: 32,
	E: 69,
	LEFT: 37,
	UP: 38,
	RIGHT: 39,
	DOWN: 40,
	W: 87,
	A: 65,
	S: 83,
	D: 68,
	SHIFT: 16,
	TILDA: 192,
	ENTER: 13
};

const KeyHandler = {


	// dictionary of all currently held keycodes
	keys: {},

	// each event gets dictionary mapping keycode to an array of functions 
	// NOTE: keydown funcitons get deltaTime param. keypress and keyup don't get called by update funciton so they dont get any parameters
	events: {
		keydown: {},
		keypress: {},
		keyup: {}
	},

	toggle: function (enabled = true) {
		if (enabled) {
			window.addEventListener("keydown", e => this.keydown(e));
			window.addEventListener("keyup", e => this.keyup(e));
		}
		else {
			window.removeEventListener("keydown", this.keydown);
			window.removeEventListener("keyup", this.keyup);
		}
	},

	keydown: function (e) {
		this.keys[e.keyCode] = true;
		let events = this.events.keypress[e.keyCode];
		if (events) {
			events.forEach(func => func());
        }
	},

	keyup: function (e) {
		if (this.keys[e.keyCode]) {
			delete this.keys[e.keyCode];

			let events = this.events.keyup[e.keyCode];
			if (events) {
				events.forEach(func => func());
			}
		}
		

	},

	update: function (deltaTime) {
		for (var keyCode in this.keys) {
			this.events.keydown[keyCode].forEach(func => func(deltaTime));
		}
	},

	// todo: unbind. would require some form of handle to specify which func to remove. would "indexOf" be smart enough to figure out which func is which?
	bind: function (event, keyCode, func) {
		let e = this.events[event];
		if (keyCode in e) {
			e[keyCode].push(func);
		}
		else {
			e[keyCode] = [func];
		}
	},

	unbind: function (event, keyCode, func) {
		let e = this.events[event];
		if (keyCode in e) {
			let keyEvents = e[keyCode];
			let index = keyEvents.indexOf(func);
			if (index > -1 && index < keyEvents.length) {
				keyEvents.splice(index, 1);
			}
		}
    }
};

KeyHandler.toggle(true);