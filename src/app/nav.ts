import { BooksIcon, CalendarDotsIcon, GearSixIcon, HouseIcon, ListChecksIcon, MegaphoneIcon, TableIcon } from "@phosphor-icons/react";

export const NAV = [
	{ to: "/", label: "今天", icon: HouseIcon },
	{ to: "/tasks", label: "待辦", icon: ListChecksIcon },
	{ to: "/calendar", label: "行事曆", icon: CalendarDotsIcon },
	{ to: "/announcements", label: "公告", icon: MegaphoneIcon },
	{ to: "/courses", label: "課程", icon: BooksIcon },
	{ to: "/timetable", label: "課表", icon: TableIcon },
	{ to: "/settings", label: "設定", icon: GearSixIcon }
] as const;
