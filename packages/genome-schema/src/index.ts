import Ajv2020, { type ErrorObject } from "ajv/dist/2020.js";
import YAML from "yaml";

export type ValidationResult = {
  valid: boolean;
  errors: ErrorObject[];
};

/**
 * Parse a Genome document from its YAML source.
 *
 * Throws a YAML parse error when the source is not well-formed.
 */
export function parseGenomeDocument(input: string): unknown {
  return YAML.parse(input);
}

/**
 * Build a validator bound to a JSON Schema.
 *
 * The Genome schema targets JSON Schema draft 2020-12, so we use the
 * matching Ajv build rather than the default draft-07 one.
 */
export function createValidator(schema: object) {
  const ajv = new Ajv2020({ allErrors: true, allowUnionTypes: true });
  const validate = ajv.compile(schema);

  return (document: unknown): ValidationResult => {
    const valid = validate(document);
    return {
      valid: Boolean(valid),
      errors: validate.errors ?? [],
    };
  };
}

/**
 * Turn Ajv errors into human-readable lines like `company must have required
 * property 'name'`.
 */
export function formatErrors(errors: ErrorObject[]): string[] {
  return errors.map((error) => {
    const path = error.instancePath ? error.instancePath.replace(/^\//, "").replace(/\//g, ".") : "(root)";
    return `${path} ${error.message ?? "is invalid"}`.trim();
  });
}
