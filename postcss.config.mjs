import { join } from "node:path";

// Tailwind first, then `.is-hover` added to every :hover selector (record-mode cursor, lib/postcss-record-hover.cjs).
// Absolute path: Turbopack resolves plugin names from its build folder, not from this file.
export default { plugins: { "@tailwindcss/postcss": {}, [join(process.cwd(), "lib/postcss-record-hover.cjs")]: {} } };
