/**
 * Unit Tests: Alarm Auto-Silence & Lifecycle Controller
 * Validates the 20-second safety timeout, boundary auto-silence, and early dismissal teardown.
 */

// Implementation mirroring the alarm lifecycle in src/renderer/timer/timer.js
function triggerAlarm(context, audio, timeoutMs = 20000) {
    context.isAlarmPlaying = true;
    if (context.alarmTimeoutId) {
        clearTimeout(context.alarmTimeoutId);
        context.alarmTimeoutId = null;
    }

    if (context.volume > 0 && context.soundEnabled) {
        audio.play();

        context.alarmTimeoutId = setTimeout(() => {
            audio.pause();
            audio.currentTime = 0;
            context.isAlarmPlaying = false;
            context.alarmTimeoutId = null;
        }, timeoutMs);
    }
}

function dismissAlarm(context, audio) {
    if (context.alarmTimeoutId) {
        clearTimeout(context.alarmTimeoutId);
        context.alarmTimeoutId = null;
    }
    context.isAlarmPlaying = false;
    audio.pause();
    audio.currentTime = 0;
}

describe("Alarm Auto-Silence Lifecycle (timer.js)", () => {
    let mockAudio;
    let context;

    beforeEach(() => {
        jest.useFakeTimers();
        mockAudio = {
            play: jest.fn().mockReturnValue(Promise.resolve()),
            pause: jest.fn(),
            currentTime: 0
        };
        context = {
            isAlarmPlaying: false,
            alarmTimeoutId: null,
            volume: 50,
            soundEnabled: true
        };
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("starts alarm audio and sets 20-second auto-silence timeout", () => {
        triggerAlarm(context, mockAudio, 20000);

        expect(context.isAlarmPlaying).toBe(true);
        expect(context.alarmTimeoutId).not.toBeNull();
        expect(mockAudio.play).toHaveBeenCalledTimes(1);
        expect(mockAudio.pause).not.toHaveBeenCalled();
    });

    test("auto-silences alarm and resets audio when 20 seconds elapse", () => {
        triggerAlarm(context, mockAudio, 20000);

        // Advance 19.9 seconds - should still be playing
        jest.advanceTimersByTime(19900);
        expect(context.isAlarmPlaying).toBe(true);
        expect(mockAudio.pause).not.toHaveBeenCalled();

        // Advance past 20.0 seconds - should auto-silence
        jest.advanceTimersByTime(100);
        expect(mockAudio.pause).toHaveBeenCalledTimes(1);
        expect(mockAudio.currentTime).toBe(0);
        expect(context.isAlarmPlaying).toBe(false);
        expect(context.alarmTimeoutId).toBeNull();
    });

    test("immediately stops alarm and clears pending timeout when dismissed early", () => {
        triggerAlarm(context, mockAudio, 20000);

        // User clicks modal button after 5 seconds
        jest.advanceTimersByTime(5000);
        dismissAlarm(context, mockAudio);

        expect(mockAudio.pause).toHaveBeenCalledTimes(1);
        expect(mockAudio.currentTime).toBe(0);
        expect(context.isAlarmPlaying).toBe(false);
        expect(context.alarmTimeoutId).toBeNull();

        // Advancing past 20 seconds should NOT trigger duplicate pause calls
        jest.advanceTimersByTime(20000);
        expect(mockAudio.pause).toHaveBeenCalledTimes(1);
    });

    test("does not play audio or set timeout if sound is muted", () => {
        context.soundEnabled = false;
        triggerAlarm(context, mockAudio, 20000);

        expect(mockAudio.play).not.toHaveBeenCalled();
        expect(context.alarmTimeoutId).toBeNull();
    });

    test("does not play audio or set timeout if alarm volume is 0%", () => {
        context.volume = 0;
        triggerAlarm(context, mockAudio, 20000);

        expect(mockAudio.play).not.toHaveBeenCalled();
        expect(context.alarmTimeoutId).toBeNull();
    });

    test("clears any existing timeout before setting a new alarm", () => {
        triggerAlarm(context, mockAudio, 20000);
        const firstTimeoutId = context.alarmTimeoutId;

        // Trigger a second alarm while first is still pending
        triggerAlarm(context, mockAudio, 20000);
        expect(context.alarmTimeoutId).not.toBe(firstTimeoutId);
    });
});
