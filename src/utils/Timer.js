export class Timer {
    constructor(duration = 1, autoStart = false) {
        this.duration = duration;
        this.time = 0;

        this.running = autoStart;
        this.finished = false;
    }

    start() {
        this.running = true;
        this.finished = false;
        this.time = 0;
    }

    reset() {
        this.time = 0;
        this.finished = false;
    }

    stop() {
        this.running = false;
    }

    update(dt) {
        if (!this.running || this.finished) return;

        this.time += dt;

        if (this.time >= this.duration) {
            this.time = this.duration; // clamp, no overshoot
            this.finished = true;
            this.running = false;
        }
    }

    isFinished() {
        return this.finished;
    }

    progress() {
        if (this.duration <= 0) return 1;
        return Math.min(this.time / this.duration, 1);
    }
}