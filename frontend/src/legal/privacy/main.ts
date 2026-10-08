// Owner: Track 4 (Whiteboard, notes, and supporting modules)
// Responsible for: the /legal/privacy entry point.
import { boot } from "../../shared/boot";
import LegalPage from "../LegalPage.svelte";
import { renderPrivacyPolicyPage } from "../privacyPolicy";

boot(LegalPage, { props: { render: renderPrivacyPolicyPage, other: { href: "/legal/terms", label: "Terms of Service" } } });
