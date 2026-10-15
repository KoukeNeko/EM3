import { marked } from "marked";

/** Markdown → HTML for E3, which stores rich text as HTML. Kept apart from the editor so it stays light. */
export function markdownToHtml(markdown: string): string {
	return marked.parse(markdown, { async: false, gfm: true, breaks: true });
}
