import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

describe("html/raw-content-detection", () => {
  const phpSafe = { bladePhpFormatting: "safe" as const };

  const cssAtRuleCases = [
    {
      name: "@media",
      input: `<style>@media (max-width: 768px){.asset{background:url("{{ asset('panel.png') }}");color:red}}</style>
`,
      expected: `<style>
  @media (max-width: 768px) {
    .asset {
      background: url("{{ asset('panel.png') }}");
      color: red;
    }
  }
</style>
`,
    },
    {
      name: "@font-face",
      input: `<style>@font-face{font-family:"Mona Sans";src:url("{{ asset('fonts/Mona-Sans.woff2') }}") format("woff2");font-weight:200 900}</style>
`,
      expected: `<style>
  @font-face {
    font-family: "Mona Sans";
    src: url("{{ asset('fonts/Mona-Sans.woff2') }}") format("woff2");
    font-weight: 200 900;
  }
</style>
`,
    },
    {
      name: "@counter-style",
      input: `<style>@counter-style ticks{system:cyclic;symbols:"{{ $tick }}";suffix:" "}</style>
`,
      expected: `<style>
  @counter-style ticks {
    system: cyclic;
    symbols: "{{ $tick }}";
    suffix: " ";
  }
</style>
`,
    },
    {
      name: "@property",
      input: `<style>@property --brand-color{syntax:"<color>";inherits:false;initial-value:{{ $brandColor }}}</style>
`,
      expected: `<style>
  @property --brand-color {
    syntax: "<color>";
    inherits: false;
    initial-value: {{ $brandColor }};
  }
</style>
`,
    },
    {
      name: "@starting-style",
      input: `<style>@starting-style{.panel{opacity:{{ $initialOpacity }};color:red}}</style>
`,
      expected: `<style>
  @starting-style {
    .panel {
      opacity: {{ $initialOpacity }};
      color: red;
    }
  }
</style>
`,
    },
    {
      name: "@keyframes",
      input: `<style>@keyframes slide{from{transform:translateX({{ $start }})}to{transform:translateX({{ $end }})}}</style>
`,
      expected: `<style>
  @keyframes slide {
    from {
      transform: translateX({{ $start }});
    }
    to {
      transform: translateX({{ $end }});
    }
  }
</style>
`,
    },
  ];

  it("keeps CSS embedding for known @media rules", async () => {
    const input = `<style>@media (max-width: 768px){.a{color:red}}</style>
`;

    const expected = `<style>
  @media (max-width: 768px) {
    .a {
      color: red;
    }
  }
</style>
`;

    await formatEqual(input, expected, phpSafe);
  });

  it("keeps @font-face intact with Blade values", async () => {
    const input = `<style>
@font-face {
    font-family: 'Mona Sans';
    src:
        url('{{ asset('fonts/Mona-Sans.woff2') }}') format('woff2 supports variations'),
        url('{{ asset('fonts/Mona-Sans.woff2') }}') format('woff2-variations');
    font-weight: 200 900;
}
</style>
`;

    const expected = `<style>
  @font-face {
    font-family: "Mona Sans";
    src:
      url("{{ asset('fonts/Mona-Sans.woff2') }}") format("woff2 supports variations"),
      url("{{ asset('fonts/Mona-Sans.woff2') }}") format("woff2-variations");
    font-weight: 200 900;
  }
</style>
`;

    await formatEqual(input, expected, phpSafe);
  });

  for (const atRule of cssAtRuleCases) {
    it(`keeps ${atRule.name} as CSS when Blade values are present`, async () => {
      await formatEqual(atRule.input, atRule.expected, phpSafe);
    });
  }

  it("keeps nested CSS at-rules and Blade style directives stable together", async () => {
    const input = `<style>
@media (min-width: 768px){@font-face{font-family:"Mona Sans";src:url("{{ asset('fonts/Mona-Sans.woff2') }}");}@if($dark).theme{color:{{ $color }};}@endif}
@supports (display:grid){@starting-style{.panel{opacity:{{ $opacity }}}}}
</style>
`;

    const expected = `<style>
  @media (min-width: 768px) {
    @font-face {
      font-family: "Mona Sans";
      src: url("{{ asset('fonts/Mona-Sans.woff2') }}");
    }
    @if ($dark)
    .theme {
      color: {{ $color }};
    }
    @endif
  }
  @supports (display: grid) {
    @starting-style {
      .panel {
        opacity: {{ $opacity }};
      }
    }
  }
</style>
`;

    await formatEqual(input, expected, phpSafe);
  });

  it("indents Blade directive branches inside CSS at-rule blocks", async () => {
    const input = `<style>@media (min-width:768px){@if($dark).theme{color:{{ $color }}}@else.theme{color:red}@endif}</style>
`;

    const expected = `<style>
  @media (min-width: 768px) {
    @if ($dark)
    .theme {
      color: {{ $color }};
    }
    @else
    .theme {
      color: red;
    }
    @endif
  }
</style>
`;

    await formatEqual(input, expected, phpSafe);
  });

  it("respects tabWidth for Blade directives inside CSS at-rule blocks", async () => {
    const input = `<style>@media (min-width:768px){@if($dark).theme{color:{{ $color }}}@else.theme{color:red}@endif}</style>
`;

    const expected = `<style>
    @media (min-width: 768px) {
        @if ($dark)
        .theme {
            color: {{ $color }};
        }
        @else
        .theme {
            color: red;
        }
        @endif
    }
</style>
`;

    await formatEqual(input, expected, { ...phpSafe, tabWidth: 4 });
  });

  it("respects tabs for Blade directives inside CSS at-rule blocks", async () => {
    const input = `<style>@media (min-width:768px){@if($dark).theme{color:{{ $color }}}@else.theme{color:red}@endif}</style>
`;

    const expected = `<style>
\t@media (min-width: 768px) {
\t\t@if ($dark)
\t\t.theme {
\t\t\tcolor: {{ $color }};
\t\t}
\t\t@else
\t\t.theme {
\t\t\tcolor: red;
\t\t}
\t\t@endif
\t}
</style>
`;

    await formatEqual(input, expected, { ...phpSafe, useTabs: true });
  });

  it("keeps CSS at-rule-looking text inside JavaScript strings", async () => {
    const input = `<script>
const css="@font-face{font-family:'Mona Sans'}";
const counter=\`@counter-style ticks { symbols: "{{ $tick }}"; }\`;
</script>
`;

    const expected = `<script>
  const css = "@font-face{font-family:'Mona Sans'}";
  const counter = \`@counter-style ticks { symbols: "{{ $tick }}"; }\`;
</script>
`;

    await formatEqual(input, expected, phpSafe);
  });

  it("formats regular Blade directive pairs inside JavaScript content", async () => {
    const input = `<script>
@if($enabled)
window.app={name:"{{ $name }}"};
@endif
</script>
`;

    const expected = `<script>
  @if ($enabled)
  window.app = { name: "{{ $name }}" };
  @endif
</script>
`;

    await formatEqual(input, expected, phpSafe);
  });

  it("does not treat @click-style names as Blade in style content", async () => {
    const input = `<style>@click{color:red}</style>
`;

    const expected = `<style>
  @click {
    color: red;
  }
</style>
`;

    await formatEqual(input, expected, phpSafe);
  });

  it("formats style content when Blade directives are present", async () => {
    const input = `<style>@if($dark).a{color:red}@endif</style>
`;
    const expected = `<style>
  @if ($dark)
  .a {
    color: red;
  }
  @endif
</style>
`;

    await formatEqual(input, expected, phpSafe);
  });

  it("formats style content for trained custom directive pairs", async () => {
    const input = `<style>@disk($theme).a{color:red}@enddisk</style>
`;
    const expected = `<style>
  @disk ($theme)
  .a {
    color: red;
  }
  @enddisk
</style>
`;

    await formatEqual(input, expected, phpSafe);
  });
});
