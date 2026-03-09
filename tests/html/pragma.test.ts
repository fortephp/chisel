// Auto-generated from Prettier HTML snapshot: pragma/
// Snapshot-derived HTML compatibility cases.

import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

describe("html/pragma", () => {
  it('no-pragma.html {"insertPragma":true}', async () => {
    const input = `

<!-- @not-a-pragma -->
<!doctype html>
<html>
            </html>
`;
    const expected = `<!-- @format -->

<!-- @not-a-pragma -->
<!doctype html>
<html></html>
`;
    await formatEqual(input, expected, { insertPragma: true });
  });

  it('no-pragma.html {"requirePragma":true}', async () => {
    const input = `

<!-- @not-a-pragma -->
<!doctype html>
<html>
            </html>
`;
    const expected = `

<!-- @not-a-pragma -->
<!doctype html>
<html>
            </html>
`;
    await formatEqual(input, expected, { requirePragma: true });
  });

  it('with-pragma.html {"insertPragma":true}', async () => {
    const input = `

<!-- @format -->
<!doctype html>
<html>
            </html>
`;
    const expected = `<!-- @format -->
<!doctype html>
<html></html>
`;
    await formatEqual(input, expected, { insertPragma: true });
  });

  it('with-pragma.html {"requirePragma":true}', async () => {
    const input = `

<!-- @format -->
<!doctype html>
<html>
            </html>
`;
    const expected = `<!-- @format -->
<!doctype html>
<html></html>
`;
    await formatEqual(input, expected, { requirePragma: true });
  });

  it('with-pragma-2.html {"insertPragma":true}', async () => {
    const input = `

<!-- @prettier -->
<!doctype html>
<html>
            </html>
`;
    const expected = `<!-- @prettier -->
<!doctype html>
<html></html>
`;
    await formatEqual(input, expected, { insertPragma: true });
  });

  it('with-pragma-2.html {"requirePragma":true}', async () => {
    const input = `

<!-- @prettier -->
<!doctype html>
<html>
            </html>
`;
    const expected = `<!-- @prettier -->
<!doctype html>
<html></html>
`;
    await formatEqual(input, expected, { requirePragma: true });
  });
});
