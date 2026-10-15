// Human date phrasing in the way Taiwanese students talk about time:
// 「今天 14:30」「昨天 星期三」「10/5 上星期五」, falling back to a bare date
// once the week name stops being useful.

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
const DAY = 86_400_000;

export const weekdayName = (d: Date) => `星期${WEEKDAYS[d.getDay()]}`;
export const shortWeekday = (d: Date) => `週${WEEKDAYS[d.getDay()]}`;

export function startOfDay(d: Date) {
	const x = new Date(d);
	x.setHours(0, 0, 0, 0);
	return x;
}

/** Monday-based week start, matching the school calendar. */
export function startOfWeek(d: Date) {
	const x = startOfDay(d);
	x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
	return x;
}

export function addDays(d: Date, n: number) {
	const x = new Date(d);
	x.setDate(x.getDate() + n);
	return x;
}

export function sameDay(a: Date, b: Date) {
	return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const dayDiff = (a: Date, b: Date) => Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / DAY);
const weekDiff = (a: Date, b: Date) => Math.round((startOfWeek(a).getTime() - startOfWeek(b).getTime()) / (7 * DAY));

export const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

export function md(d: Date, now = new Date()) {
	return d.getFullYear() === now.getFullYear() ? `${d.getMonth() + 1}/${d.getDate()}` : `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

/** Phrase a past moment, e.g. for announcement timestamps. */
export function pastPhrase(input: Date | number, now = new Date()): string {
	const d = typeof input === "number" ? new Date(input * 1000) : input;
	const mins = Math.floor((now.getTime() - d.getTime()) / 60_000);
	const days = dayDiff(now, d);
	if (days === 0) {
		if (mins < 1) return "剛剛";
		if (mins < 60) return `${mins} 分鐘前`;
		return `今天 ${hhmm(d)}`;
	}
	if (days === 1) return `昨天 ${weekdayName(d)}`;
	if (days === 2) return `前天 ${weekdayName(d)}`;
	const weeks = weekDiff(now, d);
	if (weeks === 0) return weekdayName(d);
	if (weeks === 1) return `${md(d, now)} 上${weekdayName(d)}`;
	return md(d, now);
}

/** Phrase a future moment, e.g. deadlines: 「明天 星期四 23:59」. */
export function futurePhrase(input: Date | number, now = new Date()): string {
	const d = typeof input === "number" ? new Date(input * 1000) : input;
	if (d.getTime() < now.getTime()) return pastPhrase(d, now);
	const days = dayDiff(d, now);
	const time = hhmm(d);
	if (days === 0) return `今天 ${time}`;
	if (days === 1) return `明天 ${weekdayName(d)} ${time}`;
	if (days === 2) return `後天 ${weekdayName(d)} ${time}`;
	const weeks = weekDiff(d, now);
	if (weeks === 0) return `${weekdayName(d)} ${time}`;
	if (weeks === 1) return `下${weekdayName(d)} ${md(d, now)} ${time}`;
	return `${md(d, now)} ${shortWeekday(d)} ${time}`;
}

/** Compact countdown: 「剩 3 小時」「剩 2 天」「已逾期 5 小時」. */
export function countdown(input: Date | number, now = new Date()): { text: string; urgency: "overdue" | "critical" | "soon" | "later" } {
	const d = typeof input === "number" ? new Date(input * 1000) : input;
	const ms = d.getTime() - now.getTime();
	const abs = Math.abs(ms);
	const h = Math.floor(abs / 3_600_000);
	const m = Math.floor((abs % 3_600_000) / 60_000);
	const span = h >= 48 ? `${Math.floor(h / 24)} 天` : h >= 1 ? `${h} 小時${h < 6 && m ? ` ${m} 分` : ""}` : `${Math.max(m, 1)} 分鐘`;
	if (ms < 0) return { text: `已逾期 ${span}`, urgency: "overdue" };
	return { text: `剩 ${span}`, urgency: h < 24 ? "critical" : h < 72 ? "soon" : "later" };
}

export function fullDateTime(input: Date | number) {
	const d = typeof input === "number" ? new Date(input * 1000) : input;
	return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${weekdayName(d)} ${hhmm(d)}`;
}

/**
 * Deadlines at exactly 00:00 belong to the day before (E3 shows them as
 * 「AM 12:00」 of the next day, which students misread). Shift them to 24:00.
 */
export function deadlinePhrase(input: Date | number, now = new Date()): string {
	const d = typeof input === "number" ? new Date(input * 1000) : input;
	if (d.getHours() !== 0 || d.getMinutes() !== 0) return futurePhrase(d, now);
	const prev = new Date(d.getTime() - 60_000);
	return futurePhrase(prev, now).replace(/23:59$/, "24:00");
}

/** The calendar day a deadline visually belongs to (00:00 → the previous day). */
export function deadlineDay(input: Date | number): Date {
	const d = typeof input === "number" ? new Date(input * 1000) : input;
	return startOfDay(d.getHours() === 0 && d.getMinutes() === 0 ? new Date(d.getTime() - 60_000) : d);
}

export function deadlineClock(input: Date | number): string {
	const d = typeof input === "number" ? new Date(input * 1000) : input;
	return d.getHours() === 0 && d.getMinutes() === 0 ? "24:00" : hhmm(d);
}
