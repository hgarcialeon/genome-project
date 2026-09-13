/**
 * The canonical document Milestone 1 demonstrates (RFC-0009 §7), inlined at
 * build time so the page needs no server to open it.
 */
import canonicalSource from "../../../SPEC/examples/genome-project.yaml";

export const CANONICAL_DOCUMENT_NAME = "SPEC/examples/genome-project.yaml";
export const CANONICAL_WORKFLOW = "rfc-lifecycle";
export const CANONICAL_DOCUMENT: string = canonicalSource;
