import { call } from "@/lib/moodle/client";
import { e3Link } from "@/lib/moodle/files";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// E3's internal mail (local_dcpcmail, a fork of the local_mail plugin).
// The web service can list, search and read mail and toggle unread, but it
// cannot send — composing and replying open the E3 page instead.

export type MailFolder = "inbox" | "starred" | "sent" | "drafts" | "trash" | "course";

export interface MailSearch {
	folder?: MailFolder;
	course?: number;
	m?: number;
	q?: string;
	page?: number;
}

export interface MailPerson {
	id: number;
	fullname: string;
	pictureurl?: string;
	type?: "to" | "cc" | "bcc";
}

export interface MailSummary {
	id: number;
	subject: string;
	attachments: number;
	draft: boolean;
	time: number;
	unread: boolean;
	starred: boolean;
	course: { id: number; shortname: string };
	sender: MailPerson;
	recipients: MailPerson[];
	labels: { id: number; name: string; color: string }[];
}

export interface MailAttachment {
	filename: string;
	mimetype: string;
	filesize: number;
	fileurl: string;
}

export interface MailMessage extends Omit<MailSummary, "attachments"> {
	content: string;
	format: number;
	attachments: MailAttachment[];
	references: { id: number; subject: string; content: string; format: number; time: number; sender: MailPerson; attachments: MailAttachment[] }[];
}

interface MailMenu {
	unread: number;
	drafts: number;
	courses: { id: number; shortname: string; fullname: string; unread: number; visible: boolean }[];
	labels: { id: number; name: string; color: string; unread: number }[];
}

export const PAGE_SIZE = 30;

export const useMailUnread = () => useQuery({ queryKey: ["mail", "unread"], queryFn: () => call<number>("local_dcpcmail_get_unread_count"), staleTime: 2 * 60_000 });

export const useMailMenu = () => useQuery({ queryKey: ["mail", "menu"], queryFn: () => call<MailMenu>("local_dcpcmail_get_menu"), staleTime: 2 * 60_000 });

export function useMailIndex(folder: MailFolder, itemid: number, query: string, page: number) {
	return useQuery({
		queryKey: ["mail", "index", folder, itemid, query, page],
		placeholderData: keepPreviousData,
		staleTime: 60_000,
		queryFn: () =>
			query
				? call<{ totalcount?: number; messages: MailSummary[] }>("local_dcpcmail_search_index", { type: folder, itemid, query: { content: query, limit: PAGE_SIZE } })
				: call<{ totalcount: number; messages: MailSummary[] }>("local_dcpcmail_get_index", { type: folder, itemid, offset: page * PAGE_SIZE, limit: PAGE_SIZE })
	});
}

/** Reading a message marks it read on E3, exactly like opening it there. */
export function useMailMessage(id: number | undefined) {
	const qc = useQueryClient();
	return useQuery({
		queryKey: ["mail", "message", id],
		enabled: !!id,
		staleTime: 5 * 60_000,
		queryFn: async () => {
			const m = await call<MailMessage>("local_dcpcmail_get_message", { id: id! });
			void qc.invalidateQueries({ queryKey: ["mail", "unread"] });
			void qc.invalidateQueries({ queryKey: ["mail", "menu"] });
			qc.setQueriesData<{ messages: MailSummary[] }>({ queryKey: ["mail", "index"] }, old => (old ? { ...old, messages: old.messages.map(x => (x.id === id ? { ...x, unread: false } : x)) } : old));
			return m;
		}
	});
}

export function useSetUnread() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, unread }: { id: number; unread: boolean }) => call<null>("local_dcpcmail_set_unread", { id, unread }),
		onSuccess: (_d, { id, unread }) => {
			qc.setQueriesData<{ messages: MailSummary[] }>({ queryKey: ["mail", "index"] }, old => (old ? { ...old, messages: old.messages.map(x => (x.id === id ? { ...x, unread } : x)) } : old));
			void qc.invalidateQueries({ queryKey: ["mail", "unread"] });
			void qc.invalidateQueries({ queryKey: ["mail", "menu"] });
		}
	});
}

export const mailE3Url = (id?: number) => e3Link(id ? `/local/dcpcmail/view.php?t=inbox&m=${id}` : "/local/dcpcmail/view.php?t=inbox&c=1");
