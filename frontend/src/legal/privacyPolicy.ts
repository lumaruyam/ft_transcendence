//Owner: Track 4 (Whiteboard, notes, and supporting modules)
//Responsible for: the Privacy Policy page — mandatory, non-placeholder, reachable via footer link per the general requirements.

interface Section {
	title: string;
	paragraphs: string[];
}

const LAST_UPDATED = "20 October 2026";

const SECTIONS: Section[] = [
	{
		title: "1. Who we are",
		paragraphs: [
			"ft_transcendence is a student project built at 42 Paris by the students listed in the repository README. It is not a company and not a commercial service. It exists so we can learn, and so our school can grade our work.",
			"Whoever runs a copy of this application is the data controller for the data stored in it. If you are using an instance hosted by someone else, contact that person.",
		],
	},
	{
		title: "2. What we collect",
		paragraphs: [
			"Account data: your email address and your display name. If you sign up with a password, we store a salted scrypt hash of it, never the password itself. You may also upload a profile picture as PNG, JPEG, GIF or WebP; it is stored on our server and is reachable by anyone who has its address, which is a random identifier.",
			"GitHub sign-in: if you sign in with GitHub, we receive your GitHub account identifier, your public profile name, your primary email address and your avatar URL. Your GitHub picture is used as your profile picture until you upload your own. We also store the GitHub access token GitHub gives us, encrypted with AES-256-GCM. The token is requested with the scopes read:user, user:email and repo, and it is only used to list the branches of a repository and to create a branch when you link a card to Git.",
			"Content you create: projects, boards, lists, cards, tags, notes, folders, whiteboards and the files you upload. For each item we record who created it or last changed it, and when. Uploaded files are limited to 10 MB and to images, PDF, plain text, Markdown, JSON and ZIP files.",
			"Activity data: the notifications generated for you, the invitation links you create or use, the API keys you generate (only a hash of each key is stored) and the Git branches you link to cards.",
			"GitHub webhooks: when a repository is linked to a project, GitHub sends us events about pushes and pull requests on that repository. We store each event, including its content such as branch names, commit messages and the GitHub usernames involved, so cards can move automatically and so problems can be investigated.",
			"Technical data: ordinary server logs, which include your IP address, the page or endpoint requested and the time. We keep these to debug problems and to notice abuse.",
		],
	},
	{
		title: "3. Why we collect it",
		paragraphs: [
			"Only to make the application work: to sign you in, to show you your projects, to let your teammates see what you wrote, to link cards to Git branches, and to notify you when something changes.",
			"We do not sell your data. We do not share it with advertisers. There is no analytics, no advertising and no tracking of any kind in this application.",
		],
	},
	{
		title: "4. Legal basis (GDPR)",
		paragraphs: [
			"For your account and the content you create, our legal basis is performance of a contract: we cannot provide the service without storing them.",
			"For GitHub sign-in and Git integration, our legal basis is your consent, which you give when you authorize the application on GitHub. You can withdraw it at any time from your GitHub settings.",
			"For server logs and security measures, our legal basis is legitimate interest in keeping the service working and protecting it from abuse.",
		],
	},
	{
		title: "5. Who can see your data",
		paragraphs: [
			"Other members of a project can see the content of that project, including notes, cards, files, and the name attached to each change. They can also see your name and email address in the member list. If you do not want someone to see something, do not put it in a project they belong to.",
			"Nobody outside your projects can see your content. Files can only be downloaded by signed-in members of their project.",
			"We do not send your data to any third party, with one exception: GitHub. If you sign in with GitHub or link a card to a repository, requests are exchanged with GitHub. GitHub has its own privacy policy.",
		],
	},
	{
		title: "6. Where it is stored and for how long",
		paragraphs: [
			"All data is stored in a PostgreSQL database on the machine running the application. Uploaded files are stored on that machine's disk. Nothing is stored anywhere else.",
			"Your data is kept for as long as your account exists. Content you delete yourself is removed right away. Server logs are short-lived and are overwritten as the service runs.",
		],
	},
	{
		title: "7. Your rights",
		paragraphs: [
			"You can see your account information in your settings at any time, and change your display name, your profile picture and your password there. Your email address cannot be edited from the application yet: to correct it, or to get a copy of your data, contact the team running the instance and we will do it for you.",
			"You can delete your account from your settings. When you do, your account row is deleted: your email, your name, your profile picture file, your password hash and your GitHub link and token are erased. Your notifications and your API keys are permanently deleted.",
			"Content you created inside a shared project stays in that project so that your teammates' work is not broken by your departure. If you own a project that has other members, you choose which member it is transferred to before your account is deleted; if you are the only member, the project and everything in it is deleted with your account.",
			"You also have the right to object, to restrict processing and to complain to a data protection authority. In France, that is the CNIL at www.cnil.fr.",
		],
	},
	{
		title: "8. Security",
		paragraphs: [
			"Passwords are hashed with scrypt and a per-user salt. Sessions use signed tokens that expire after 24 hours. GitHub tokens are encrypted at rest. API keys and invitation links are stored as hashes. GitHub webhooks are checked with an HMAC signature.",
			"Traffic between your browser and the server is encrypted with HTTPS.",
			"This is a student project. We have done our best, but we cannot promise the security of a professional service. Please do not store anything genuinely sensitive here.",
		],
	},
	{
		title: "9. Cookies and browser storage",
		paragraphs: [
			"We use no cookies. We store a few things in your browser's local storage: the token that keeps you signed in and a copy of your name and email for display, your light or dark theme choice, and the last repository address you typed when linking a card to Git. Signing out removes the token and the copy of your profile. Clearing your browser data removes everything.",
			"We use no advertising cookies, no analytics and no third-party trackers.",
		],
	},
	{
		title: "10. Children",
		paragraphs: [
			"This service is not intended for anyone under 15, the age of digital consent in France. We do not knowingly collect data from children.",
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
			"Questions about your data can be sent to the team that runs this instance. For the original project, that is the 42 Paris students listed in the repository README.",
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
