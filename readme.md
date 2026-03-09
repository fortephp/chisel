# Chisel

An opinionated Prettier plugin for Laravel Blade templates.

## Installation

Requires Node.js 18 or newer.

Install Prettier and the plugin in your project:

```bash
npm i -D prettier prettier-plugin-blade@^3
```

Optional integrations:

```bash
npm i -D @prettier/plugin-php prettier-plugin-tailwindcss
```

## Migration

Chisel v3 (`prettier-plugin-blade`) is a ground-up rewrite. Expect output changes compared to previous versions.

If you rely on previous versions, you should specify the exact version you'd like to use in your `package.json`.

## Quick Start

Create or update your `.prettierrc`:

```json
{
  "plugins": [
    "prettier-plugin-blade"
  ],
  "overrides": [
    {
      "files": ["*.blade.php"],
      "options": {
        "parser": "blade"
      }
    }
  ]
}
```

Format:

```bash
npx prettier --write "resources/views/**/*.blade.php"
```

### CLI Flags

You can pass Blade plugin options directly to the Prettier CLI as kebab-case flags:

```bash
npx prettier "resources/views/**/*.blade.php" \
  --write \
  --plugin prettier-plugin-blade \
  --plugin @prettier/plugin-php \
  --parser blade \
  --blade-php-formatting safe \
  --blade-php-formatting-targets echo \
  --blade-php-formatting-targets directiveArgs \
  --blade-component-prefixes x \
  --blade-component-prefixes flux \
  --blade-directive-arg-spacing space \
  --blade-echo-spacing tight
```

Notes:

- Use kebab-case in CLI flags (for example `bladePhpFormatting` -> `--blade-php-formatting`).
- Load `@prettier/plugin-php` when using `bladePhpFormatting: "safe"` from the CLI.
- Array options use repeated flags in CLI (for example: `--blade-inline-intent-elements p --blade-inline-intent-elements svg --blade-inline-intent-elements svg:*`).
- `bladeDirectiveCaseMap` takes a JSON object string when passed via CLI, but shell quoting is easy to get wrong. Prefer setting it in `.prettierrc`.

## PHP Formatting

To format embedded PHP fragments inside Blade, install `@prettier/plugin-php` and include it in `plugins`:

```json
{
  "plugins": [
    "prettier-plugin-blade",
    "@prettier/plugin-php"
  ],
  "overrides": [
    {
      "files": ["*.blade.php"],
      "options": {
        "parser": "blade",
        "bladePhpFormatting": "safe"
      }
    }
  ]
}
```

Notes:

- Without `@prettier/plugin-php`, the formatter still works. It falls back gracefully and leaves PHP fragments unchanged.
- `bladePhpFormatting` modes documented here: `"off"`, `"safe"`.

## Enable Tailwind CSS Class Sorting

Install the Tailwind CSS plugin and include it in `plugins`:

```json
{
  "plugins": [
    "prettier-plugin-blade",
    "prettier-plugin-tailwindcss"
  ],
  "overrides": [
    {
      "files": ["*.blade.php"],
      "options": {
        "parser": "blade"
      }
    }
  ]
}
```

## VS Code Setup

