class GameObject {
    constructor(args) {
        if (typeof args !== "object") {
            args = {};
        }

        // defaulting properties when not provided in args (or invalid) 
        this.img = args.img instanceof Image ? args.img : null;
        this.position = args.position instanceof Vector ? args.position : new Vector(0, 0);
        this.velocity = args.velocity instanceof Vector ? args.velocity : new Vector(0, 0);
        this.angle = typeof args.angle === "number" ? args.angle : 0;
        this.color = typeof args.color === "string" ? args.color : "rgb(0, 255, 0)";
        this.animation = args.animation;


        this.sx = typeof args.sx === "number" ? args.sx : 0;
        this.sy = typeof args.sy === "number" ? args.sy : 0;
        this.sWidth = typeof args.sWidth === "number" ? args.sWidth : this.img ? this.img.width : 0;
        this.sHeight = typeof args.sHeight === "number" ? args.sHeight : this.img ? this.img.height : 0;

        this.ignore_bounds = typeof args.ignore_bounds === "boolean" ? args.ignore_bounds : false;


        // #region dynamic update and draw methods (top down vs orthogonal perspective)
        // PERFORMMING THESE IF STATEMENTS ON TIME IN CONSTRUCTOR VS A MILLION TIMES FOR EVERY SINGLE FRAME
        // this.draw = master draw method (based on perspective)
        // this.draw_dynamic = inner draw method based on properties: (animation > image > shape)
        // this.draw_local = overridable method for drawing in local space (TODO: might need to add draw_local_before, draw_local_after...)
        // this.update_dynamic = inner update method based on properties: animations require separate call to update


        if (this.animation && this.animation instanceof OrthographicAnimation) {
            this.draw = this.draw_orthographic;
            this.update_dynamic = deltaTime => this.animation.update(deltaTime);
        }
        else {
            this.draw = this.draw_topdown;
            this.update_dynamic = deltaTime => { };
        }

        if (this.animation) {
            this.draw_dynamic = this.draw_animation;
        }
        else if (this.img) {
            this.draw_dynamic = this.draw_image;
        }
        else {
            this.draw_dynamic = this.draw_shape;
        }
        // #endregion
    }

    move() {
        let delta = this.velocity.rotate(this.angle);
        this.position = this.position.add(delta);

        this.position.x = this.position.x.clamp(0, canvas.width - this.radius);
        this.position.y = this.position.y.clamp(0, canvas.height - this.radius);
    }



    isColliding(other) {
        let x_diff = this.position.x - other.position.x;
        let y_diff = this.position.y - other.position.y;
        let dist = Math.sqrt(x_diff * x_diff + y_diff * y_diff);
        return dist < this.radius || dist < other.radius;
    }

    angleTo(vector) {
        let x_diff = this.position.x - vector.x;
        let y_diff = this.position.y - vector.y;
        return Math.atan2(y_diff, x_diff) - (Math.PI / 2);;
    }

    lookAt(vector) {
        this.angle = this.angleTo(vector);
    }


    // overriden at Rect/Circle level because Rect uses width/height while circle uses radius
    isOutOfBounds() {
        return false;
    }


    update(deltaTime) {
        // this only exists sometimes, like if this object has an animation that needs to be updated
        // its more efficient to set these funcitons one time in constructor than do an if statement for every loop
        this.update_dynamic(deltaTime);
    }


    // overridable method for drawing in local space (TODO: might need draw_local_before, draw_local_after...)
    draw_local() { };

    // ortho doesn't rotate in local space (0 degrees = UP, 90 = RIGHT, 180 = DOWN, 270 = LEFT)
    draw_orthographic() {
        this.draw_before();

        ctx.translate(this.position.x, this.position.y);


        this.draw_dynamic();
        this.draw_local();
        this.draw_debug();

        ctx.translate(-this.position.x, -this.position.y);

        this.draw_after();

    }

    // topdown rotates in local space (0 = FORWARD, 90 = RIGHT, 180 = BACKWARD, 270 = LEFT)
    draw_topdown() {
        this.draw_before();

        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.angle);

        this.draw_dynamic();
        this.draw_local();
        this.draw_debug();

        ctx.rotate(-this.angle);
        ctx.translate(-this.position.x, -this.position.y);

        this.draw_after();
    }


    // before draw happens before we enter local coordinate system
    draw_before() { }
    // after draw happens after we have left local coordinate system
    draw_after() { }


}



