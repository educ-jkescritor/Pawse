/**
 * Unit Tests: Local Durable Execution Algorithm
 * Validates the crash-resilience delta deduction math used upon app reboot / sleep wake.
 */

function restoreDurableState(savedState, currentTimestamp, activeCatType) {
    if (!savedState || savedState.catType !== activeCatType) {
        return null; // Ignore if states do not belong to the same companion
    }

    const elapsedSeconds = Math.floor((currentTimestamp - savedState.timestamp) / 1000);
    let remainingTime = savedState.remainingTime;

    // If session was actively running when app closed/slept, deduct elapsed offline seconds
    if (savedState.isRunning) {
        remainingTime -= elapsedSeconds;
        if (remainingTime < 0) remainingTime = 0; // Clamp at zero to trigger completion
    }

    return {
        remainingTime,
        elapsedSeconds,
        isRunning: savedState.isRunning,
        cycleCount: savedState.cycleCount,
        workingTime: savedState.workingTime,
        isCompleted: remainingTime === 0
    };
}

function createDurableSnapshot(state, nextPhaseState = null, timestamp = Date.now()) {
    let durableRemaining = state.remainingTime;
    let durableWorking = state.workingTime;
    if (nextPhaseState && state.remainingTime <= 0) {
        durableRemaining = nextPhaseState.remainingTime;
        durableWorking = nextPhaseState.workingTime;
    }

    return {
        catType: state.catType,
        remainingTime: durableRemaining,
        workingTime: durableWorking,
        cycleCount: state.cycleCount,
        isRunning: state.isRunning,
        actualWork: state.actualWork || 0,
        actualBreak: state.actualBreak || 0,
        workCount: state.workCount || 0,
        breakCount: state.breakCount || 0,
        timestamp
    };
}

describe("Local Durable Execution Engine", () => {
    test("deducts exact offline elapsed time when timer was running", () => {
        const snapshotTime = 1000000000000;
        const savedState = {
            catType: "tuxedo",
            remainingTime: 1200, // 20 minutes remaining
            isRunning: true,
            workingTime: true,
            cycleCount: 0,
            timestamp: snapshotTime
        };

        // 300 seconds (5 minutes) pass while the app was closed
        const wakeTime = snapshotTime + (300 * 1000);
        const restored = restoreDurableState(savedState, wakeTime, "tuxedo");

        expect(restored).not.toBeNull();
        expect(restored.elapsedSeconds).toBe(300);
        expect(restored.remainingTime).toBe(900); // 1200 - 300 = 900s (15 min)
        expect(restored.isCompleted).toBe(false);
    });

    test("does NOT deduct elapsed time if timer was paused before closing", () => {
        const snapshotTime = 1000000000000;
        const savedState = {
            catType: "orange",
            remainingTime: 500,
            isRunning: false, // Manually paused by user
            workingTime: true,
            cycleCount: 1,
            timestamp: snapshotTime
        };

        // 1 hour passes offline
        const wakeTime = snapshotTime + (3600 * 1000);
        const restored = restoreDurableState(savedState, wakeTime, "orange");

        expect(restored).not.toBeNull();
        expect(restored.remainingTime).toBe(500); // Stays exact
        expect(restored.isRunning).toBe(false);
    });

    test("clamps remaining time at 0 and flags completion when offline time exceeds remaining time", () => {
        const snapshotTime = 1000000000000;
        const savedState = {
            catType: "black",
            remainingTime: 60, // 1 minute left
            isRunning: true,
            workingTime: true,
            cycleCount: 2,
            timestamp: snapshotTime
        };

        // Laptop was asleep overnight (8 hours = 28800s)
        const wakeTime = snapshotTime + (28800 * 1000);
        const restored = restoreDurableState(savedState, wakeTime, "black");

        expect(restored).not.toBeNull();
        expect(restored.remainingTime).toBe(0); // Clamped, not negative
        expect(restored.isCompleted).toBe(true);
    });

    test("rejects state restoration if user selected a different cat companion", () => {
        const savedState = {
            catType: "tuxedo",
            remainingTime: 1000,
            isRunning: true,
            timestamp: Date.now()
        };

        // User booted into "orange" cat instead of "tuxedo"
        const restored = restoreDurableState(savedState, Date.now() + 5000, "orange");
        expect(restored).toBeNull();
    });

    test("captures staged nextPhaseState in durable snapshot when session reaches 00:00", () => {
        const activeState = {
            catType: "tuxedo",
            remainingTime: 0,
            workingTime: true,
            cycleCount: 0,
            isRunning: false,
            actualWork: 1500,
            actualBreak: 0
        };

        const nextPhaseState = {
            remainingTime: 300, // 5 min short break
            workingTime: false
        };

        const snapshot = createDurableSnapshot(activeState, nextPhaseState, 1000000000000);

        expect(snapshot.remainingTime).toBe(300); // Saved the upcoming break time instead of 0
        expect(snapshot.workingTime).toBe(false);  // Saved next phase (break)
        expect(snapshot.cycleCount).toBe(0);
    });

    test("recovers cleanly into the next phase after crash or window reload at 00:00", () => {
        const snapshotTime = 1000000000000;
        const activeState = {
            catType: "black",
            remainingTime: 0,
            workingTime: true,
            cycleCount: 3,
            isRunning: false
        };

        // At 00:00 on cycle 3, next phase is long break (2400s / 40m)
        const nextPhaseState = {
            remainingTime: 2400,
            workingTime: false
        };

        const savedSnapshot = createDurableSnapshot(activeState, nextPhaseState, snapshotTime);

        // App crashes and reboots 10 seconds later
        const wakeTime = snapshotTime + 10000;
        const restored = restoreDurableState(savedSnapshot, wakeTime, "black");

        expect(restored).not.toBeNull();
        expect(restored.remainingTime).toBe(2400); // Successfully staged for long break!
        expect(restored.workingTime).toBe(false);
        expect(restored.isCompleted).toBe(false);
    });
});
