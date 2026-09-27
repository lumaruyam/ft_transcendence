//Owner: Track 4 (Whiteboard, notes, and supporting modules)
//Responsible for: the Terms of Service page — mandatory, non-placeholder, reachable via footer link per the general requirements.

interface Section {
	title: string;
	paragraphs: string[];
}

const LAST_UPDATED = "11 September 2026";

const SECTIONS: Section[] = [
	{
		title: "1. What this service is",
		paragraphs: [
			"ft_transcendence is a collaborative project workspace — boards, cards, notes, whiteboards, and file attachments — built as a student project at 42 Paris.",
			"It is provided as-is, for free, with no guarantee of any kind. By using it you accept these terms. If you do not accept them, do not create an account.",
		],
	},
	{
		title: "2. Who may use it",
		paragraphs: [
			"You must be at least 16 years old.",
			"You need one account per person. Do not share an account, and do not create an account for someone else.",
		],
	},
	{
		title: "3. Your account",
		paragraphs: [
			"You are responsible for keeping your password safe and for everything that happens under your account.",
			"If you think someone else has access to your account, change your password immediately and tell the team running the instance.",
		],
	},
	{
		title: "4. What you may not do",
		paragraphs: [
			"Do not upload content that is illegal, that infringes someone else's rights, or that contains someone else's personal data without their agreement.",
			"Do not upload malware, and do not use the service to attack it or anything else — no attempts to break authentication, no automated scraping, no deliberate overloading.",
			"Do not try to access projects you were not invited to, or data belonging to other users.",
			"Respect the upload limits on file size and file type. They exist so the service stays usable for everyone.",
		],
	},
	{
		title: "5. Your content",
		paragraphs: [
			"Everything you create here stays yours. We claim no ownership over your notes, drawings, cards, or files.",
			"You give us permission to store your content and show it to the other members of the projects you put it in. That is the only permission we need, and we use it for nothing else.",
			"You are responsible for having the right to upload what you upload.",
		],
	},
	{
		title: "6. Projects and membership",
		paragraphs: [
			"A project owner or administrator can invite members and remove them. If you are removed from a project, you lose access to its content.",
			"Content you created inside a shared project belongs to that project. It stays there when you leave, so the rest of the team is not left with holes in their work.",
		],
	},
	{
		title: "7. API keys",
		paragraphs: [
			"You can create API keys to access your data programmatically. Anything done with your key counts as done by you, so keep your keys private and revoke any key you no longer use.",
			"API requests are rate-limited. Keys that are used abusively may be revoked.",
		],
	},
	{
		title: "8. Availability and data loss",
		paragraphs: [
			"We do not promise that the service will be available, that it will keep working, or that your data will survive. It may go down without notice, and data may be lost.",
			"This is a school project, not a backed-up production system. Keep your own copy of anything you cannot afford to lose.",
		],
	},
	{
		title: "9. Ending your use",
		paragraphs: [
			"You can delete your account at any time from your settings. What happens to your data when you do is described in the Privacy Policy.",
			"We may suspend or remove an account that breaks these terms, or that puts the service or its other users at risk.",
		],
	},
	{
		title: "10. No warranty, no liability",
		paragraphs: [
			"The service is provided without warranty of any kind, express or implied.",
			"To the extent the law allows, the people who built and run this project are not liable for any damage, loss of data, or loss of any kind arising from your use of it.",
		],
	},
	{
		title: "11. Governing law",
		paragraphs: [
			"These terms are governed by French law. Any dispute falls to the competent courts in France.",
		],
	},
	{
		title: "12. Changes to these terms",
		paragraphs: [
			"We may update these terms. When we do, we will change the date at the top of this page. Continuing to use the service after a change means you accept the new terms.",
		],
	},
	{
		title: "13. Contact",
		paragraphs: [
			"Questions about these terms can be sent to the team that runs this instance. For the original project, that is the five students at 42 Paris listed in the repository README.",
		],
	},
];

// renderTermsOfServicePage mounts the Terms of Service page content.
export function renderTermsOfServicePage(container: HTMLElement): void {
	container.textContent = "";

	const title = document.createElement("h1");
	title.textContent = "Terms of Service";
	container.append(title);

	const updated = document.createElement("p");
	updated.className = "updated";
	updated.textContent = `Last updated: ${LAST_UPDATED}`;
	container.append(updated);

	for (const section of SECTIONS) {
		const heading = document.createElement("h2");
		heading.textContent = section.title;
		container.append(heading);

		for (const text of section.paragraphs) {
			const paragraph = document.createElement("p");
			paragraph.textContent = text;
			container.append(paragraph);
		}
	}
}
