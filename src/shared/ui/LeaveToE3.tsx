import { ArrowSquareOutIcon } from "@phosphor-icons/react";
import { type MouseEvent, type ReactNode, useEffect, useRef } from "react";
import { create } from "zustand";

// Some things only work on the official E3 site (quizzes, for one). Rows for
// them look like every other row, so instead of silently opening a new tab EM3
// says where the link goes and why first.

export interface LeaveNotice {
	url: string;
	title: string;
	reason: string;
	notes?: string[];
}

const useLeave = create<{ notice: LeaveNotice | null; show: (n: LeaveNotice) => void; close: () => void }>(set => ({
	notice: null,
	show: notice => set({ notice }),
	close: () => set({ notice: null })
}));

/** A link to E3 that explains itself before leaving. Modifier clicks still open straight away. */
export function E3Away({ notice, className, children }: { notice: LeaveNotice; className?: string; children: ReactNode }) {
	const onClick = (e: MouseEvent) => {
		if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
		e.preventDefault();
		useLeave.getState().show(notice);
	};
	return (
		<a href={notice.url} target="_blank" rel="noreferrer" className={className} onClick={onClick} data-nav>
			{children}
		</a>
	);
}

export function LeaveToE3Host() {
	const { notice, close } = useLeave();
	const ref = useRef<HTMLDialogElement>(null);
	useEffect(() => {
		const d = ref.current;
		if (notice && d && !d.open) d.showModal();
		if (!notice && d?.open) d.close();
	}, [notice]);

	return (
		<dialog ref={ref} className="modal modal-bottom sm:modal-middle" onClose={close} aria-labelledby="leave-e3-title">
			<div className="modal-box max-w-md">
				{notice && (
					<>
						<p className="flex items-center gap-1.5 text-xs font-medium text-base-content/50">
							<ArrowSquareOutIcon size={14} />
							要在 Moodle 上完成
						</p>
						<h3 id="leave-e3-title" className="mt-1 text-lg font-semibold">
							{notice.title}
						</h3>
						<p className="mt-3 text-sm text-base-content/75">{notice.reason}</p>
						{!!notice.notes?.length && (
							<ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-base-content/65">
								{notice.notes.map(n => (
									<li key={n}>{n}</li>
								))}
							</ul>
						)}
						<div className="modal-action">
							<button className="btn btn-ghost" onClick={close}>
								取消
							</button>
							<a className="btn btn-primary" href={notice.url} target="_blank" rel="noreferrer" onClick={close} autoFocus>
								前往 Moodle
								<ArrowSquareOutIcon size={16} />
							</a>
						</div>
					</>
				)}
			</div>
			<form method="dialog" className="modal-backdrop">
				<button>close</button>
			</form>
		</dialog>
	);
}
