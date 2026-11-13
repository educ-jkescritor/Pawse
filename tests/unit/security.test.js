/**
 * PAWSE Test Suite — Electron DevSecOps & Security Hardening
 * Validates Sandboxing, Context Isolation, Node Integration denial, CSP, and Preload API exposure.
 */

const fs = require('fs');
const path = require('path');

describe('Electron DevSecOps & Security Posture', () => {
    const mainJsContent = fs.readFileSync(path.join(__dirname, '../../src/main/main.js'), 'utf8');
    const preloadJsContent = fs.readFileSync(path.join(__dirname, '../../src/main/preload.js'), 'utf8');
    const timerHtmlContent = fs.readFileSync(path.join(__dirname, '../../src/renderer/index.html'), 'utf8');

    describe('Process Sandboxing & Window Isolation', () => {
        test('should enforce nodeIntegration: false in all BrowserWindow instances', () => {
            expect(mainJsContent).toMatch(/nodeIntegration:\s*false/);
            expect(mainJsContent).not.toMatch(/nodeIntegration:\s*true/);
        });

        test('should enforce contextIsolation: true in all BrowserWindow instances', () => {
            expect(mainJsContent).toMatch(/contextIsolation:\s*true/);
            expect(mainJsContent).not.toMatch(/contextIsolation:\s*false/);
        });

        test('should enforce sandbox: true in all BrowserWindow instances', () => {
            expect(mainJsContent).toMatch(/sandbox:\s*true/);
            expect(mainJsContent).not.toMatch(/sandbox:\s*false/);
        });
    });

    describe('Preload Bridge & Attack Surface Sanitization', () => {
        test('should expose strictly typed APIs via contextBridge.exposeInMainWorld', () => {
            expect(preloadJsContent).toContain("contextBridge.exposeInMainWorld('mainAPI'");
        });

        test('should never expose raw ipcRenderer object to window', () => {
            // Must not expose ipcRenderer directly
            expect(preloadJsContent).not.toMatch(/exposeInMainWorld\([^,]+,\s*ipcRenderer\)/);
        });

        test('should expose system-suspend and system-resume listeners safely in preload', () => {
            expect(preloadJsContent).toContain('onSystemSuspend');
            expect(preloadJsContent).toContain('onSystemResume');
        });
    });

    describe('Content Security Policy (CSP)', () => {
        test('should define a strict Content Security Policy meta tag in timer index.html', () => {
            expect(timerHtmlContent).toContain('http-equiv="Content-Security-Policy"');
        });

        test('should strictly forbid unsafe-eval in Content Security Policy', () => {
            expect(timerHtmlContent).not.toContain("'unsafe-eval'");
        });
    });

    describe('Cross-Platform Launch on Startup Configuration', () => {
        test('should implement XDG autostart file handling for Linux distributions', () => {
            expect(mainJsContent).toContain('.config');
            expect(mainJsContent).toContain('autostart');
            expect(mainJsContent).toContain('pawse.desktop');
        });

        test('should pass explicit executable path for Windows login item settings', () => {
            expect(mainJsContent).toContain("process.platform === 'win32'");
            expect(mainJsContent).toMatch(/app\.getPath\(['"]exe['"]\)/);
        });
    });
});
