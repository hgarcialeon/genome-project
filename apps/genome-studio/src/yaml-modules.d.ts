/** Genome documents are inlined as text at build time (see `vite.config.ts`). */
declare module "*.yaml" {
  const source: string;
  export default source;
}
