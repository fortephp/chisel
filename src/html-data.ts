import { htmlTags } from "@prettier/html-tags";
import { htmlElementAttributes } from "html-element-attributes";

export const HTML_TAGS: ReadonlySet<string> = new Set(htmlTags);

export const HTML_ELEMENT_ATTRIBUTES: ReadonlyMap<string, ReadonlySet<string>> = new Map(
  Object.entries(htmlElementAttributes).map(([tagName, attributes]) => [
    tagName,
    new Set(attributes),
  ]),
);
