# Blade Prettier Plugin

This package provides a Prettier plugin that can parse and format Laravel Blade template files.

If you'd like to view the source, report issues, etc. you can do so on the formatter's repository on GitHub:

[https://github.com/stillat/blade-parser-typescript](https://github.com/stillat/blade-parser-typescript)

For additional documentation, consider checking out the following resources:

* [Prettier Plugin Installation](https://stillat.com/blade-parser/v1/installing-prettier-plugin)
* [Formatter Configuration and Usage](https://stillat.com/blade-parser/v1/formatting-configuration)
* [Using Laravel Pint to Format PHP Inside Blade](https://stillat.com/blade-parser/v1/formatting-configuration#content-configuring-laravel-pint)

If you've found this project and want to help keep my lights on, you can do so here: [https://github.com/sponsors/JohnathonKoster](https://github.com/sponsors/JohnathonKoster).

## Installation

The Blade Prettier Plugin can be installed with `npm` using the following command:

```bash
npm install prettier-plugin-blade@^2
```

After installing, add the following to your `.prettierrc` file:

```json
{
    "plugins": [
        "prettier-plugin-blade"
    ],
    "overrides": [
        {
            "files": [
                "*.blade.php"
            ],
            "options": {
                "parser": "blade"
            }
        }
    ]
}
```

> Note: If you are looking to install for Prettier 2, make sure to use version 1 of `prettier-plugin-blade`.

## Working with Other Plugins, such as the Prettier Plugin for Tailwind CSS

The Blade formatter does not ship with third-party plugins, like the [Prettier Plugin for Tailwind CSS](https://github.com/tailwindlabs/prettier-plugin-tailwindcss).

> Technically the formatter does ship with built-in JSON and PHP formatters, but these are to handle some internal formatting under special circumstances, and are not applied to your entire template.

You are free to install and configure whichever versions of these plugins you would like. However, if you are unable to get them to work in conjunction with the Blade formatter, you can update the `.prettierrc` file and include them in the plugins list.

### Prettier 3 Example

For example, if we had installed the `prettier-plugin-tailwindcss` plugin, we could update our `.prettierrc` file like so:

```json
{
    "tailwindConfig": "path/to/tailwind.config.js",
    "plugins": [
        "prettier-plugin-blade",
        "prettier-plugin-tailwindcss"
    ],
    "overrides": [
        {
            "files": [
                "*.blade.php"
            ],
            "options": {
                "parser": "blade"
            }
        }
    ]
}
```

### VS Code Prettier Troubleshooting

Suppose you are using the Prettier VS Code extension and are encountering an error stating something similar to "There are no formatters for Blade files." In that case, you may need to update your VS Code configuration and inform Prettier about the Blade file extension.

The simplest way to do this is to update your user JSON configuration file and ensure it has the following settings:

```json
{
  "[blade]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "prettier.documentSelectors": [
      "**/*.blade.php"
  ]
}
```

> **Important**: You will still need to create and configure the `.prettierrc` file!

For more information about Prettier's document selectors, please consult their documentation here: [https://github.com/prettier/prettier-vscode?tab=readme-ov-file#prettierdocumentselectors](https://github.com/prettier/prettier-vscode?tab=readme-ov-file#prettierdocumentselectors)

### Prettier 2 Example

For example, if we had installed the `prettier-plugin-tailwindcss` plugin, we could update our `.prettierrc` file like so:

```json
{
    "tailwindConfig": "path/to/tailwind.config.js",
    "plugins": [
        "./node_modules/prettier-plugin-blade/",
        "./node_modules/prettier-plugin-tailwindcss/"
    ],
    "overrides": [
        {
            "files": [
                "*.blade.php"
            ],
            "options": {
                "parser": "blade"
            }
        }
    ]
}
```

> Note: If you are using VS Code you may have to restart the editor after installing/changing Prettier plugins for them to take effect.

### Which Plugins are Compatible?

The Blade formatter will utilize Prettier's HTML parser when formatting your Blade document. Your Prettier plugin configuration is passed along to the Blade formatter and will be used when formatting your Blade document - you do not need to wait for it to be supported by the formatting library.

When the Blade formatter invokes Prettier's HTML formatter, the PHP and Blade code will be safely removed from the document to prevent the Blade and PHP content from being mangled by other front-end plugins with similar syntax. Once the layout of the template has been established by the HTML formatter using your project's configuration, the layout engine will start assembling the Blade and PHP content (utilizing the built-in PHP formatter or Laravel Pint, if configured).

## Prettier 2 Configuration: Could Not Resolve Module

If you continuously receive errors like "could not resolve module prettier-plugin-blade", the following updates to a project's `.prettierrc` have proved successful:

```json
{
    "plugins": [
      "./node_modules/prettier-plugin-blade/"
    ],
    "overrides": [
      {
        "files": "*.blade.php",
        "vscodeLanguageIds": ["blade"],
        "options": {
          "parser": "blade"
        }
      }
    ]
}
```

## Formatting Conditional Element Open/Close Tags

Because of the way formatter works internally, you will need to take a few steps if you need to format templates containing Blade code similar to the following:

```blade
@if ($someCondition)
    <x-slot:the_slot>
@endif

    <!-- More content here. -->

@if ($someCondition)
    </x-slot>
@endif
```

The above template will result in a Prettier error stating it encountered an unexpected closing tag. This can be resolved by wrapping the fragmented open/close tags with ignore comments:

```blade
@if ($someCondition)
    {{-- format-ignore-start --}}<x-slot:the_slot>{{-- format-ignore-end --}}
@endif

    <!-- More content here. -->

@if ($someCondition)
    {{-- format-ignore-start --}}</x-slot>{{-- format-ignore-end --}}
@endif
```

## Reporting Issues

If you come across an issue, or have a suggestion to improve the Blade formatter, feel free to create an issue on the project's GitHub repository here:

[https://github.com/stillat/blade-parser-typescript](https://github.com/stillat/blade-parser-typescript)

If you are looking to report a security vulnerability, please **do not** create an issue on the GitHub repository.

To report sensitive issues or a security vulnerability please email [security@stillat.com](mailto:security@stillat.com) with the relevant details.

Emails requesting information on bounties, etc. will not be responded to.

## License

This formatter utility is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
