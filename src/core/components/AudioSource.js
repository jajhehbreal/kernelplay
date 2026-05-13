import { Component } from "../Component.js";

export class AudioSource extends Component {
    constructor({
        clip        = null,
        volume      = 1,
        loop        = false,
        playOnStart = false,
    } = {}) {
        super();

        this.clip        = clip;
        this.volume      = volume;
        this.loop        = loop;
        this.playOnStart = playOnStart;

        // active handles returned by AudioManager — used for stopAll / position sync
        this._handles = [];
    }

    init() {
        this.transform = this.entity.getComponent("transform");
    }

    start() {
        if (this.playOnStart) this.play();
    }

    // ─────────────────────────────────────────────
    //  PUBLIC API
    // ─────────────────────────────────────────────

    /** Play the default clip. Respects loop flag. */
    play(options = {}) {
        if (!this.clip) return;
        return this.loop
            ? this.playLoop(this.clip, options)
            : this.playOneShot(this.clip, options);
    }

    /**
     * Play a one-shot SFX (can overlap).
     * Spatial volume is driven by transform position.
     */
    playOneShot(clip, options = {}) {
        const handle = this._audio().play(clip, {
            volume:   options.volume ?? this.volume,
            position: this.transform?.position ?? null,
        });

        this._handles.push(handle);
        return handle;
    }

    /**
     * Play a looping sound at this entity's position.
     * FIX: position is now passed → distance fade works for loops too.
     * FIX: uses Web Audio API loop → no gap/delay.
     */
    playLoop(clip, options = {}) {
        const handle = this._audio().playLoop(clip, {
            volume:   options.volume ?? this.volume,
            position: this.transform?.position ?? null,
        });

        this._handles.push(handle);
        return handle;
    }

    /** Stop all sounds on this source. */
    stopAll() {
        for (const h of this._handles) h.stop();
        this._handles = [];
    }

    update() {
        // If this source has looping handles with positions, keep them synced
        // as the entity moves through the world.
        if (this.transform) {
            for (const h of this._handles) {
                h.setPosition?.(this.transform.position);
            }
        }
    }

    // ─────────────────────────────────────────────
    //  INTERNAL
    // ─────────────────────────────────────────────

    _audio() {
        return this.entity.scene.game.audio;
    }
}