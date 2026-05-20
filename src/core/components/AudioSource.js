import { Component } from "../Component.js";

export class AudioSource extends Component {
    constructor({
        clips       = {},    // named clip map  { run: './assets/run.mp3', ... }
        clip        = null,  // default clip (used by play())
        volume      = 1,
        loop        = false,
        playOnStart = false,
    } = {}) {
        super();

        this.clips       = clips;
        this.clip        = clip;
        this.volume      = volume;
        this.loop        = loop;
        this.playOnStart = playOnStart;

        // all active one-shot handles
        this._handles = [];

        // active loops keyed by clip name/path  { 'run' → handle }
        this._activeLoops = new Map();
    }

    // ─────────────────────────────────────────────────────────────
    //  LIFECYCLE
    // ─────────────────────────────────────────────────────────────

    init() {
        this.transform = this.entity.getComponent("transform");
    }

    start() {
        if (this.playOnStart) this.play();
    }

    update() {
        // keep looping sounds in sync with entity position
        if (this.transform) {
            for (const handle of this._activeLoops.values()) {
                handle.setPosition?.(this.transform.position);
            }
        }
    }

    // ─────────────────────────────────────────────────────────────
    //  RESOLVE  — name → path
    // ─────────────────────────────────────────────────────────────

    _resolveClip(clip) {
        if (this.clips && this.clips[clip]) return this.clips[clip];
        return clip; // raw path fallback — './assets/run.mp3' still works
    }

    // ─────────────────────────────────────────────────────────────
    //  PLAY  — default clip
    // ─────────────────────────────────────────────────────────────

    /**
     * Play the default clip assigned in constructor.
     * Respects the loop flag.
     */
    play(options = {}) {
        if (!this.clip) return;
        return this.loop
            ? this.playLoop(this.clip, options)
            : this.playOneShot(this.clip, options);
    }

    // ─────────────────────────────────────────────────────────────
    //  ONE-SHOT  — overlapping SFX
    // ─────────────────────────────────────────────────────────────

    /**
     * Play a sound once. Multiple calls overlap — great for SFX.
     * Supports named clips or raw paths.
     *
     * @param {string} clip    — clip name ('jump') or path ('./assets/jump.mp3')
     * @param {object} options
     * @param {number} options.volume      — overrides component volume
     * @param {{x,y}}  options.position   — world position for spatial audio
     *                                      defaults to entity transform position
     */
    playOneShot(clip, options = {}) {
        const resolved = this._resolveClip(clip);

        const handle = this._audio().play(resolved, {
            volume:   options.volume ?? this.volume,
            position: options.position ?? this.transform?.position ?? null,
        });

        this._handles.push(handle);

        // auto-cleanup finished handles
        setTimeout(() => {
            this._handles = this._handles.filter(h => h !== handle);
        }, 10000); // generous timeout — manager cleans up on onended anyway

        return handle;
    }

    // ─────────────────────────────────────────────────────────────
    //  LOOP  — ambient / music / engine hum
    // ─────────────────────────────────────────────────────────────

    /**
     * Play a looping sound. Calling again with the same clip name
     * is safe — it will NOT stack a second instance, just updates position.
     * 
     * @param {string} clip    — clip name ('run') or path ('./assets/run.mp3')
     * @param {object} options
     * @param {number} options.volume
     * @param {{x,y}}  options.position
     */
    playLoop(clip, options = {}) {
        const resolved = this._resolveClip(clip);

        // already playing — just sync position, return existing handle
        if (this._activeLoops.has(clip)) {
            const existing = this._activeLoops.get(clip);
            existing.setPosition?.(options.position ?? this.transform?.position);
            return existing;
        }

        const handle = this._audio().playLoop(resolved, {
            volume:   options.volume ?? this.volume,
            position: options.position ?? this.transform?.position ?? null,
        });

        this._activeLoops.set(clip, handle);
        return handle;
    }

    // ─────────────────────────────────────────────────────────────
    //  STOP
    // ─────────────────────────────────────────────────────────────

    /**
     * Stop a specific looping sound by name.
     * 
     * @param {string} clip  — same name used in playLoop()
     */
    stopLoop(clip) {
        const handle = this._activeLoops.get(clip);
        if (!handle) return;
        handle.stop();
        this._activeLoops.delete(clip);
    }

    /**
     * Stop ALL looping sounds on this source.
     */
    stopAllLoops() {
        for (const handle of this._activeLoops.values()) handle.stop();
        this._activeLoops.clear();
    }

    /**
     * Stop ALL sounds — loops and one-shots.
     */
    stopAll() {
        this.stopAllLoops();
        for (const handle of this._handles) handle.stop();
        this._handles = [];
    }

    // ─────────────────────────────────────────────────────────────
    //  QUERY
    // ─────────────────────────────────────────────────────────────

    /**
     * Check if a named loop is currently playing.
     * 
     * @param {string} clip  — clip name
     * @returns {boolean}
     */
    isPlaying(clip) {
        return this._activeLoops.has(clip);
    }

    // ─────────────────────────────────────────────────────────────
    //  INTERNAL
    // ─────────────────────────────────────────────────────────────

    _audio() {
        return this.entity.scene.game.audio;
    }
}