/*
 * Unit Tests: Time Formatting & Companion Cadences
 * Tests pure time conversion logic used across PAWSE timer displays.
 */

function formatTime(remainingTime) {
    let minutes = Math.floor(remainingTime / 60);
    let secs = remainingTime % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

const catConfiguration = {   
    orange: {
        workTime: 15 * 60,
        shortBreakTime: 3 * 60,
        longBreakTime: 12 * 60,
        dbId: "orange_cat"
    },
    tuxedo: {
        workTime: 25 * 60,
        shortBreakTime: 5 * 60,
        longBreakTime: 20 * 60,
        dbId: "tuxedo_cat"
    },   
    black: {
        workTime: 50 * 60,
        shortBreakTime: 10 * 60,
        longBreakTime: 40 * 60,
        dbId: "black_cat"
    }
};

describe("Time Formatting (formatTime)", () => {
    test("formats 25 minutes (1500s) correctly for Tuxedo cat", () => {
        expect(formatTime(1500)).toBe("25:00");
    });

    test("formats 15 minutes (900s) correctly for Orange cat", () => {
        expect(formatTime(900)).toBe("15:00");
    });

    test("formats 50 minutes (3000s) correctly for Black cat", () => {
        expect(formatTime(3000)).toBe("50:00");
    });

    test("pads single-digit seconds with a leading zero (e.g. 5s -> '00:05')", () => {
        expect(formatTime(5)).toBe("00:05");
    });

    test("formats boundary values (0s -> '00:00')", () => {
        expect(formatTime(0)).toBe("00:00");
    });

    test("formats mixed minutes and seconds (65s -> '01:05')", () => {
        expect(formatTime(65)).toBe("01:05");
    });
});

describe("Companion Cadence Configurations", () => {
    test("Orange cat has 15m work, 3m short break, 12m long break", () => {
        expect(catConfiguration.orange.workTime).toBe(900);
        expect(catConfiguration.orange.shortBreakTime).toBe(180);
        expect(catConfiguration.orange.longBreakTime).toBe(720);
    });

    test("Tuxedo cat has 25m work, 5m short break, 20m long break", () => {
        expect(catConfiguration.tuxedo.workTime).toBe(1500);
        expect(catConfiguration.tuxedo.shortBreakTime).toBe(300);
        expect(catConfiguration.tuxedo.longBreakTime).toBe(1200);
    });

    test("Black cat has 50m work, 10m short break, 40m long break", () => {
        expect(catConfiguration.black.workTime).toBe(3000);
        expect(catConfiguration.black.shortBreakTime).toBe(600);
        expect(catConfiguration.black.longBreakTime).toBe(2400);
    });
});
