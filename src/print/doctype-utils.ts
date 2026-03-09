import type { Options } from "prettier";

const DOCTYPE_START = "<!DOCTYPE";
const DOCTYPE_START_LOWER = "<!doctype";

function parseDoctype(rawText: string): {
  normalizedValue: string;
  isSimpleHtml5: boolean;
} | null {
  const valueMatch = rawText.match(/^<!DOCTYPE\s+(.*?)\s*>$/is);
  if (!valueMatch) return null;

  const value = valueMatch[1];
  const normalizedValue = value.replace(/^html\b/i, "html").replace(/\s+/g, " ");
  const isSimpleHtml5 = /^html$/i.test(normalizedValue);
  return { normalizedValue, isSimpleHtml5 };
}

export function getDoctypeStartMarker(rawText: string, options?: Options): string {
  const parsed = parseDoctype(rawText);
  const filepath = options?.filepath;
  const hasFilepath = typeof filepath === "string" && filepath.length > 0;
  const isHtmlFilepath = hasFilepath && /\.html?$/i.test(filepath);

  if (!parsed) {
    return rawText.slice(0, DOCTYPE_START.length);
  }

  // Preserve original marker case in non-HTML files (e.g. .blade.php).
  if (hasFilepath && !isHtmlFilepath) {
    return rawText.slice(0, DOCTYPE_START.length);
  }

  if (parsed.isSimpleHtml5) {
    return DOCTYPE_START_LOWER;
  }

  return DOCTYPE_START;
}

export function formatDoctype(rawText: string, options?: Options): string {
  const parsed = parseDoctype(rawText);
  if (!parsed) {
    // Malformed EOF doctypes (e.g. "<!DOCTYPE" without closing ">") can
    // absorb trailing newlines into the doctype token and drift each pass.
    // Trim trailing whitespace for this malformed shape to keep output stable.
    if (/^<!doctype\b/i.test(rawText) && !rawText.includes(">")) {
      return rawText.trimEnd();
    }
    return rawText;
  }
  return `${getDoctypeStartMarker(rawText, options)} ${parsed.normalizedValue}>`;
}
