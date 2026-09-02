import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

describe("html/issue-186", () => {
  it("aligns a multiline raw echo with its JavaScript property", async () => {
    const input = `@push('js')
    <script type="text/javascript">
        Alpine.data('Form', () =>
            window.AlpineComponents.Form({
                formRequest: {!!
                    \\App\\Http\\Requests\\AdminRequest::extractJson([
                        'method' => 'PUT',
                        'id' => $user->id,
                    ])
                !!},
            })
        );
    </script>
@endpush
`;

    const expected = `@push ('js')
  <script type="text/javascript">
    Alpine.data("Form", () =>
      window.AlpineComponents.Form({
        formRequest: {!!
          \\App\\Http\\Requests\\AdminRequest::extractJson([
              'method' => 'PUT',
              'id' => $user->id,
          ])
        !!},
      }),
    );
  </script>
@endpush
`;

    await formatEqual(input, expected);
  });

  it("indents a multiline bound array beneath its attribute", async () => {
    const input = `<x-select
class="mb-2"
name="search_column"
:options="[
'name' => __('Name'),
'email' => __('Email'),
]"
x-model="params.search_column"
:selected="request()->query('search_column')"
/>
`;

    const expected = `<x-select
  class="mb-2"
  name="search_column"
  :options="[
    'name' => __('Name'),
    'email' => __('Email'),
  ]"
  x-model="params.search_column"
  :selected="request()->query('search_column')"
/>
`;

    await formatEqual(input, expected);
  });
});
