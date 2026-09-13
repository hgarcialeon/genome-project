/** Each test renders into a clean document; Studio holds no state between them. */
import { cleanup } from "@testing-library/preact";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
