import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

const COMPONENT_ATTRIBUTE_OPTIONS = {
  bladeDirectiveArgSpacing: "space",
  singleAttributePerLine: true,
} as const;

describe("directives/component-attribute-directives", () => {
  it("keeps @class tight on x- component attributes", async () => {
    const input = `<x-button
  href=""
  theme="outline-dark"
  size="sm"
  @class([])
>
  Content
</x-button>
`;

    const expected = `<x-button
  href=""
  theme="outline-dark"
  size="sm"
  @class([])
>
  Content
</x-button>
`;

    await formatEqual(input, expected, COMPONENT_ATTRIBUTE_OPTIONS);
  });

  it("keeps multiple attribute directives tight on x: component attributes", async () => {
    const input = `<x:button
  type="button"
  @class(['btn' => true])
  @style(['display: block'])
  @disabled($isDisabled)
/>
`;

    const expected = `<x:button
  type="button"
  @class(['btn' => true])
  @style(['display: block'])
  @disabled($isDisabled)
/>
`;

    await formatEqual(input, expected, COMPONENT_ATTRIBUTE_OPTIONS);
  });

  it("keeps control directives tight on component tags but not regular elements", async () => {
    const input = `<div>
  <x-button
    @if($active) disabled @endif
  />
  <button
    @if($active) disabled @endif
  ></button>
</div>
`;

    const expected = `<div>
  <x-button @if($active) disabled @endif />
  <button @if ($active) disabled @endif></button>
</div>
`;

    await formatEqual(input, expected, COMPONENT_ATTRIBUTE_OPTIONS);
  });

  it("keeps directive fragments tight in component attribute names", async () => {
    const input = `<x-button data-@IF($ok)-flag="v"></x-button>
`;

    const expected = `<x-button data-@if($ok)-flag="v"></x-button>
`;

    await formatEqual(input, expected, {
      bladeDirectiveCase: "lower",
      bladeDirectiveArgSpacing: "space",
    });
  });

  for (const tagName of ["flux-button", "flux:button", "livewire-widget", "livewire:widget"]) {
    it(`keeps attribute directives tight on <${tagName}>`, async () => {
      const input = `<${tagName}
  size="sm"
  @selected($isCurrent)
  @required($isRequired)
/>
`;

      const expected = `<${tagName}
  size="sm"
  @selected($isCurrent)
  @required($isRequired)
/>
`;

      await formatEqual(input, expected, COMPONENT_ATTRIBUTE_OPTIONS);
    });
  }

  it("only suppresses directive arg spacing for Blade component tags in nested markup", async () => {
    const input = `<div>
  <x-panel
    type="panel"
    @class([])
  >
    <button
      type="button"
      @class([])
    >
      Click
    </button>
    <x-button
      theme="primary"
      @style(['display: block'])
    />
  </x-panel>
</div>
`;

    const expected = `<div>
  <x-panel
    type="panel"
    @class([])
  >
    <button
      type="button"
      @class ([])
    >
      Click
    </button>
    <x-button
      theme="primary"
      @style(['display: block'])
    />
  </x-panel>
</div>
`;

    await formatEqual(input, expected, COMPONENT_ATTRIBUTE_OPTIONS);
  });

  for (const tagName of ["widget-card", "widget:card"]) {
    it(`supports custom component prefixes for <${tagName}> attribute directives`, async () => {
      const input = `<${tagName}
  title="Details"
  @checked($isSelected)
  @readonly($isLocked)
/>
`;

      const expected = `<${tagName}
  title="Details"
  @checked($isSelected)
  @readonly($isLocked)
/>
`;

      await formatEqual(input, expected, {
        ...COMPONENT_ATTRIBUTE_OPTIONS,
        bladeComponentPrefixes: ["widget"],
      });
    });
  }
});