1. Install the `Prettier - Code formatter` extension (`esbenp.prettier-vscode`).
2. Ensure your project has local `devDependencies` for Prettier and this plugin.
3. Add workspace settings in `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "prettier.requireConfig": true,
  "files.associations": {
    "*.blade.php": "blade"
  },
  "[blade]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

## Options

### Blade Plugin Options

| Option | Type | Default | Values |
| --- | --- | --- | --- |
| `bladePhpFormatting` | `choice` | `"safe"` | `"off"`, `"safe"`, `"aggressive"` |
| `bladePhpFormattingTargets` | `string[]` | `["directiveArgs", "echo", "phpBlock", "phpTag"]` | `echo`, `directiveArgs`, `phpBlock`, `phpTag`; use `[]` (or CLI `none`) to disable all |
| `bladeSyntaxPlugins` | `string[]` | `["statamic"]` | plugin names (for example `["statamic"]`) |
| `bladeDirectiveCase` | `choice` | `"preserve"` | `"preserve"`, `"canonical"`, `"lower"` |
| `bladeDirectiveCaseMap` | `string` | `""` | JSON object string, e.g. `{"disk":"Disk"}` |
| `bladeDirectiveArgSpacing` | `choice` | `"space"` | `"preserve"`, `"none"`, `"space"` |
| `bladeDirectiveBlockStyle` | `choice` | `"preserve"` | `"preserve"`, `"inline-if-short"`, `"multiline"` |
| `bladeBlankLinesAroundDirectives` | `choice` | `"preserve"` | `"preserve"`, `"always"` |
| `bladeEchoSpacing` | `choice` | `"preserve"` | `"preserve"`, `"space"`, `"tight"` |
| `bladeSlotClosingTag` | `choice` | `"canonical"` | `"canonical"`, `"preserve"` |
| `bladeInlineIntentElements` | `string[]` | `["p", "svg", "svg:*"]` | elements and namespace wildcards |
| `bladeComponentPrefixes` | `string[]` | `["x", "s", "statamic", "flux", "livewire", "native"]` | component prefixes |
| `bladeInsertOptionalClosingTags` | `boolean` | `false` | `true`, `false` |
| `bladeKeepHeadAndBodyAtRoot` | `boolean` | `true` | `true`, `false` |

`bladePhpFormattingTargets` aliases supported in each array entry:

- `echoes` -> `echo`
- `directive-args`, `directive_args` -> `directiveArgs`
- `php-block`, `php_block` -> `phpBlock`
- `php-tag`, `php_tag` -> `phpTag`

`bladeComponentPrefixes` behavior:

- Bare prefix tokens expand to both Blade component separator forms:
  - `x` -> `x-`, `x:`
  - `widget` -> `widget-`, `widget:`
- Explicit separator tokens are preserved as-is:
  - `x-` matches only dash form tags
  - `x:` matches only colon form tags

`bladeInlineIntentElements` SVG behavior:

- `svg` keeps single-line `<svg>...</svg>` container intent when the source is inline.
- `svg:*` keeps inline attribute and style intent for SVG namespace elements such as `<path>` and `<line>`.
- Remove one or both entries to opt out of those SVG-specific inline layouts.

### `bladeBlankLinesAroundDirectives`

This option controls blank lines between directive branches inside a structured directive block.

Examples of branch separators this option affects:

- `@if ... @else ... @endif`
- `@switch ... @case ... @default ... @endswitch`
- `@section ... @endsection`

Primary scope:

- It decides how much vertical space to print between one branch and the next branch marker.
- In `preserve` mode it can also keep some existing blank lines between structured siblings inside a directive body when those blank lines were already present in source.

That means it can affect spacing before `@else`, `@elseif`, `@endif`, `@case`, `@default`, `@endswitch`, and similar closers/openers inside the same directive block.

Supported values:

- `"preserve"`
  - Keeps an existing blank line between directive branches if one existed in the source.
  - Otherwise prints a single newline between branches.
- `"always"`
  - Always inserts a blank line between directive branches.
  - In practice this means two line breaks between branches.

Example input:

```blade
@if($x)
<p>a</p>
@else
<p>b</p>
@endif
```

With `bladeBlankLinesAroundDirectives: "preserve"`:

```blade
@if ($x)
  <p>a</p>
@else
  <p>b</p>
@endif
```

With `bladeBlankLinesAroundDirectives: "always"`:

```blade
@if ($x)
  <p>a</p>

@else
  <p>b</p>

@endif
```

Notes:

- This option is most visible when directive blocks print in multiline form.
- If a block is kept inline, there are no multiline branch separators for this option to manage.
- In `preserve` mode, some authored blank lines inside a directive body can also survive between structured siblings when the source already had them.

### Relevant Core Prettier Options

This plugin also respects standard Prettier options, including:

- `printWidth`
- `tabWidth`
- `useTabs`
- `singleQuote`
- `singleAttributePerLine`
- `bracketSameLine`
- `endOfLine`
- `htmlWhitespaceSensitivity`

## Example Full Config

```json
{
  "plugins": [
    "prettier-plugin-blade",
    "@prettier/plugin-php",
    "prettier-plugin-tailwindcss"
  ],
  "overrides": [
    {
      "files": ["*.blade.php"],
      "options": {
        "parser": "blade",
        "htmlWhitespaceSensitivity": "css",
        "bladePhpFormatting": "safe",
        "bladePhpFormattingTargets": ["directiveArgs", "echo", "phpBlock", "phpTag"],
        "bladeSyntaxPlugins": ["statamic"],
        "bladeDirectiveCase": "preserve",
        "bladeDirectiveArgSpacing": "space",
        "bladeDirectiveBlockStyle": "preserve",
        "bladeBlankLinesAroundDirectives": "preserve",
        "bladeEchoSpacing": "space",
        "bladeSlotClosingTag": "canonical",
        "bladeInlineIntentElements": ["p", "svg", "svg:*"],
        "bladeComponentPrefixes": ["x", "s", "statamic", "flux", "livewire", "native"],
        "bladeInsertOptionalClosingTags": false,
        "bladeKeepHeadAndBodyAtRoot": true
      }
    }
  ]
}
```

## Troubleshooting

### Tailwind CSS classes are not sorting

- Confirm `prettier-plugin-tailwindcss` is installed.
- Confirm it is listed in `plugins`.
- Confirm class values are static strings (not mixed with Blade interpolation).

### PHP formatting is not running

- Install `@prettier/plugin-php`.
- Set `bladePhpFormatting` to `"safe"`.
- Ensure target is enabled in `bladePhpFormattingTargets`.

### VS Code formats with wrong Prettier

- Use local project dependencies.
- Set `"prettier.requireConfig": true`.
- Set `"prettier.prettierPath"` when needed.
