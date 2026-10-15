import { Crepe } from "@milkdown/crepe";
import { CodeIcon, TextAaIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import "./editor.css";

// One editor for everyone: Milkdown Crepe with an always-visible button bar
// for people who don't write Markdown, and a raw Markdown tab for those who do.

export { markdownToHtml } from "./markdown";

type Mode = "rich" | "markdown";
const MODE_KEY = "em3:editor-mode";

interface Props {
	value: string;
	onChange: (markdown: string) => void;
	placeholder?: string;
	minHeight?: string;
	/** Autofocus the editor when it mounts. */
	autoFocus?: boolean;
	label?: string;
	/** Bump to push an outside change of `value` into the rich editor (it only reads `value` on mount). */
	version?: number;
}

export function MarkdownEditor({ value, onChange, placeholder = "開始輸入…", minHeight = "10rem", autoFocus = false, label = "內容", version = 0 }: Props) {
	const [mode, setMode] = useState<Mode>(() => {
		try {
			return (localStorage.getItem(MODE_KEY) as Mode) || "rich";
		} catch {
			return "rich";
		}
	});
	const switchMode = (m: Mode) => {
		setMode(m);
		try {
			localStorage.setItem(MODE_KEY, m);
		} catch {
			/* ignore */
		}
	};

	return (
		<div className="em3-editor @container overflow-hidden rounded-box border hairline bg-base-100 transition-[border-color,box-shadow]" style={{ ["--em3-editor-min" as string]: minHeight }}>
			<div className="flex items-center gap-1 border-b hairline px-2 py-1.5" role="tablist" aria-label={`${label}編輯方式`}>
				<button type="button" role="tab" aria-selected={mode === "rich"} onClick={() => switchMode("rich")} className={`btn btn-xs ${mode === "rich" ? "btn-active" : "btn-ghost"}`}>
					<TextAaIcon size={14} />
					編輯器
				</button>
				<button type="button" role="tab" aria-selected={mode === "markdown"} onClick={() => switchMode("markdown")} className={`btn btn-xs ${mode === "markdown" ? "btn-active" : "btn-ghost"}`}>
					<CodeIcon size={14} />
					Markdown
				</button>
				<span className="ml-auto hidden truncate text-xs text-base-content/40 @lg:inline">{mode === "rich" ? "用上方按鈕排版，或輸入 / 插入區塊" : "支援 GitHub 風格 Markdown"}</span>
			</div>
			{mode === "rich" ? (
				<CrepeView key={version} initial={value} onChange={onChange} placeholder={placeholder} autoFocus={autoFocus} />
			) : (
				<textarea
					className="block w-full resize-y bg-transparent px-4 py-3 font-mono text-sm leading-relaxed outline-none"
					style={{ minHeight }}
					value={value}
					placeholder={placeholder}
					autoFocus={autoFocus}
					aria-label={label}
					onChange={e => onChange(e.target.value)}
				/>
			)}
		</div>
	);
}

/** Crepe owns its DOM; it is created once per mount and fed the latest Markdown on mode switches. */
function CrepeView({ initial, onChange, placeholder, autoFocus }: { initial: string; onChange: (md: string) => void; placeholder: string; autoFocus: boolean }) {
	const root = useRef<HTMLDivElement>(null);
	const latest = useRef(onChange);
	latest.current = onChange;

	useEffect(() => {
		if (!root.current) return;
		const crepe = new Crepe({
			root: root.current,
			defaultValue: initial,
			features: { [Crepe.Feature.TopBar]: true, [Crepe.Feature.AI]: false },
			featureConfigs: { [Crepe.Feature.Placeholder]: { text: placeholder, mode: "doc" } }
		});
		crepe.on(l => l.markdownUpdated((_ctx, md) => latest.current(md)));
		let alive = true;
		void crepe.create().then(() => {
			if (alive && autoFocus) root.current?.querySelector<HTMLElement>(".ProseMirror")?.focus();
		});
		return () => {
			alive = false;
			void crepe.destroy();
		};
		// Recreating on every keystroke would lose the cursor; `initial` is read once per mount.
	}, []);

	return <div ref={root} />;
}
