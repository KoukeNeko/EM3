import { usePrefs } from "@/features/preferences/store";
import {
	AtomIcon,
	BarbellIcon,
	BookOpenIcon,
	BrainIcon,
	CalculatorIcon,
	ChartBarIcon,
	CodeIcon,
	CpuIcon,
	DiceFiveIcon,
	FlaskIcon,
	GlobeIcon,
	GraduationCapIcon,
	GridFourIcon,
	HardDrivesIcon,
	HeartIcon,
	type Icon,
	LightbulbIcon,
	MusicNotesIcon,
	PaletteIcon,
	PenNibIcon,
	PlantIcon,
	RobotIcon,
	RocketIcon,
	ShapesIcon,
	SigmaIcon,
	SneakerMoveIcon,
	SparkleIcon,
	StackIcon,
	TranslateIcon,
	TreeStructureIcon,
	UsersIcon,
	VideoCameraIcon,
	WrenchIcon
} from "@phosphor-icons/react";
import type { ParsedCourse } from "./parse";

export const COURSE_ICONS: Record<string, Icon> = {
	book: BookOpenIcon,
	code: CodeIcon,
	cpu: CpuIcon,
	network: TreeStructureIcon,
	server: HardDrivesIcon,
	sigma: SigmaIcon,
	calculator: CalculatorIcon,
	grid: GridFourIcon,
	dices: DiceFiveIcon,
	chart: ChartBarIcon,
	atom: AtomIcon,
	flask: FlaskIcon,
	brain: BrainIcon,
	bot: RobotIcon,
	sparkles: SparkleIcon,
	palette: PaletteIcon,
	pen: PenNibIcon,
	shapes: ShapesIcon,
	layers: StackIcon,
	video: VideoCameraIcon,
	music: MusicNotesIcon,
	globe: GlobeIcon,
	languages: TranslateIcon,
	users: UsersIcon,
	heart: HeartIcon,
	leaf: PlantIcon,
	dumbbell: BarbellIcon,
	footprints: SneakerMoveIcon,
	rocket: RocketIcon,
	lightbulb: LightbulbIcon,
	wrench: WrenchIcon,
	cap: GraduationCapIcon
};

/** Hand-picked hues that stay legible as both a tint and a solid in every theme. */
export const COURSE_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981", "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#d946ef", "#ec4899", "#64748b", "#a16207"];

const ICON_RULES: [RegExp, string][] = [
	[/演算法|algorithm/i, "shapes"],
	[/網路|network/i, "network"],
	[/系統管理|system admin|作業系統/i, "server"],
	[/機率|probab/i, "dices"],
	[/統計|statist/i, "chart"],
	[/微積分|calculus/i, "sigma"],
	[/線性代數|linear/i, "grid"],
	[/離散|discrete/i, "layers"],
	[/電路|circuit|計算機組織/i, "cpu"],
	[/物理|physics/i, "atom"],
	[/化學|chem|生物|bio/i, "flask"],
	[/AI|人工智慧|LLM|machine learning|機器學習/i, "sparkles"],
	[/程式|program|資料結構|software|軟體|前端|react|python/i, "code"],
	[/人機|多媒體|multimedia|鏡頭|影片/i, "video"],
	[/設計|design|造型|繪圖|drawing/i, "palette"],
	[/體育|physical education/i, "dumbbell"],
	[/健走|慢跑|jog|walk/i, "footprints"],
	[/文化|culture|認同|社會/i, "globe"],
	[/英文|english|日文|語言/i, "languages"],
	[/導師|生涯|career|mentor/i, "users"],
	[/性別|gender/i, "heart"],
	[/專題|topic|研究|research/i, "lightbulb"],
	[/新生|freshman|培訓|助教/i, "cap"],
	[/高效能|HPC|high-performance/i, "rocket"]
];

function hash(n: number) {
	let x = n * 2654435761;
	x ^= x >>> 16;
	return Math.abs(x);
}

export function defaultIcon(c: ParsedCourse) {
	const hay = `${c.name} ${c.nameEn ?? ""}`;
	return ICON_RULES.find(([re]) => re.test(hay))?.[1] ?? "book";
}

export const defaultColor = (id: number) => COURSE_COLORS[hash(id) % COURSE_COLORS.length];

export interface ResolvedLook {
	color: string;
	icon: string;
	Icon: Icon;
	title: string;
	hidden: boolean;
	pinned: boolean;
}

export function resolveLook(c: ParsedCourse, overrides = usePrefs.getState().courses[c.id]): ResolvedLook {
	const icon = overrides?.icon && COURSE_ICONS[overrides.icon] ? overrides.icon : defaultIcon(c);
	return {
		color: overrides?.color ?? defaultColor(c.id),
		icon,
		Icon: COURSE_ICONS[icon],
		title: overrides?.nickname?.trim() || c.name,
		hidden: !!overrides?.hidden,
		pinned: !!overrides?.pinned
	};
}

/** Subscribes to one course's appearance overrides. */
export function useCourseLook(c: ParsedCourse | undefined): ResolvedLook | undefined {
	const overrides = usePrefs(s => (c ? s.courses[c.id] : undefined));
	return c ? resolveLook(c, overrides) : undefined;
}

export function CourseGlyph({ look, size = "md" }: { look: ResolvedLook; size?: "sm" | "md" | "lg" }) {
	const box = { sm: "size-6 rounded-md", md: "size-9 rounded-xl", lg: "size-14 rounded-2xl" }[size];
	const icon = { sm: 14, md: 18, lg: 28 }[size];
	return (
		<span className={`${box} grid shrink-0 place-items-center`} style={{ backgroundColor: `color-mix(in oklab, ${look.color} 18%, transparent)`, color: look.color }} aria-hidden>
			<look.Icon size={icon} weight="duotone" />
		</span>
	);
}
