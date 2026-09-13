/** YAML documents are inlined as text by the browser bundle (esbuild text loader). */
declare module "*.yaml" {
  const source: string;
  export default source;
}
