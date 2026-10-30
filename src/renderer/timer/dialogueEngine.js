/**
 * PAWSE - Companion Dialogue Engine
 * Evaluates contextual variables, live database statistics, time-of-day,
 * skip/effort patterns, and session recovery to return personalized companion dialogue.
 */

const CompanionDialogueEngine = (() => {
    let cachedAnalytics = null;
    const recentHistory = [];
    const MAX_HISTORY = 6;

    /**
     * Initializes the engine with a snapshot of user analytics
     * @param {Object} analytics 
     */
    function init(analytics) {
        cachedAnalytics = analytics || {
            today_work_seconds: 0,
            avg_daily_seconds: 0,
            favorite_cat: 'None',
            current_streak: 0,
            personal_best_seconds: 0
        };
    }

    /**
     * Replaces template placeholders with active session & historical values
     */
    function interpolate(text, context) {
        if (!text) return "";

        const catNames = (CompanionDialogueData && CompanionDialogueData.names) || {};
        const catName = catNames[context.catKey] || "Companion";
        
        let favCatName = "another cat";
        if (cachedAnalytics && cachedAnalytics.favorite_cat && catNames[cachedAnalytics.favorite_cat]) {
            favCatName = catNames[cachedAnalytics.favorite_cat];
        }

        const totalWorkSec = (cachedAnalytics ? cachedAnalytics.today_work_seconds : 0) + (context.actualWork || 0);
        const todayMinutes = Math.max(1, Math.round(totalWorkSec / 60));
        const avgMinutes = cachedAnalytics && cachedAnalytics.avg_daily_seconds 
            ? Math.round(cachedAnalytics.avg_daily_seconds / 60) 
            : 0;
        const streak = cachedAnalytics ? cachedAnalytics.current_streak : 0;
        const cycle = (context.cycleIndex !== undefined ? context.cycleIndex + 1 : 1);

        return text
            .replace(/{catName}/g, catName)
            .replace(/{favCatName}/g, favCatName)
            .replace(/{todayMinutes}/g, todayMinutes)
            .replace(/{avgMinutes}/g, avgMinutes)
            .replace(/{streak}/g, streak)
            .replace(/{cycle}/g, cycle);
    }

    /**
     * Safely selects an item from a pool, avoiding immediate duplicates
     */
    function pickFromPool(pool) {
        if (!pool || pool.length === 0) return null;
        
        // Filter out recently shown lines if possible
        const available = pool.filter(msg => !recentHistory.includes(msg));
        const choices = available.length > 0 ? available : pool;
        
        const selected = choices[Math.floor(Math.random() * choices.length)];
        
        // Update history ring buffer
        recentHistory.push(selected);
        if (recentHistory.length > MAX_HISTORY) {
            recentHistory.shift();
        }
        
        return selected;
    }

    /**
     * Evaluates active time and day to determine any active situational context
     */
    function getActiveSituationKey() {
        const now = new Date();
        const hour = now.getHours();
        const day = now.getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat

        // 1. Late night: 11 PM to 3:59 AM
        if (hour >= 23 || hour < 4) {
            return 'lateNight';
        }

        // 2. Weekend: Saturday or Sunday
        if (day === 0 || day === 6) {
            return 'weekend';
        }

        // 3. Friday afternoon: 2 PM to 7 PM
        if (day === 5 && hour >= 14 && hour < 19) {
            return 'fridayAfternoon';
        }

        // 4. Monday morning: 6 AM to 11 AM
        if (day === 1 && hour >= 6 && hour < 11) {
            return 'mondayMorning';
        }

        // 5. Afternoon slump: 1 PM to 3:30 PM (weekdays)
        if (hour >= 13 && hour <= 15) {
            return 'afternoonSlump';
        }

        return null;
    }

    /**
     * Primary Trigger: Called when break session starts (automatic welcome bubble)
     * Prioritizes session recovery, redemption arc, skip callouts, or 4-break cycle progression.
     */
    function getBreakArrivalMessage(catKey, cycleIndex, context = {}) {
        const fullContext = { ...context, catKey, cycleIndex };
        const data = window.CompanionDialogueData || CompanionDialogueData;

        // Priority 1: Crash / Reload Recovery (Gap C)
        if (context.isRestored && data.meta && data.meta.restoredSession && data.meta.restoredSession[catKey]) {
            const line = pickFromPool(data.meta.restoredSession[catKey]);
            if (line) return interpolate(line, fullContext);
        }

        // Priority 2: Redemption Arc (Completed full session right after an earlier bailout)
        if (context.isRedemption && data.skips && data.skips.redemption && data.skips.redemption[catKey]) {
            const line = pickFromPool(data.skips.redemption[catKey]);
            if (line) return interpolate(line, fullContext);
        }

        // Priority 3: Major Bailout Skip (<25% completed)
        if (context.skipType === 'majorBailout' && data.skips && data.skips.majorBailout && data.skips.majorBailout[catKey]) {
            const line = pickFromPool(data.skips.majorBailout[catKey]);
            if (line) return interpolate(line, fullContext);
        }

        // Priority 4: Early Cutoff Skip (abandoned near the end)
        if (context.skipType === 'earlyCutoff' && data.skips && data.skips.earlyCutoff && data.skips.earlyCutoff[catKey]) {
            const line = pickFromPool(data.skips.earlyCutoff[catKey]);
            if (line) return interpolate(line, fullContext);
        }

        // Priority 5: The 4-Break Narrative Arc (Standard completion)
        const catArc = data.cycleArc && data.cycleArc[catKey];
        if (catArc && catArc[cycleIndex]) {
            const line = pickFromPool(catArc[cycleIndex]);
            if (line) {
                return interpolate(line, fullContext);
            }
        }

        // Fallback: Generic cycle line
        return interpolate(`Cycle {cycle} complete! Take a well-deserved stretch, human.`, fullContext);
    }

    /**
     * Secondary Trigger: Called when user pets/clicks the cat during break time
     * Prioritizes situational awareness, statistics, cat affinity/jealousy, long pause nudges, and self-care.
     */
    function getPettingMessage(catKey, cycleIndex, context = {}) {
        const fullContext = { ...context, catKey, cycleIndex };
        const data = window.CompanionDialogueData || CompanionDialogueData;
        const candidatePools = [];

        // 1. Long Pause Nudge (Gap B)
        if (context.wasLongPaused && data.meta && data.meta.longPause && data.meta.longPause[catKey]) {
            candidatePools.push({ pool: data.meta.longPause[catKey], weight: 4 });
        }

        // 2. Strict Mode Recognition (Gap A)
        if (context.strictMode && data.meta && data.meta.strictMode && data.meta.strictMode[catKey]) {
            candidatePools.push({ pool: data.meta.strictMode[catKey], weight: 3 });
        }

        // 3. Stats Milestones
        if (cachedAnalytics) {
            const totalWorkSec = cachedAnalytics.today_work_seconds + (context.actualWork || 0);
            const todayMin = Math.round(totalWorkSec / 60);
            const avgMin = cachedAnalytics.avg_daily_seconds ? Math.round(cachedAnalytics.avg_daily_seconds / 60) : 0;

            // Milestone: Above daily average
            if (avgMin > 0 && todayMin > avgMin && data.stats && data.stats.aboveAverage && data.stats.aboveAverage[catKey]) {
                candidatePools.push({ pool: data.stats.aboveAverage[catKey], weight: 3 });
            }

            // Milestone: Active streak (>= 3 days)
            if (cachedAnalytics.current_streak >= 3 && data.stats && data.stats.streakMilestone && data.stats.streakMilestone[catKey]) {
                candidatePools.push({ pool: data.stats.streakMilestone[catKey], weight: 3 });
            }

            // Milestone: First session of the day
            if (cachedAnalytics.today_work_seconds === 0 && data.stats && data.stats.firstSessionToday && data.stats.firstSessionToday[catKey]) {
                candidatePools.push({ pool: data.stats.firstSessionToday[catKey], weight: 2 });
            }

            // Relationship: Favorite cat commentary
            if (cachedAnalytics.favorite_cat && cachedAnalytics.favorite_cat !== 'None') {
                if (cachedAnalytics.favorite_cat === catKey && data.stats && data.stats.favoriteCatIsMe && data.stats.favoriteCatIsMe[catKey]) {
                    candidatePools.push({ pool: data.stats.favoriteCatIsMe[catKey], weight: 2 });
                } else if (data.stats && data.stats.favoriteCatOther && data.stats.favoriteCatOther[catKey]) {
                    candidatePools.push({ pool: data.stats.favoriteCatOther[catKey], weight: 2 });
                }
            }
        }

        // 4. Situational Awareness (Time/Day)
        const situationKey = getActiveSituationKey();
        if (situationKey && data.situational && data.situational[situationKey] && data.situational[situationKey][catKey]) {
            candidatePools.push({ pool: data.situational[situationKey][catKey], weight: 3 });
        }

        // 5. Universal Self-Care & Empathy (Always available fallback)
        if (data.selfCare && data.selfCare.length > 0) {
            candidatePools.push({ pool: data.selfCare, weight: 2 });
        }

        // Weighted random selection of pool
        let chosenPool = data.selfCare;
        if (candidatePools.length > 0) {
            const totalWeight = candidatePools.reduce((acc, item) => acc + item.weight, 0);
            let randomNum = Math.random() * totalWeight;
            for (const item of candidatePools) {
                if (randomNum < item.weight) {
                    chosenPool = item.pool;
                    break;
                }
                randomNum -= item.weight;
            }
        }

        const rawLine = pickFromPool(chosenPool);
        return interpolate(rawLine, fullContext);
    }

    return {
        init,
        getBreakArrivalMessage,
        getPettingMessage,
        interpolate
    };
})();

// Make available globally in renderer
if (typeof window !== 'undefined') {
    window.CompanionDialogueEngine = CompanionDialogueEngine;
}
