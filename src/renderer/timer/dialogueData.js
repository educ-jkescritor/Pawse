/**
 * PAWSE - Companion Dialogue Template Library
 * Pure text dialogue matrix with dynamic interpolation tokens:
 * {cycle}, {todayMinutes}, {avgMinutes}, {streak}, {catName}, {favCatName}
 */

const CompanionDialogueData = {
    // Companion display names
    names: {
        orange_cat: "Ginger",
        tuxedo_cat: "Tux",
        black_cat: "Void"
    },

    // 4-Break Narrative Arc (Mirroring the 4 Fish Icons)
    cycleArc: {
        orange_cat: {
            0: [
                "First fish in the bucket! 1 down, 3 to go. Great warmup!",
                "15 minutes crushed! Zoomies break time, shake out your paws!"
            ],
            1: [
                "Halfway mark! That is 2 fish secured. You are flying today!",
                "2 down, 2 to go! Keep this momentum going, human!"
            ],
            2: [
                "Cycle 3 done! Just ONE more sprint until the big catnap!",
                "3 fish in the bag! I can almost smell that long break!"
            ],
            3: [
                "FULL SET COMPLETED! We earned this big nap! Step away!",
                "All 4 cycles conquered! Time to stretch like a champion!"
            ]
        },
        tuxedo_cat: {
            0: [
                "First session concluded with grace. A splendid beginning, friend.",
                "25 minutes of admirable focus. Allow yourself a proper stretch."
            ],
            1: [
                "The halfway mark is achieved. Two cycles completed with decorum.",
                "Halfway through our set. Your consistency is truly commendable."
            ],
            2: [
                "Three cycles mastered. One final effort before our extended rest.",
                "Penultimate lap complete! Let us finish our suite with pride."
            ],
            3: [
                "Magnificent discipline! A full suite accomplished. Time for tea and rest.",
                "A complete set achieved. Step away from your desk; you have earned it."
            ]
        },
        black_cat: {
            0: [
                "You have begun. The hardest part was taking the first step.",
                "50 deep minutes into the quiet. Breathe out. Let the stillness rest."
            ],
            1: [
                "Half the path is behind us. Two cycles resting quietly in the books.",
                "Midway through the journey. Notice how calm your focus has become."
            ],
            2: [
                "Three cycles woven into reality. One last stretch remains before long rest.",
                "Almost at the summit. Rest your vision; the finish line is near."
            ],
            3: [
                "4 deep focus cycles complete. A profound achievement. Close your eyes and rest.",
                "The grand catnap awaits. Let your mind drift; you have labored deeply."
            ]
        }
    },

    // Skip & Behavioral Accountability
    skips: {
        majorBailout: {
            orange_cat: [
                "WAIT. We focused for barely 2 minutes and you hit SKIP?! My paws were not even warm!",
                "Hey! Hitting skip does not count as a sprint! You cannot bribe me with fish for that!"
            ],
            tuxedo_cat: [
                "Ahem. A premature cessation after merely three minutes? I shall overlook this lapse, but expect better.",
                "A skipped session? Surely an individual of your caliber possesses greater fortitude than that."
            ],
            black_cat: [
                "You clicked skip. The clock does not lie, human. The mountain does not shrink by looking away.",
                "A short escape. The unfinished task remains, waiting in the silence."
            ]
        },
        earlyCutoff: {
            orange_cat: [
                "You were almost at the finish line! Why bail with only a few minutes left?! Next one we finish!",
                "So close! Do not let your paws slip right before the bell!"
            ],
            tuxedo_cat: [
                "A respectable effort, yet the final stretch was abandoned. Let our next session demonstrate full resolve.",
                "Nearly at our destination before you halted. We shall complete the entire journey next time."
            ],
            black_cat: [
                "You walked most of the path, then stopped. What pulled your mind away in those final moments?",
                "The thread was cut near its end. Next time, weave it to completion."
            ]
        },
        breakSkipped: {
            orange_cat: [
                "Cutting break short to work MORE?! You absolute savage, let us go!",
                "Skipping rest?! Your work ethic is wild! Let us crush this next one!"
            ],
            tuxedo_cat: [
                "Cutting your respite short? Commendable zeal, but do not burn the candle at both ends.",
                "Eager to return to duty? An admirable drive, though rest is also essential."
            ],
            black_cat: [
                "Rest refused. The flame burns hot. Be mindful of exhaustion, traveller.",
                "You trade rest for labor. Let your focus justify the sacrifice."
            ]
        },
        redemption: {
            orange_cat: [
                "NOW THAT IS WHAT I AM TALKING ABOUT! Full session crushed! Redemption looks good on you!",
                "You came back and finished the whole thing! That is the spirit!"
            ],
            tuxedo_cat: [
                "A triumphant recovery. That was the caliber of discipline I knew you possessed.",
                "Splendid turnaround. You have rectified our earlier brevity with true dedication."
            ],
            black_cat: [
                "You returned and completed the circle. The earlier shortcut is redeemed.",
                "A full, unbroken focus. The balance is restored."
            ]
        }
    },

    // Session Meta & Lifecycle Awareness (Gaps A, B, C)
    meta: {
        restoredSession: {
            orange_cat: [
                "I saved your spot! We were mid-set on cycle {cycle}, let us pick right back up!",
                "Look who is back! I kept your seat warm, let us keep rolling!"
            ],
            tuxedo_cat: [
                "Welcome back, friend. Your progress was safely guarded. Let us continue.",
                "The session was preserved with care. Ready to resume our endeavor."
            ],
            black_cat: [
                "You return. The thread was not lost; it was waiting for you.",
                "Resuming our quiet communion. The path remains intact."
            ]
        },
        strictMode: {
            orange_cat: [
                "Strict Mode is on! No pauses, no skips. Playing on hard mode and winning!",
                "Hardcore focus mode! No backing out now, let us go!"
            ],
            tuxedo_cat: [
                "Strict Mode engaged. I deeply admire your uncompromising discipline.",
                "No pauses, no compromises. A true testament to your character."
            ],
            black_cat: [
                "Strict Mode. The safety lines are cut. Only pure focus remains.",
                "No escape, only depth. The silence welcomes your commitment."
            ]
        },
        longPause: {
            orange_cat: [
                "Took a long breather mid-session? Down a rabbit hole, were you? Glad you made it back!",
                "Paused for a while there! Shake off the distraction, we have work to do!"
            ],
            tuxedo_cat: [
                "A lengthy pause during our duties. We recovered well, but let us maintain momentum.",
                "You stepped away for quite some time. Let our next session flow uninterrupted."
            ],
            black_cat: [
                "The pause was long. The world tugged at your mind. Yet you returned to the center.",
                "A pause in the stream. Gather your thoughts and flow once more."
            ]
        }
    },

    // Situational Contexts (Temporal & Lifestyle)
    situational: {
        lateNight: {
            orange_cat: [
                "Whoa, burning the midnight oil?! Is this an exam crunch or late inspiration?",
                "Past midnight! Look at you grinding, but remember sleep is vital!"
            ],
            tuxedo_cat: [
                "Working at such late hours? Dedication is noble, but sleep restores the mind.",
                "The midnight hour approaches. Do not neglect your rest, dear friend."
            ],
            black_cat: [
                "The night is quiet. Your thoughts run deep. Remember to rest your vessel.",
                "The world sleeps while you create. Be gentle with your weary eyes."
            ]
        },
        weekend: {
            orange_cat: [
                "Weekend grind?! You absolute workhorse! Once we finish, go touch some grass!",
                "Working on a weekend? Respect the hustle, but save room for fun!"
            ],
            tuxedo_cat: [
                "Working through the weekend? Admirable dedication, but do schedule leisure.",
                "A weekend endeavor. Let us make these moments count so you may relax."
            ],
            black_cat: [
                "Even on days of rest, you craft your future. Quiet discipline.",
                "The weekend hours are yours. Flow without urgency or pressure."
            ]
        },
        fridayAfternoon: {
            orange_cat: [
                "Friday afternoon! The weekend is literally sniffing at our door! Let us finish strong!",
                "Friday vibes! Almost time to log off and celebrate the week!"
            ],
            tuxedo_cat: [
                "Friday arrives. Let us conclude this week's endeavors on a triumphant note.",
                "The weekend beckons, friend. A strong finish to an industrious week."
            ],
            black_cat: [
                "The week draws to its dusk. Complete your thoughts; freedom awaits.",
                "Friday shadows lengthen. Soon, quiet contemplation takes over."
            ]
        },
        mondayMorning: {
            orange_cat: [
                "Rise and shine! New week, fresh energy! Let us conquer this Monday!",
                "Monday warmup! Let us show this week who is boss!"
            ],
            tuxedo_cat: [
                "A fresh week commences. Let us set a dignified, steady pace.",
                "Monday morning. Clean slate, noble objectives. Let us begin."
            ],
            black_cat: [
                "A clean slate opens today. Move with intention, not haste.",
                "The cycle of a new week turns. Anchor yourself in quiet focus."
            ]
        },
        afternoonSlump: {
            orange_cat: [
                "Post-lunch food coma hitting? Drink some cold water, shake your tail!",
                "Afternoon slump? A quick stretch will wake those brain cells right up!"
            ],
            tuxedo_cat: [
                "The afternoon lull is natural. A sip of water and a shoulder roll will revive you.",
                "Midday fatigue is merely a temporary dip. Breathe deeply and refresh."
            ],
            black_cat: [
                "Midday heaviness settles. Breathe in the cool air; awaken your senses.",
                "The afternoon sun is slow. Still your mind and let energy return."
            ]
        }
    },

    // Productivity & Statistical Contexts
    stats: {
        aboveAverage: {
            orange_cat: [
                "{todayMinutes}m today?! You already blasted past your {avgMinutes}m daily average!",
                "High score alert! You have officially beaten your average focus time today!"
            ],
            tuxedo_cat: [
                "{todayMinutes} minutes logged today. You have surpassed your historical average. Exceptional!",
                "A distinguished milestone: today's focus exceeds your customary average."
            ],
            black_cat: [
                "You have walked further today than usual: {todayMinutes} minutes of pure presence.",
                "The threshold is crossed. Today's depth exceeds your usual measure."
            ]
        },
        streakMilestone: {
            orange_cat: [
                "Day {streak} streak! We are officially on a roll, human!",
                "{streak} days in a row! Do not break this paw-print chain!"
            ],
            tuxedo_cat: [
                "A {streak}-day consistency streak. Routine is the architect of mastery.",
                "{streak} consecutive days of focused diligence. You honor your potential."
            ],
            black_cat: [
                "{streak} unbroken sunrises of dedication. The momentum protects itself.",
                "A thread of {streak} days, woven tightly through your life."
            ]
        },
        firstSessionToday: {
            orange_cat: [
                "First session of the day in the books! The engine is officially started!",
                "First one done! Starting is the hardest part and you crushed it!"
            ],
            tuxedo_cat: [
                "Our first session today. Every worthy endeavor begins with a single step.",
                "The initial session is complete. The foundation for today is laid."
            ],
            black_cat: [
                "The first stone is placed today. The path opens quietly before us.",
                "You arrived and sat. The mind responds to your intention."
            ]
        },
        favoriteCatIsMe: {
            orange_cat: [
                "I checked your database... I am your favorite companion! Do not tell Tux!",
                "Stats confirm: I am your #1 cat! We make the ultimate dream team!"
            ],
            tuxedo_cat: [
                "The records indicate I am your preferred associate. The feeling is mutual.",
                "I see I hold your primary favor. I shall strive to maintain such esteem."
            ],
            black_cat: [
                "The quiet numbers reveal our bond. We spend the most hours together in silence.",
                "You seek my shadow often. Our quiet alignment is recognized."
            ]
        },
        favoriteCatOther: {
            orange_cat: [
                "Wait... {favCatName} has the most hours in your stats?! Am I not spicy enough?",
                "I saw your logs... you spend so much time with {favCatName}! Do not forget me!"
            ],
            tuxedo_cat: [
                "I see {favCatName} holds your highest favor. A respectable choice, though I remain ready.",
                "While {favCatName} claims your primary hours, I appreciate the time we share."
            ],
            black_cat: [
                "You often seek {favCatName}'s company over mine. Yet here we are in this moment.",
                "{favCatName} has your time, but now we share the quiet."
            ]
        }
    },

    // Empathy, Posture & Self-Care Reminders (Universal Fallbacks)
    selfCare: [
        "Unclench your jaw, drop your shoulders. You have been hunched like a goblin!",
        "Drink some water. No, iced coffee does not count as water!",
        "Look 20 feet away for 20 seconds. Give those screen-weary eyes a break.",
        "Inhale deep for 4 seconds, hold for 4, exhale slow. Better, right?",
        "Roll those wrists and stretch your fingers! Carpal tunnel is not invited.",
        "Remember: consistency beats intensity. Steady paws win the journey."
    ]
};

// Make available globally in renderer
if (typeof window !== 'undefined') {
    window.CompanionDialogueData = CompanionDialogueData;
}
