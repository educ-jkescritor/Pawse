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
        this.strictMode = initialState.strictMode ?? false;
        this.isAlarmPlaying = initialState.isAlarmPlaying ?? false;
        this.preSkipState = null;
        this.modalOpen = false;
        this.modalData = null;
        this.pendingModal = null;
        this.nextPhaseState = null;
        this.mockApi = initialState.mockApi || {
            closeNotification: jest.fn(),
            flashFrame: jest.fn(),
            resize: jest.fn()
        };
    }

    syncStrictModeButtons() {
        const skipDisabled = Boolean(this.strictMode || this.pendingModal);
        const playDisabled = Boolean(this.strictMode && !this.pendingModal);
        return {
            skipDisabled,
            playDisabled,
            skipTitle: this.strictMode
                ? "Strict Mode is enabled (skipping disabled)"
                : (this.pendingModal ? "Session complete — press Play to start next session" : "Skip Session (S)"),
            playTitle: (this.strictMode && !this.pendingModal)
                ? "Strict Mode is enabled (pausing disabled)"
                : (this.pendingModal ? "Start Next Session (Space)" : "Play / Pause (Space)")
        };
    }

    manualSkip() {
        if (this.strictMode || this.isAlarmPlaying || this.pendingModal) {
            return false;
        }

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
        return true;
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

    naturalComplete(nextRemainingTime, isFinalSession = false) {
        this.preSkipState = null; // Natural completion has no rollback
        this.isRunning = false;
        this.modalOpen = true;

        if (this.workingTime) {
            this.modalData = {
                title: "Stretch Your Paws!",
                isManualSkip: false
            };
            this.nextPhaseState = { remainingTime: nextRemainingTime, workingTime: false };
        } else {
            this.modalData = {
                title: isFinalSession ? "Paws-itively Brilliant!" : "Ready to Focus?",
                isManualSkip: false
            };
            this.nextPhaseState = isFinalSession ? null : { remainingTime: nextRemainingTime, workingTime: true };
        }

        this.pendingModal = {
            title: this.modalData.title,
            nextAction: () => {
                if (this.workingTime) {
                    this.workingTime = false;
                } else {
                    this.workingTime = true;
                    this.cycleCount++;
                }
                this.remainingTime = nextRemainingTime;
                this.isRunning = true;
                this.modalOpen = false;
            }
        };
    }

    advancePendingModalInMiniMode() {
        if (!this.pendingModal) return false;

        this.isAlarmPlaying = false;
        if (this.mockApi?.closeNotification) this.mockApi.closeNotification();
        if (this.mockApi?.flashFrame) this.mockApi.flashFrame(false);

        // Cycle 4 complete (Final session of the full set): expand to default view
        if (this.cycleCount === 4 && !this.workingTime) {
            if (this.mockApi?.resize) this.mockApi.resize('default');
            this.modalOpen = true;
            return true;
        }

        const next = this.pendingModal.nextAction;
        this.pendingModal = null;
        this.nextPhaseState = null;
        next();
        return true;
    }
}

function hideModal(modalElement, onComplete) {
    if (!modalElement || modalElement.classList.contains("hidden")) {
        if (onComplete) onComplete();
        return;
    }
    if (modalElement.classList.contains("closing")) {
        return; // Guard against rapid multi-clicks while fade-out animation is in progress
    }
    modalElement.classList.add("closing");
    modalElement.classList.remove("closing");
    modalElement.classList.add("hidden");
    if (onComplete) onComplete();
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
        const skipped = controller.manualSkip();

        expect(skipped).toBe(true);
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
        controller.naturalComplete(300);

        expect(controller.modalOpen).toBe(true);
        expect(controller.preSkipState).toBeNull();

        // Attempting to cancel natural completion should be safely ignored
        controller.cancelSkip();

        expect(controller.modalOpen).toBe(true); // Modal remains open
        expect(controller.remainingTime).toBe(0);
    });
});

