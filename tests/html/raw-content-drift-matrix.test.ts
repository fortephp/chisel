import { describe, expect, it } from "vitest";
import { formatWithPasses, wrapInDiv } from "../helpers.js";

const profiles = [
  { name: "php-off", options: { bladePhpFormatting: "off" as const } },
  { name: "php-safe", options: { bladePhpFormatting: "safe" as const } },
  {
    name: "php-off-tabs",
    options: { bladePhpFormatting: "off" as const, useTabs: true, tabWidth: 2 },
  },
] as const;

const fixtures = [
  {
    name: "unknown-script-type",
    source: `<script type="text/unknown">
const payload = {
  plain: {{
      Js::from($plain)
  }},
  raw: {!!
      Js::from($raw)
  !!},
  triple: {{{
      Js::from($triple)
  }}},
}
</script>
`,
  },
  {
    name: "json-script",
    source: `<script type="application/json">
{
  "payload": {{
      Js::from($payload)
  }}
}
</script>
`,
  },
  {
    name: "html-script",
    source: `<script type="text/html">
<template>
  <span>{{
      $label
  }}</span>
</template>
</script>
`,
  },
  {
    name: "script-string-literal",
    source: `<script>
const value = "{{
      $value
  }}";
</script>
`,
  },
  {
    name: "script-template-literal",
    source: `<script>
const value = \`{{
      $value
  }}\`;
</script>
`,
  },
  {
    name: "script-comment",
    source: `<script>
// {{
//      $value
//  }}
const value = 1
</script>
`,
  },
  {
    name: "script-block-comment",
    source: `<script>
/*
  {{
      $value
  }}
*/
const value = 1
</script>
`,
  },
  {
    name: "unknown-script-directives",
    source: `<script type="text/unknown">
@foreach ($items as $item)
const value = "{{ $item }}"
@endforeach
</script>
`,
  },
  {
    name: "unknown-script-php-tag",
    source: `<script type="text/unknown">
<?php
  $value = [
    "a" => 1,
  ];
?>
const value = 1
</script>
`,
  },
  {
    name: "svg-script",
    source: `<svg>
  <script>
const payload = {
  plain: {{
      Js::from($plain)
  }},
  raw: {!!
      Js::from($raw)
  !!},
}
  </script>
</svg>
`,
  },
  {
    name: "prefixed-svg-script",
    source: `<svg:script>
const payload = {
  plain: {{
      Js::from($plain)
  }},
  raw: {!!
      Js::from($raw)
  !!},
}
</svg:script>
`,
  },
  {
    name: "scss-style-values",
    source: `<style lang="scss">
.card {
  color: {{
      theme_color()
  }};
  background: {!!
      theme_background()
  !!};
}
</style>
`,
  },
  {
    name: "unknown-style-lang",
    source: `<style lang="unknown">
.card {
  color: {{
      theme_color()
  }};
  background: {!!
      theme_background()
  !!};
}
</style>
`,
  },
  {
    name: "prefixed-svg-style",
    source: `<svg:style>
.card {
  color: {{
      theme_color()
  }};
  background: {!!
      theme_background()
  !!};
}
</svg:style>
`,
  },
  {
    name: "style-parser-bypass",
    source: `<style>
.card {
  content: /x\\ //;
  color: {{
      theme_color()
  }};
  background: {!!
      theme_background()
  !!};
}
</style>
`,
  },
] as const;

describe("html/raw-content-drift-matrix", () => {
  for (const fixture of fixtures) {
    for (const profile of profiles) {
      it(`keeps ${fixture.name} stable with ${profile.name}`, async () => {
        for (let depth = 0; depth <= 2; depth++) {
          const output = await formatWithPasses(wrapInDiv(fixture.source, depth), profile.options, {
            passes: 4,
            assertIdempotent: true,
          });

          expect(output).not.toContain("__blade_expr_slot_");
          expect(output).not.toContain("__blade_stmt_slot_");
          expect(output).not.toContain("__blade_value_slot_");
        }
      });
    }
  }
});
