/**
 * Parses "HH:MM:SS", "MM:SS", or plain seconds (e.g. "90" or "90.5")
 * into a number of seconds. Throws on anything else.
 */
export function timeToSeconds(time: string): number {
    const parts = time.trim().split(":").map(Number);

    if (parts.some(isNaN)) {
        throw new Error(`Invalid time format: ${time}`);
    }

    if (parts.length === 3) {
        const [h, m, s] = parts;
        return h * 3600 + m * 60 + s;
    }

    if (parts.length === 2) {
        const [m, s] = parts;
        return m * 60 + s;
    }

    if (parts.length === 1) {
        return parts[0];
    }

    throw new Error(`Invalid time format: ${time}`);
}

/**
 * Formats seconds as "MM:SS", or "H:MM:SS" once it crosses the hour mark.
 */
export function formatTimecode(totalSeconds: number): string {
    const whole = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(whole / 3600);
    const minutes = Math.floor((whole % 3600) / 60);
    const seconds = whole % 60;
    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");
    return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}