describe("Mini Mode Hierarchy at 00:00 (Approach A)", () => {
    let controller;
    let mockApi;

    beforeEach(() => {
        mockApi = {
            closeNotification: jest.fn(),
            flashFrame: jest.fn(),
            resize: jest.fn()
        };
        controller = new TimerSessionController({
            remainingTime: 0,
            workingTime: true,
            cycleCount: 0,
            isRunning: false,
            isAlarmPlaying: true,
            mockApi
        });
        controller.naturalComplete(300); // 5 min short break staged
    });

    test("disables manual skip when session is at 00:00 with pendingModal staged", () => {
        const buttonState = controller.syncStrictModeButtons();
        expect(buttonState.skipDisabled).toBe(true);
        expect(buttonState.skipTitle).toBe("Session complete — press Play to start next session");

        const skipResult = controller.manualSkip();
        expect(skipResult).toBe(false);
    });

    test("advancePendingModalInMiniMode silences alarm, clears taskbar flash/notification, and starts next phase", () => {
        const advanced = controller.advancePendingModalInMiniMode();

        expect(advanced).toBe(true);
        expect(controller.isAlarmPlaying).toBe(false);
        expect(mockApi.closeNotification).toHaveBeenCalledTimes(1);
        expect(mockApi.flashFrame).toHaveBeenCalledWith(false);
        expect(controller.pendingModal).toBeNull();
        expect(controller.nextPhaseState).toBeNull();
        expect(controller.workingTime).toBe(false);
        expect(controller.remainingTime).toBe(300);
        expect(controller.isRunning).toBe(true);
    });

    test("advancePendingModalInMiniMode expands window to default when final set (cycle 4) completes", () => {
        const finalController = new TimerSessionController({
            remainingTime: 0,
            workingTime: false,
            cycleCount: 4,
            isRunning: false,
            mockApi
        });
        finalController.naturalComplete(0, true);

        const advanced = finalController.advancePendingModalInMiniMode();

        expect(advanced).toBe(true);
        expect(mockApi.resize).toHaveBeenCalledWith('default');
        expect(finalController.modalOpen).toBe(true);
    });
});

describe("Strict Mode Interaction", () => {
    test("locks manualSkip and play/pause during active countdowns", () => {
        const strictController = new TimerSessionController({
            remainingTime: 1200,
            workingTime: true,
            cycleCount: 0,
            isRunning: true,
            strictMode: true
        });

        const buttons = strictController.syncStrictModeButtons();
        expect(buttons.skipDisabled).toBe(true);
        expect(buttons.playDisabled).toBe(true);
        expect(buttons.skipTitle).toContain("Strict Mode is enabled");
        expect(buttons.playTitle).toContain("Strict Mode is enabled");

        expect(strictController.manualSkip()).toBe(false);
    });

    test("unlocks play button at 00:00 so user can advance to next session", () => {
        const strictController = new TimerSessionController({
            remainingTime: 0,
            workingTime: true,
            cycleCount: 0,
            isRunning: false,
            strictMode: true
        });
        strictController.naturalComplete(300);

        const buttons = strictController.syncStrictModeButtons();
        expect(buttons.skipDisabled).toBe(true); // Skip remains locked
        expect(buttons.playDisabled).toBe(false); // Play is unlocked at 00:00!
        expect(buttons.playTitle).toBe("Start Next Session (Space)");
    });
});

describe("Modal Animation Spam & Double-Click Protection", () => {
    test("guards against rapid multi-clicks when modal has 'closing' class", () => {
        const onComplete = jest.fn();
        const classList = new Set(["closing"]);
        const modalElement = {
            classList: {
                contains: (cls) => classList.has(cls),
                add: (cls) => classList.add(cls),
                remove: (cls) => classList.delete(cls)
            }
        };

        hideModal(modalElement, onComplete);
        expect(onComplete).not.toHaveBeenCalled();
    });

    test("closes modal and triggers onComplete on normal single invocation", () => {
        const onComplete = jest.fn();
        const classList = new Set();
        const modalElement = {
            classList: {
                contains: (cls) => classList.has(cls),
                add: (cls) => classList.add(cls),
                remove: (cls) => classList.delete(cls)
            }
        };

        hideModal(modalElement, onComplete);
        expect(onComplete).toHaveBeenCalledTimes(1);
        expect(classList.has("hidden")).toBe(true);
    });
});
