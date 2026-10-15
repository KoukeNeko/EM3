// NYCU class periods and the 「M56R7」-style schedule codes printed on the
// course catalogue and timetable (days M T W R F S U, periods y z 1-4 n 5-9 a-d).

export interface Period {
	code: string;
	start: string;
	end: string;
}

export const PERIODS: Period[] = [
	{ code: "y", start: "06:00", end: "06:50" },
	{ code: "z", start: "07:00", end: "07:50" },
	{ code: "1", start: "08:00", end: "08:50" },
	{ code: "2", start: "09:00", end: "09:50" },
	{ code: "3", start: "10:10", end: "11:00" },
	{ code: "4", start: "11:10", end: "12:00" },
	{ code: "n", start: "12:20", end: "13:10" },
	{ code: "5", start: "13:20", end: "14:10" },
	{ code: "6", start: "14:20", end: "15:10" },
	{ code: "7", start: "15:30", end: "16:20" },
	{ code: "8", start: "16:30", end: "17:20" },
	{ code: "9", start: "17:30", end: "18:20" },
	{ code: "a", start: "18:30", end: "19:20" },
	{ code: "b", start: "19:30", end: "20:20" },
	{ code: "c", start: "20:30", end: "21:20" },
	{ code: "d", start: "21:30", end: "22:20" }
];

/** Periods most students actually have; the grid hides y/z/c/d unless used. */
export const CORE_PERIODS = PERIODS.filter(p => !["y", "z", "c", "d"].includes(p.code));

/** 0 = Monday … 6 = Sunday. */
export const DAY_CODES = ["M", "T", "W", "R", "F", "S", "U"] as const;
export const DAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];

export interface Slot {
	day: number;
	period: string;
}

const minutes = (hm: string) => {
	const [h, m] = hm.split(":").map(Number);
	return h * 60 + m;
};

export const periodByCode = (code: string) => PERIODS.find(p => p.code === code);
export const periodStartMinutes = (code: string) => minutes(periodByCode(code)!.start);
export const periodEndMinutes = (code: string) => minutes(periodByCode(code)!.end);

/**
 * Parses codes like `T34`, `M56R7`, `W56-EC022`, `T34-EC115,R2-EC115` into
 * slots plus the room (if one is given after a dash).
 */
export function parseScheduleCode(input: string): { slots: Slot[]; room?: string } {
	const slots: Slot[] = [];
	let room: string | undefined;
	for (const chunk of input
		.toUpperCase()
		.split(/[,，\s]+/)
		.filter(Boolean)) {
		const dash = chunk.indexOf("-");
		const times = dash < 0 ? chunk : chunk.slice(0, dash);
		const place = dash < 0 ? "" : chunk.slice(dash + 1);
		if (place && !room) room = place;
		let day = -1;
		for (const ch of times) {
			const d = DAY_CODES.indexOf(ch as (typeof DAY_CODES)[number]);
			if (d >= 0) {
				day = d;
				continue;
			}
			const code = ch.toLowerCase();
			if (day >= 0 && periodByCode(code)) slots.push({ day, period: code });
		}
	}
	return { slots, room };
}

export function formatSlots(slots: Slot[]): string {
	const byDay = new Map<number, string[]>();
	for (const s of slots) byDay.set(s.day, [...(byDay.get(s.day) ?? []), s.period]);
	const order = PERIODS.map(p => p.code);
	return [...byDay.entries()]
		.sort(([a], [b]) => a - b)
		.map(([d, ps]) => DAY_CODES[d] + ps.sort((a, b) => order.indexOf(a) - order.indexOf(b)).join(""))
		.join("");
}

/** Merge consecutive periods into blocks: [{day, from:"3", to:"4"}]. */
export function slotBlocks(slots: Slot[]) {
	const order = PERIODS.map(p => p.code);
	const sorted = [...slots].sort((a, b) => a.day - b.day || order.indexOf(a.period) - order.indexOf(b.period));
	const blocks: { day: number; from: string; to: string }[] = [];
	for (const s of sorted) {
		const last = blocks.at(-1);
		if (last && last.day === s.day && order.indexOf(s.period) === order.indexOf(last.to) + 1) last.to = s.period;
		else blocks.push({ day: s.day, from: s.period, to: s.period });
	}
	return blocks;
}

/** Monday-based day index for a JS Date. */
export const dayIndex = (d: Date) => (d.getDay() + 6) % 7;
