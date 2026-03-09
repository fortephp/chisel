<div
    {{
        $attributes->class([
            "some classes",
            match ($someCondition) {
                true => "more classes foo bar baz",
                default => "even more classes foo bar baz",
            },
        ])
    }}
></div>
