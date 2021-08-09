class Vector {
    constructor(x, y) {
        this.x = typeof x === "number" ? x : 0;
        this.y = typeof y === "number" ? y : 0;
    }

    length() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }

    rotate(angle, pivot = null) {
        let cos = Math.cos(angle);
        let sin = Math.sin(angle);
        let x, y;

        if (pivot instanceof Vector) {

            x = Math.round(
                (cos * (this.x - pivot.x)) -
                (sin * (this.y - pivot.y)) +
                pivot.x
            );

            y = Math.round(
                (sin * (this.x - pivot.x)) +
                (cos * (this.y - pivot.y)) +
                pivot.y
            );

        }
        else {
            x = (cos * this.x) - (sin * this.y);
            y = (sin * this.x) + (cos * this.y);
        }

        return new Vector(x, y);
    }

    copy() {
        return new Vector(this.x, this.y);
    }

    abs() {
        return new Vector(Math.abs(this.x), Math.abs(this.y));
    }

    add(vec) {
        if (vec instanceof Vector) {
            return new Vector(this.x + vec.x, this.y + vec.y);
        }
        return this;
    }

    subtract(vec) {
        if (vec instanceof Vector) {
            return new Vector(this.x - vec.x, this.y - vec.y);
        }
        return this;
    }

    dist(vec) {
        if (vec instanceof Vector) {
            return this.subtract(vec).length();
        }
        return 0;
    }
    multiply(scalar) {
        if (typeof scalar === "number") {
            return new Vector(this.x * scalar, this.y * scalar);
        }
        return this;
    }

    dot(vec) {
        if (vec instanceof Vector) {
            return this.x * vec.x + this.y * vec.y;
        }
        return 0;
    }

    divide(v) {
        if (v instanceof Vector) {
            return new Vector(this.x / v.x, this.y / v.y);
        }
        return new Vector(this.x / v, this.y / v);
    }


    unit() {
        let length = this.length();
        if (length == 0) {
            return this;
        }

        return this.divide(length);
    }

    roundTo(value) {
        return new Vector(this.x.roundTo(value), this.y.roundTo(value));
    }
}

// static method to convert array ([0,1] etc) to list of Vectors
Vector.fromArray = function (array = []) {
    let vectors = [];
    array.forEach(arr => {
        vectors.push(new Vector(arr[0], arr[1]));
    })
    return vectors;
}