import Ajv from "ajv";
import YAML from "yaml";

export type ValidationResult = {
  valid: boolean;
  errors: unknown[];
};

export function parseGenomeDocument(input: string): unknown {
  return YAML.parse(input);
}

export function createValidator(schema: object) {
  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(schema);

  return (document: unknown): ValidationResult => {
    const valid = validate(document);
    return {
      valid: Boolean(valid),
      errors: validate.errors ?? [],
    };
  };
}
