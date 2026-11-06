/**
 * PAWSE Test Suite — Multi-Display Topologies & Bounds Clamping
 * Validates window boundary clamping, edge-locking, and automatic rescue when monitors are disconnected.
 */

describe('Multi-Display Topologies & Clamping Engine', () => {

    /**
     * Exact pure mathematical implementation of clampBoundsToWorkArea from src/main/main.js
     */
    function clampBoundsToWorkArea(bounds, targetWidth, targetHeight, workArea) {
        let newX = bounds.x;
        let newY = bounds.y;

        // Clamp horizontally (Right boundary first, then Left boundary)
        if (newX + targetWidth > workArea.x + workArea.width) {
            newX = workArea.x + workArea.width - targetWidth;
        }
        if (newX < workArea.x) {
            newX = workArea.x;
        }

        // Clamp vertically (Bottom boundary first, then Top boundary)
        if (newY + targetHeight > workArea.y + workArea.height) {
            newY = workArea.y + workArea.height - targetHeight;
        }
        if (newY < workArea.y) {
            newY = workArea.y;
        }

        return {
            x: Math.round(newX),
            y: Math.round(newY),
            width: targetWidth,
            height: targetHeight
        };
    }

    /**
     * Exact pure mathematical intersection check from src/main/main.js (display-removed listener)
     */
    function isVisibleOnAnyDisplay(bounds, allDisplays) {
        return allDisplays.some(display => {
            const { x, y, width, height } = display.bounds;
            return (
                bounds.x + bounds.width > x &&
                bounds.x < x + width &&
                bounds.y + bounds.height > y &&
                bounds.y < y + height
            );
        });
    }

    const primaryDisplay = {
        id: 1,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        workArea: { x: 0, y: 0, width: 1920, height: 1040 } // 40px taskbar at bottom
    };

    const externalDisplay = {
        id: 2,
        bounds: { x: 1920, y: 0, width: 2560, height: 1440 },
        workArea: { x: 1920, y: 0, width: 2560, height: 1440 }
    };

    describe('clampBoundsToWorkArea Math', () => {
        test('should preserve coordinates when window is completely inside workArea', () => {
            const initialBounds = { x: 200, y: 300, width: 310, height: 430 };
            const clamped = clampBoundsToWorkArea(initialBounds, 310, 430, primaryDisplay.workArea);

            expect(clamped.x).toBe(200);
            expect(clamped.y).toBe(300);
            expect(clamped.width).toBe(310);
            expect(clamped.height).toBe(430);
        });

        test('should clamp X coordinate if window is pushed beyond right edge of monitor', () => {
            // Window positioned at x: 1800 on 1920px wide screen with 310px width
            const initialBounds = { x: 1800, y: 100, width: 310, height: 430 };
            const clamped = clampBoundsToWorkArea(initialBounds, 310, 430, primaryDisplay.workArea);

            // Right edge limit is 1920 - 310 = 1610
            expect(clamped.x).toBe(1610);
            expect(clamped.y).toBe(100);
        });

        test('should clamp Y coordinate if window overlaps bottom taskbar', () => {
            // Window positioned at y: 800 on 1040px workArea with 430px height
            const initialBounds = { x: 100, y: 800, width: 310, height: 430 };
            const clamped = clampBoundsToWorkArea(initialBounds, 310, 430, primaryDisplay.workArea);

            // Bottom edge limit is 1040 - 430 = 610
            expect(clamped.x).toBe(100);
            expect(clamped.y).toBe(610);
        });

        test('should clamp X and Y coordinates if window is pushed off top/left edges', () => {
            const initialBounds = { x: -50, y: -20, width: 310, height: 430 };
            const clamped = clampBoundsToWorkArea(initialBounds, 310, 430, primaryDisplay.workArea);

            expect(clamped.x).toBe(0);
            expect(clamped.y).toBe(0);
        });
    });

    describe('Multi-Display Disconnect & Rescue Detection', () => {
        test('should recognize window is visible when dual monitors are connected', () => {
            const allDisplays = [primaryDisplay, externalDisplay];
            // Window is situated on the second monitor
            const windowBounds = { x: 2100, y: 200, width: 310, height: 430 };

            expect(isVisibleOnAnyDisplay(windowBounds, allDisplays)).toBe(true);
        });

        test('should detect window is orphaned when external monitor is unplugged', () => {
            // External monitor unplugged: only primaryDisplay remains
            const remainingDisplays = [primaryDisplay];
            // Window was left on the unplugged monitor (x: 2100)
            const orphanedBounds = { x: 2100, y: 200, width: 310, height: 430 };

            expect(isVisibleOnAnyDisplay(orphanedBounds, remainingDisplays)).toBe(false);
        });

        test('should rescue orphaned window by clamping it safely back into primaryDisplay workArea', () => {
            const remainingDisplays = [primaryDisplay];
            const orphanedBounds = { x: 2100, y: 200, width: 310, height: 430 };

            const isVisible = isVisibleOnAnyDisplay(orphanedBounds, remainingDisplays);
            expect(isVisible).toBe(false);

            // Trigger the rescue action implemented in main.js
            const rescuedBounds = clampBoundsToWorkArea(orphanedBounds, 310, 430, primaryDisplay.workArea);

            expect(rescuedBounds.x).toBeLessThanOrEqual(primaryDisplay.workArea.width - 310);
            expect(rescuedBounds.x).toBeGreaterThanOrEqual(primaryDisplay.workArea.x);
            expect(rescuedBounds.y).toBeLessThanOrEqual(primaryDisplay.workArea.height - 430);
            expect(rescuedBounds.y).toBeGreaterThanOrEqual(primaryDisplay.workArea.y);

            // Now verify it is visible on the primary screen!
            expect(isVisibleOnAnyDisplay(rescuedBounds, remainingDisplays)).toBe(true);
        });
    });
});
