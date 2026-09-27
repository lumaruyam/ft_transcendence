//Owner: Track 4 (Whiteboard, notes, and supporting modules)
//Responsible for: the Privacy Policy page — mandatory, non-placeholder, reachable via footer link per the general requirements.

interface Section {
	title: string;
	paragraphs: string[];
}

const LAST_UPDATED = "11 September 2026";

const SECTIONS: Section[] = [
	{
		title: "1. Who we are",
		paragraphs: [
			"ft_transcendence is a student project built by five students at 42 Paris. It is not a company and not a commercial service. It exists so we can learn, and so our school can grade our work.",
			"Whoever runs a copy of this application is responsible for the data stored in it. If you are using an instance hosted by someone else, contact that person.",
		],
	},
	{
		title: "2. What we collect",
		paragraphs: [
			"Account data: your email address, your display name, and your password. Passwords are never stored in readable form — we store a salted hash. If you sign in with GitHub instead, we store that provider's name and the account identifier it gives us, but not your GitHub password. You may also set an avatar image URL.",
			"Content you create: projects, boards, lists, cards, notes, whiteboards, and any files you upload. For each of these we also record who created or last modified it, and when.",
			"Activity data: notifications generated for you, invitation links you create or use, API keys you generate, and — if you connect a Git repository — the webhook events we receive from GitHub about that repository.",
			"Technical data: ordinary web server logs, which include your IP address, the page or endpoint requested, and the time. We keep these to debug problems and to notice abuse.",
		],
	},
	{
		title: "3. Why we collect it",
		paragraphs: [
			"Only to make the application work: to sign you in, to show you your projects, to let your teammates see what you wrote, and to notify you when something changes.",
			"We do not sell your data. We do not share it with advertisers. There is no analytics, no advertising, and no tracking of any kind in this application.",
		],
	},
	{
		title: "4. Legal basis (GDPR)",
		paragraphs: [
			"For your account and the content you create, our legal basis is performance of a contract: we cannot provide the service without storing them.",
			"For server logs and security measures, our legal basis is legitimate interest in keeping the service working and protecting it from abuse.",
		],
	},
	{
		title: "5. Who can see your data",
		paragraphs: [
			"Other members of a project can see the content of that project, including notes, cards, files, and the name attached to each change. If you do not want someone to see something, do not put it in a project they belong to.",
			"Nobody outside your projects can see your content. We do not send your data to any third party, with one exception: if you link a Git repository, requests are exchanged with GitHub so that repository events can be shown in the application. GitHub has its own privacy policy.",
		],
	},
	{
		title: "6. Where it is stored and for how long",
		paragraphs: [
			"All data is stored in a PostgreSQL database on the machine running the application. Uploaded files are stored on that machine's disk. Nothing is stored outside it.",
			"Your data is kept for as long as your account exists. Content you delete yourself is removed. Server logs are short-lived and are overwritten as the service runs.",
		],
	},
	{
		title: "7. Your rights",
		paragraphs: [
			"You can see and correct your account information in your settings at any time.",
			"You can export your data in a machine-readable format from your settings.",
			"You can delete your account. When you do, we remove your personal information — your email, your name, and your avatar are erased, and your login credentials are destroyed. Your notifications and your API keys are permanently deleted.",
			"Content you created inside a shared project stays in that project, no longer attached to your name, so that your teammates' work is not broken by your departure. If you own a project that has other members, you choose which member it is transferred to before your account is deleted; if you are the only member, the project is deleted with your account.",
			"You also have the right to complain to a data protection authority. In France, that is the CNIL (www.cnil.fr).",
		],
	},
	{
		title: "8. Security",
		paragraphs: [
			"Passwords are hashed with scrypt and a per-user salt, so we never see or store the password itself. Sessions use signed tokens that expire.",
			"Traffic between your browser and the server is encrypted with HTTPS.",
			"This is a student project. We have done our best, but we cannot promise the security of a professional service. Please do not store anything genuinely sensitive here.",
		],
	},
	{
		title: "9. Cookies and browser storage",
		paragraphs: [
			"We store one thing in your browser: the token that keeps you signed in. Removing it signs you out.",
			"We use no advertising cookies, no analytics cookies, and no third-party trackers.",
		],
	},
	{
		title: "10. Children",
		paragraphs: [
			"This service is not intended for anyone under 16. We do not knowingly collect data from children.",
		],
	},
	{
		title: "11. Changes to this policy",
		paragraphs: [
			"If we change how the application handles data, we will update this page and change the date at the top.",
		],
	},
	{
		title: "12. Contact",
		paragraphs: [
			"Questions about your data can be sent to the team that runs this instance. For the original project, that is the five students at 42 Paris listed in the repository README.",
		],
	},
];

// renderPrivacyPolicyPage mounts the Privacy Policy page content.
export function renderPrivacyPolicyPage(container: HTMLElement): void {
	container.textContent = "";

	const title = document.createElement("h1");
	title.textContent = "Privacy Policy";
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
