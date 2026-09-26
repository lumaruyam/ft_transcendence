//Owner: Track 4 (Whiteboard, notes, and supporting modules)
//Responsible for: entry point for the /legal/terms page — mounts the terms content into the page shell.

//give me this function from ../termsOfService
import { renderTermsOfServicePage } from "../termsOfService";
//find an element called legal-content from html; call it root;
const root = document.getElementById("legal-content");
//if root is valid, call renderTermsOfService to show terms
if (root) {
	renderTermsOfServicePage(root);
}