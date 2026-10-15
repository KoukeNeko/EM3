// Subsets of Moodle 4.5 web service response shapes that EM3 relies on.
// Fields not listed here exist but are unused.

export interface SiteInfo {
	sitename: string;
	username: string;
	firstname: string;
	lastname: string;
	fullname: string;
	lang: string;
	userid: number;
	siteurl: string;
	userpictureurl: string;
	release: string;
	usermaxuploadfilesize: number;
}

export interface EnrolledCourse {
	id: number;
	shortname: string;
	fullname: string;
	displayname?: string;
	summary: string;
	summaryformat: number;
	category?: number;
	startdate: number;
	enddate: number;
	visible: number;
	lastaccess?: number | null;
	isfavourite?: boolean;
	hidden?: boolean;
	format?: string;
	courseimage?: string;
	progress?: number | null;
	completed?: boolean;
}

export interface ContentFile {
	type: "file" | "url" | "content";
	filename: string;
	filepath: string;
	filesize: number;
	fileurl: string;
	timecreated: number | null;
	timemodified: number;
	mimetype?: string;
	sortorder?: number;
	isexternalfile?: boolean;
}

export interface CourseModule {
	id: number;
	url?: string;
	name: string;
	instance: number;
	contextid?: number;
	description?: string;
	visible: number;
	uservisible: boolean;
	visibleoncoursepage: number;
	modicon: string;
	modname: string;
	modplural: string;
	availabilityinfo?: string;
	indent: number;
	onclick?: string;
	afterlink?: string | null;
	customdata?: string;
	noviewlink?: boolean;
	completion?: number;
	dates?: { label: string; timestamp: number; dataid?: string }[];
	contents?: ContentFile[];
	contentsinfo?: { filescount: number; filessize: number; lastmodified: number; mimetypes: string[]; repositorytype: string };
}

export interface CourseSection {
	id: number;
	name: string;
	visible: number;
	summary: string;
	summaryformat: number;
	section: number;
	hiddenbynumsections: number;
	uservisible: boolean;
	modules: CourseModule[];
}

export interface ForumInfo {
	id: number;
	course: number;
	type: string;
	name: string;
	intro: string;
	cmid: number;
	numdiscussions?: number;
}

export interface InlineFile {
	filename: string;
	filepath: string;
	filesize: number;
	fileurl: string;
	timemodified: number;
	mimetype: string;
}

export interface ForumDiscussion {
	id: number;
	name: string;
	groupid: number;
	timemodified: number;
	usermodified: number;
	timestart: number;
	timeend: number;
	discussion: number;
	parent: number;
	userid: number;
	created: number;
	modified: number;
	mailed: number;
	subject: string;
	message: string;
	messageformat: number;
	messagetrust: number;
	attachment: boolean | string;
	attachments?: InlineFile[];
	messageinlinefiles?: InlineFile[];
	totalscore: number;
	mailnow: number;
	userfullname: string;
	usermodifiedfullname: string;
	userpictureurl: string;
	numreplies: number;
	numunread: number;
	pinned: boolean;
	locked: boolean;
	starred: boolean;
}

export interface AssignConfig {
	plugin: string;
	subtype: "assignsubmission" | "assignfeedback";
	name: string;
	value: string;
}

export interface Assignment {
	id: number;
	cmid: number;
	course: number;
	name: string;
	nosubmissions: number;
	submissiondrafts: number;
	sendnotifications: number;
	duedate: number;
	allowsubmissionsfromdate: number;
	grade: number;
	timemodified: number;
	completionsubmit: number;
	cutoffdate: number;
	gradingduedate: number;
	teamsubmission: number;
	requireallteammemberssubmit: number;
	requiresubmissionstatement: number;
	maxattempts: number;
	attemptreopenmethod: string;
	configs: AssignConfig[];
	intro: string;
	introformat: number;
	introfiles?: InlineFile[];
	introattachments?: InlineFile[];
	activity?: string;
	submissionstatement?: string;
	timelimit?: number;
}

export interface AssignmentsResponse {
	courses: { id: number; fullname: string; shortname: string; timemodified: number; assignments: Assignment[] }[];
	warnings: unknown[];
}

export interface SubmissionPlugin {
	type: string;
	name: string;
	fileareas?: { area: string; files?: InlineFile[] }[];
	editorfields?: { name: string; description: string; text: string; format: number }[];
}

export interface Submission {
	id: number;
	userid: number;
	attemptnumber: number;
	timecreated: number;
	timemodified: number;
	timestarted?: number | null;
	status: "new" | "draft" | "submitted" | "reopened";
	groupid: number;
	assignment?: number;
	latest?: number;
	plugins?: SubmissionPlugin[];
	gradingstatus?: string;
}

export interface SubmissionStatus {
	gradingsummary?: unknown;
	lastattempt?: {
		submission?: Submission;
		teamsubmission?: Submission;
		submissiongroup?: number;
		submissionsenabled: boolean;
		locked: boolean;
		graded: boolean;
		canedit: boolean;
		caneditowner: boolean;
		cansubmit: boolean;
		extensionduedate: number | null;
		timelimit?: number;
		blindmarking: boolean;
		gradingstatus: string;
		usergroups: number[];
	};
	feedback?: {
		grade?: { grade: string; timemodified: number; grader: number };
		gradefordisplay: string;
		gradeddate: number;
		plugins?: SubmissionPlugin[];
	};
	previousattempts?: unknown[];
	assignmentdata?: { attachments?: { intro?: InlineFile[] }; activity?: string; activityformat?: number };
	warnings: unknown[];
}

export interface CalendarEvent {
	id: number;
	name: string;
	description: string;
	descriptionformat: number;
	location?: string;
	categoryid?: number | null;
	groupid?: number | null;
	userid?: number | null;
	repeatid?: number | null;
	eventcount?: number | null;
	component?: string | null;
	modulename?: string | null;
	activityname?: string | null;
	activitystr?: string | null;
	instance?: number | null;
	eventtype: string;
	timestart: number;
	timeduration: number;
	timesort: number;
	timeusermidnight: number;
	visible: number;
	timemodified: number;
	overdue?: boolean;
	icon?: { key: string; component: string; alttext: string; iconurl?: string };
	course?: { id: number; fullname: string; shortname: string; viewurl: string };
	canedit: boolean;
	candelete: boolean;
	url: string;
	action?: { name: string; url: string; itemcount: number; actionable: boolean; showitemcount: boolean };
	formattedtime?: string;
	isactionevent: boolean;
	iscourseevent: boolean;
	iscategoryevent: boolean;
	normalisedeventtype: string;
	normalisedeventtypetext: string;
	purpose?: string;
}

export interface Notification {
	id: number;
	useridfrom: number;
	useridto: number;
	subject: string;
	shortenedsubject: string;
	text: string;
	fullmessage: string;
	fullmessageformat: number;
	fullmessagehtml: string;
	smallmessage: string;
	contexturl: string | null;
	contexturlname: string | null;
	timecreated: number;
	timecreatedpretty: string;
	timeread: number | null;
	read: boolean;
	deleted: boolean;
	iconurl: string;
	component?: string;
	eventtype?: string;
	customdata?: string;
}
