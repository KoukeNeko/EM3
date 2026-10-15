import { MoodleError } from "@/lib/moodle/client";
import { WarningCircleIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";

export function Empty({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
	return (
		<div className="flex flex-col items-center gap-2 px-6 py-10 text-center text-base-content/55">
			{icon && <div className="mb-1 text-base-content/30">{icon}</div>}
			<p className="font-medium text-base-content/70">{title}</p>
			{children && <div className="text-sm">{children}</div>}
		</div>
	);
}

export function ErrorNote({ error, retry }: { error: unknown; retry?: () => void }) {
	const msg = error instanceof MoodleError ? error.message : error instanceof Error ? error.message : "發生錯誤";
	return (
		<div role="alert" className="alert alert-soft alert-error">
			<WarningCircleIcon size={20} />
			<span>無法從 E3 取得資料：{msg}</span>
			{retry && (
				<button className="btn btn-sm" onClick={retry}>
					重試
				</button>
			)}
		</div>
	);
}

export function Lines({ n = 3, className = "" }: { n?: number; className?: string }) {
	return (
		<div className={`space-y-3 ${className}`}>
			{Array.from({ length: n }, (_, i) => (
				<div key={i} className="skeleton h-12 w-full rounded-xl" style={{ opacity: 1 - i * 0.18 }} />
			))}
		</div>
	);
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
	return (
		<div className="mb-3 flex items-end justify-between gap-3">
			<h2 className="text-[0.95rem] font-semibold tracking-tight">{children}</h2>
			{action}
		</div>
	);
}

export function PageTitle({ title, subtitle, children }: { title: ReactNode; subtitle?: ReactNode; children?: ReactNode }) {
	return (
		<header className="mb-6 flex flex-wrap items-end justify-between gap-4 lg:mb-8">
			<div className="min-w-0">
				<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
				{subtitle && <p className="mt-1 text-sm text-base-content/55">{subtitle}</p>}
			</div>
			{children}
		</header>
	);
}
