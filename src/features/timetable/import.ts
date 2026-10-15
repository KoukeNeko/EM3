import type { ParsedCourse } from "@/features/courses/parse";

// Class times live only in the school's syllabus system. Its JSON endpoint
// sends a duplicated Access-Control-Allow-Origin header, which browsers
// reject, so EM3 links to the syllabus page and lets the student type the
// 「T34-EC022」 code instead of fetching it.

export const syllabusUrl = (c: ParsedCourse) =>
	c.semester && c.code ? `https://timetable.nycu.edu.tw/?r=main/crsoutline&Acy=${c.semester.year}&Sem=${c.semester.term === 3 ? "X" : c.semester.term}&CrsNo=${c.code}&lang=zh-tw` : null;