GameObject.Circle = class Circle extends GameObject {
    constructor(args = {}) {
        super(args);
        this.radius = typeof args.radius === "number" ? args.radius : 5;
    }

    isColliding(other) {
        return other instanceof GameObject.Circle ?
            GameObject.Collisions.Circle_Circle(other, this) :
            GameObject.Collisions.Rect_Circle(other, this);
    }


    containsPoint(point) {
        return this.dist(point) <= this.radius;
    }

    draw_shape() {
        draw.circle(new Vector(), this.radius, this.color);
    }
    draw_image() {
        ctx.drawImage(this.img, this.sx, this.sy, this.sWidth, this.sHeight, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
    }
    draw_animation() {
        this.animation.draw(new Vector(this.radius * 2, this.radius * 2), new Vector(-this.radius, -this.radius), this.angle, this.alpha);
    }

    draw_debug() {
        if (debug) {
            let pos = new Vector();
            draw.circle_outline(pos, this.radius);
            draw.circle(pos, 4);
            draw.line(pos, pos.add(new Vector(0, -this.radius)));
        }
    }

    isOutOfBounds() {
        if (!this.ignore_bounds) {
            if (this.position.x < 0) {
                return true;
            }
            if (this.position.x + this.radius / 2 > canvas.width) {
                return true;
            }
            if (this.position.y < 0) {
                return true;
            }
            if (this.position.y + this.radius / 2 > canvas.height) {
                return true;
            }
        }

        return false;
    }
}



GameObject.Rect = class Rect extends GameObject {
    constructor(args = {}) {
        super(args);
        this.size = args.size instanceof Vector ? args.size : new Vector(10, 10);
    }

    isColliding(other) {
        return other instanceof GameObject.Circle ?
            GameObject.Collisions.Rect_Circle(this, other) :
            GameObject.Collisions.Rect_Rect(this, other);
    }

    getVertices() {
        let half_width = this.size.x / 2;
        let half_height = this.size.y / 2;

        return [
            new Vector(this.position.x - half_width, this.position.y - half_height).rotate(this.angle, this.position),
            new Vector(this.position.x + half_width, this.position.y - half_height).rotate(this.angle, this.position),
            new Vector(this.position.x + half_width, this.position.y + half_height).rotate(this.angle, this.position),
            new Vector(this.position.x - half_width, this.position.y + half_height).rotate(this.angle, this.position)
        ];
    }

    containsPoint(point) {
        let p = point.rotate(this.angle, this.position);
        return p.x >= (this.position.x - this.size.x / 2) &&
            p.x <= (this.position.x + this.size.x / 2) &&
            p.y >= (this.position.y - this.size.y / 2) &&
            p.y <= (this.position.y + this.size.y / 2);

    }

    draw_shape() {
        draw.rect(new Vector(-this.size.x / 2, -this.size.y / 2), this.size, this.color);
    }
    draw_image() {
        ctx.drawImage(this.img, this.sx, this.sy, this.sWidth, this.sHeight, -this.size.x / 2, -this.size.y / 2, this.size.x, this.size.y);
    }
    draw_animation() {
        this.animation.draw(this.size, new Vector(-this.size.x / 2, -this.size.y / 2), this.angle, this.alpha);
    }
    draw_debug() {
        if (debug) {
            let pos = new Vector();
            draw.rect_outline(this.size.divide(-2), this.size);
            draw.circle(pos, 4);
            draw.line(pos, pos.add(new Vector(0, -this.size.y)));
        }
    }

    isOutOfBounds() {
        if (!this.ignore_bounds) {
            if (this.position.x - this.size.x / 2 < 0) {
                return true;
            }
            if (this.position.x + this.size.x / 2 > canvas.width) {
                return true;
            }
            if (this.position.y - this.size.y / 2 < 0) {
                return true;
            }
            if (this.position.y + this.size.y / 2 > canvas.height) {
                return true;
            }
        }
        return false;
    }
}



GameObject.Collisions = {
    Circle_Circle: function (a, b) {
        let x_diff = a.position.x - b.position.x;
        let y_diff = a.position.y - b.position.y;
        let dist = Math.sqrt(x_diff * x_diff + y_diff * y_diff);
        return dist < a.radius || dist < b.radius;
    },


    Rect_Circle: function (rect, circle) {
        // get circle in rectangles local coordinates, then do normal rect/circle collision
        let circle_local = circle.position.rotate(-rect.angle, rect.position);
        let circle_dist = new Vector(Math.abs(circle_local.x - rect.position.x), Math.abs(circle_local.y - rect.position.y));

        if (circle_dist.x > rect.size.x / 2 + circle.radius) { return false; }
        if (circle_dist.y > rect.size.y / 2 + circle.radius) { return false; }
        if (circle_dist.x <= rect.size.x / 2) { return true; }
        if (circle_dist.y <= rect.size.y / 2) { return true; }

        let corner_dist_sq = Math.pow(circle_dist.x - rect.size.x / 2, 2) + Math.pow(circle_dist.y - rect.size.y / 2, 2);
        return (corner_dist_sq <= Math.pow(circle.radius, 2));
    },


    _Rect_Rect: function (a, b) {
        console.log("RECT_RECT");
        let a_vertices = a.getVertices();
        let b_vertices = b.getVertices();

        for (i = 0; i < 4; i++) {
            let vert1 = a_vertices[i];
            let vert2 = a_vertices[(i + 1) % 4];

            let normal_x = vert2.y - vert1.y;
            let normal_y = vert1.x - vert2.x;

            for (j = 0; j < 4; j++) {
                let vert3 = b_vertices[j];

                let dot_product = ((vert3.x - vert1.x) * normal_x) + ((vert3.y - vert1.y) * normal_y);
                if (dot_product <= 0) {
                    break;
                }
                if (j == 3) {
                    // all dots were +ve, found a separating axis
                    return true;
                }
            }
        }

        return false;
    },
    Rect_Rect: function (a, b) {
        return !(this._Rect_Rect(a, b) || this._Rect_Rect(b, a));
    }
}
