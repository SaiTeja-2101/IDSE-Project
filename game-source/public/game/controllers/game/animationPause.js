// Paused scanner tweens are waiting for the conveyor. They must stay paused
// when the player returns to the game.
export function createAnimationPauseController(engine) {
    let running = null;
    return {
        pause() {
            if (running !== null) return;
            running = engine.getAllTweens(true).filter(animation => !animation.paused());
            running.forEach(animation => animation.paused(true));
        },
        resume() {
            if (running === null) return;
            const previous = running;
            running = null;
            previous.forEach(animation => animation.paused(false));
        },
    };
}
