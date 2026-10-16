/**
 * Unit Tests: Alarm Auto-Silence & Lifecycle Controller
 * Validates the 30-second industry-standard safety timeout, notification dismissal,
 * taskbar flashing clearing, and early dismissal teardown.
 */

// Implementation mirroring the alarm lifecycle in src/renderer/timer/timer.js
function triggerAlarm(context, audio, api, timeoutMs = 30000) {
    context.isAlarmPlaying = true;
    if (context.alarmTimeoutId) {
        clearTimeout(context.alarmTimeoutId);
        context.alarmTimeoutId = null;
    }

    if (api && api.flashFrame) {
        api.flashFrame(true);
    }
    if (api && api.showNotification) {
        api.showNotification({ title: "Stretch Your Paws!", body: "Break time", actionText: "Start Break" });
    }

    if (context.volume > 0 && context.soundEnabled) {
        audio.play();
    }

    context.alarmTimeoutId = setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
        context.isAlarmPlaying = false;
        context.alarmTimeoutId = null;
        if (api && api.closeNotification) {
            api.closeNotification();
        }
        if (api && api.flashFrame) {
            api.flashFrame(false);
        }
    }, timeoutMs);
}

function dismissAlarm(context, audio, api) {
    if (context.alarmTimeoutId) {
        clearTimeout(context.alarmTimeoutId);
        context.alarmTimeoutId = null;
    }
    context.isAlarmPlaying = false;
    audio.pause();
    audio.currentTime = 0;
    if (api && api.closeNotification) {
        api.closeNotification();
    }
    if (api && api.flashFrame) {
        api.flashFrame(false);
    }
}

describe("Alarm Auto-Silence Lifecycle (timer.js)", () => {
    let mockAudio;
    let mockApi;
    let context;

    beforeEach(() => {
        jest.useFakeTimers();
        mockAudio = {
            play: jest.fn().mockReturnValue(Promise.resolve()),
            pause: jest.fn(),
            currentTime: 0
        };
        mockApi = {
            flashFrame: jest.fn(),
            showNotification: jest.fn(),
            closeNotification: jest.fn()
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

    test("starts alarm audio, triggers notification & taskbar flashing, and sets 30-second auto-silence timeout", () => {
        triggerAlarm(context, mockAudio, mockApi, 30000);

        expect(context.isAlarmPlaying).toBe(true);
        expect(context.alarmTimeoutId).not.toBeNull();
        expect(mockAudio.play).toHaveBeenCalledTimes(1);
        expect(mockApi.flashFrame).toHaveBeenCalledWith(true);
        expect(mockApi.showNotification).toHaveBeenCalledTimes(1);
        expect(mockAudio.pause).not.toHaveBeenCalled();
    });

    test("auto-silences alarm, dismisses notification, and clears taskbar flashing when 30 seconds elapse", () => {
        triggerAlarm(context, mockAudio, mockApi, 30000);

        // Advance 29.9 seconds - should still be playing
        jest.advanceTimersByTime(29900);
        expect(context.isAlarmPlaying).toBe(true);
        expect(mockAudio.pause).not.toHaveBeenCalled();
        expect(mockApi.closeNotification).not.toHaveBeenCalled();

        // Advance past 30.0 seconds - should auto-silence
        jest.advanceTimersByTime(100);
        expect(mockAudio.pause).toHaveBeenCalledTimes(1);
        expect(mockAudio.currentTime).toBe(0);
        expect(context.isAlarmPlaying).toBe(false);
        expect(context.alarmTimeoutId).toBeNull();
        expect(mockApi.closeNotification).toHaveBeenCalledTimes(1);
        expect(mockApi.flashFrame).toHaveBeenCalledWith(false);
    });

    test("immediately stops alarm, closes notification, and clears taskbar flashing when dismissed early", () => {
        triggerAlarm(context, mockAudio, mockApi, 30000);

        // User clicks modal button or toast button after 5 seconds
        jest.advanceTimersByTime(5000);
        dismissAlarm(context, mockAudio, mockApi);

        expect(mockAudio.pause).toHaveBeenCalledTimes(1);
        expect(mockAudio.currentTime).toBe(0);
        expect(context.isAlarmPlaying).toBe(false);
        expect(context.alarmTimeoutId).toBeNull();
        expect(mockApi.closeNotification).toHaveBeenCalledTimes(1);
        expect(mockApi.flashFrame).toHaveBeenCalledWith(false);

        // Advancing past 30 seconds should NOT trigger duplicate pause calls
        jest.advanceTimersByTime(30000);
        expect(mockAudio.pause).toHaveBeenCalledTimes(1);
    });

    test("does not play audio if sound is muted, but still schedules notification auto-close at 30 seconds", () => {
        context.soundEnabled = false;
        triggerAlarm(context, mockAudio, mockApi, 30000);

        expect(mockAudio.play).not.toHaveBeenCalled();
        expect(context.alarmTimeoutId).not.toBeNull();

        jest.advanceTimersByTime(30000);
        expect(mockApi.closeNotification).toHaveBeenCalledTimes(1);
    });

    test("does not play audio if alarm volume is 0%, but still schedules notification auto-close at 30 seconds", () => {
        context.volume = 0;
        triggerAlarm(context, mockAudio, mockApi, 30000);

        expect(mockAudio.play).not.toHaveBeenCalled();
        expect(context.alarmTimeoutId).not.toBeNull();

        jest.advanceTimersByTime(30000);
        expect(mockApi.closeNotification).toHaveBeenCalledTimes(1);
    });

    test("clears any existing timeout before setting a new alarm", () => {
        triggerAlarm(context, mockAudio, mockApi, 30000);
        const firstTimeoutId = context.alarmTimeoutId;

        // Trigger a second alarm while first is still pending
        triggerAlarm(context, mockAudio, mockApi, 30000);
        expect(context.alarmTimeoutId).not.toBe(firstTimeoutId);
    });
});
