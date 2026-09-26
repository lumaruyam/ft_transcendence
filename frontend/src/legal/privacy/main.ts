//Owner: Track 4 (Whiteboard, notes, and supporting modules)
//entry point for the /legal/privacy page - mounts the policy content into the page shell.
import { renderPrivacyPolicyPage } from "../privacyPolicy";

const root = document.getElementById("legal-content");

if (root) {
	renderPrivacyPolicyPage(root);
}