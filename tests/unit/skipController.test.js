/**
 * Unit Tests: Skip Confirmation & Rollback State Machine
 * Validates state snapshotting, cancellation rollbacks, and natural completion guards.
 */

class TimerSessionController {
    constructor(initialState = {}) {
        this.remainingTime = initialState.remainingTime ?? 1500;
        this.workingTime = initialState.workingTime ?? true;
        this.cycleCount = initialState.cycleCount ?? 0;
        this.isRunning = initialState.isRunning ?? true;
        this.preSkipState = null;
        this.modalOpen = false;
        this.modalData = null;
    }

    manualSkip() {
        // Snapshot pre-skip state so accidental skip can be canceled
        this.preSkipState = {
            remainingTime: this.remainingTime,
            workingTime: this.workingTime,
            cycleCount: this.cycleCount,
            wasRunning: this.isRunning
        };

        this.isRunning = false; // Pause while confirmation modal is active
        this.modalOpen = true;

        if (this.workingTime) {
            this.modalData = {
                title: "Take an Early Break?",
                isManualSkip: true
            };
        } else {
            this.modalData = {
                title: "End Break Early?",
                isManualSkip: true
            };
        }
    }

    confirmSkip(nextRemainingTime) {
        if (!this.modalOpen) return;

        this.preSkipState = null;
        this.modalOpen = false;
        this.modalData = null;

        if (this.workingTime) {
            this.workingTime = false;
        } else {
            this.workingTime = true;
            this.cycleCount++;
        }

        this.remainingTime = nextRemainingTime;
        this.isRunning = true;
    }

    cancelSkip() {
        // If not a manual skip or modal is not open, ignore cancel attempt
        if (!this.preSkipState || !this.modalOpen) return;

        const restored = this.preSkipState;
        this.preSkipState = null;
        this.modalOpen = false;
        this.modalData = null;

        this.remainingTime = restored.remainingTime;
        this.workingTime = restored.workingTime;
        this.cycleCount = restored.cycleCount;
        this.isRunning = restored.wasRunning;
    }

    naturalComplete() {
        this.preSkipState = null; // Natural completion has no rollback
        this.isRunning = false;
        this.modalOpen = true;

        if (this.workingTime) {
            this.modalData = {
                title: "Stretch Your Paws!",
                isManualSkip: false
            };
        } else {
            this.modalData = {
                title: "Ready to Focus?",
                isManualSkip: false
            };
        }
    }
}

describe("Skip Confirmation & Rollback State Machine", () => {
    let controller;

    beforeEach(() => {
        controller = new TimerSessionController({
            remainingTime: 1125, // 18m 45s into sprint
            workingTime: true,
            cycleCount: 1,
            isRunning: true
        });
    });

    test("manualSkip snapshots active state and pauses timer while modal is open", () => {
        controller.manualSkip();

        expect(controller.modalOpen).toBe(true);
        expect(controller.isRunning).toBe(false);
        expect(controller.modalData.title).toBe("Take an Early Break?");
        expect(controller.preSkipState).toEqual({
            remainingTime: 1125,
            workingTime: true,
            cycleCount: 1,
            wasRunning: true
        });
    });

    test("cancelSkip cleanly rolls back remaining time, phase, and resumes running timer", () => {
        controller.manualSkip();
        controller.cancelSkip();

        expect(controller.modalOpen).toBe(false);
        expect(controller.preSkipState).toBeNull();
        expect(controller.remainingTime).toBe(1125);
        expect(controller.workingTime).toBe(true);
        expect(controller.cycleCount).toBe(1);
        expect(controller.isRunning).toBe(true); // Resumes because wasRunning was true
    });

    test("cancelSkip leaves timer paused if it was already paused before clicking skip", () => {
        controller.isRunning = false; // User had manually paused before skipping
        controller.manualSkip();
        controller.cancelSkip();

        expect(controller.remainingTime).toBe(1125);
        expect(controller.isRunning).toBe(false); // Stays paused
    });

    test("confirmSkip commits phase transition and clears pre-skip snapshot", () => {
        controller.manualSkip();
        controller.confirmSkip(300); // 5 min break

        expect(controller.modalOpen).toBe(false);
        expect(controller.preSkipState).toBeNull();
        expect(controller.workingTime).toBe(false); // Transitioned to break
        expect(controller.remainingTime).toBe(300);
        expect(controller.isRunning).toBe(true);
    });

    test("cancelSkip rolls back cycleCount when canceling a break skip", () => {
        const breakController = new TimerSessionController({
            remainingTime: 180,
            workingTime: false,
            cycleCount: 2,
            isRunning: true
        });

        breakController.manualSkip();
        expect(breakController.modalData.title).toBe("End Break Early?");

        breakController.cancelSkip();

        expect(breakController.workingTime).toBe(false); // Still in break
        expect(breakController.cycleCount).toBe(2);      // Cycle count preserved
        expect(breakController.remainingTime).toBe(180);
        expect(breakController.isRunning).toBe(true);
    });

    test("natural completion at 00:00 cannot be rolled back by cancelSkip", () => {
        controller.remainingTime = 0;
        controller.naturalComplete();

        expect(controller.modalOpen).toBe(true);
        expect(controller.preSkipState).toBeNull();

        // Attempting to cancel natural completion should be safely ignored
        controller.cancelSkip();

        expect(controller.modalOpen).toBe(true); // Modal remains open
        expect(controller.remainingTime).toBe(0);
    });
});
