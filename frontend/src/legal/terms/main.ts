// Owner: Track 4 (Whiteboard, notes, and supporting modules)
// Responsible for: the /legal/terms entry point.
import { boot } from "../../shared/boot";
import LegalPage from "../LegalPage.svelte";
import { renderTermsOfServicePage } from "../termsOfService";

boot(LegalPage, { props: { render: renderTermsOfServicePage, other: { href: "/legal/privacy", label: "Privacy Policy" } } });
