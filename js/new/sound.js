class Sound {

    constructor(src, onload, count = 1) {
        this.sounds = [];
        this.index = 0;

        for (var i = 0; i < count; i++) {
            let sound = document.createElement("audio");
            sound.setAttribute("preload", "auto");
            sound.setAttribute("controls", "none");
            sound.style.display = "none";
            //sound.volume = 0.2;
            document.body.appendChild(sound);
            this.sounds.push(sound);
        }

        // only set onload for first one
        if (onload) {
            let sound = this.sounds[0];
            sound.oncanplaythrough = () => {
                onload();
                sound.oncanplaythrough = null;
            };
        }

        for (var i = 0; i < count; i++) {
            this.sounds[i].src = src;
        }

    }

    play(currentTime, index = -1) {
        if (index > -1 && index < this.sounds.length) {
            this.index = index;
        }
        else {
            // no index provided ? skip to next sound to prevent overlapping previous
            this.index = (this.index + 1) % this.sounds.length
        }

        let sound = this.sounds[this.index];
        sound.currentTime = typeof currentTime === "number" ? currentTime : 0;
        sound.play();
    }


    stop() {
        this.sounds[this.index].pause();
    }

    stop_all() {
        for (var i = 0; i < this.sounds.length; i++) {
            this.sounds[i].pause();
        }
    }
}