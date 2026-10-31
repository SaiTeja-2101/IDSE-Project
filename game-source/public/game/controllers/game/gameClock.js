// One clock for game delays. Pausing keeps the remaining time intact.
export class GameClock {
    constructor() { this.paused = false; this.jobs = new Set(); this.pausedDuration = 0; this.pauseStarted = null; }
    now() { return (this.paused ? this.pauseStarted : performance.now()) - this.pausedDuration; }
    schedule(callback, delay) {
        const job = {callback, remaining: Math.max(0, delay), timer: null, started: 0};
        this.jobs.add(job);
        if (!this.paused) this.arm(job);
        return job;
    }
    arm(job) {
        job.started = performance.now();
        job.timer = setTimeout(() => { this.jobs.delete(job); job.callback(); }, job.remaining);
    }
    cancel(job) { if (job) { clearTimeout(job.timer); this.jobs.delete(job); } }
    wait(milliseconds) { return new Promise(resolve => this.schedule(resolve, milliseconds)); }
    setPaused(paused) {
        if (paused === this.paused) return;
        if (paused) this.pauseStarted = performance.now();
        else { this.pausedDuration += performance.now() - this.pauseStarted; this.pauseStarted = null; }
        this.paused = paused;
        for (const job of this.jobs) {
            if (paused) {
                clearTimeout(job.timer);
                job.remaining = Math.max(0, job.remaining - (performance.now() - job.started));
            } else this.arm(job);
        }
    }
}
export const gameClock = new GameClock();
