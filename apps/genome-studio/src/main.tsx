import { render } from "preact";

import { App } from "./app.js";

const root = document.getElementById("studio");
if (root === null) throw new Error("Studio root element is missing");
render(<App />, root);
