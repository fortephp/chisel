export type TreeDirectiveArgsDefinition =
  | boolean
  | {
      allowed?: boolean;
      required?: boolean;
    }
  | null
  | undefined;

export interface TreeDirectiveStructureDefinition {
  role?: string;
  condition?: boolean;
  terminators?: string;
  branches?: string;
  type?: string;
  parent?: string;
  optional?: boolean;
  pairing_strategy?: string;
}

export interface TreeDirectiveDefinition {
  name: string;
  args?: TreeDirectiveArgsDefinition;
  structure?: TreeDirectiveStructureDefinition;
}
