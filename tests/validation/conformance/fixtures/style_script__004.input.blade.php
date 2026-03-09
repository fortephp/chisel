<style>
    :root {
        --foo: red;

        @if (true)
            --bar: blue;
        @endif
    }
</style>

<div>
    <style>
        :root {
            --foo: red;

            @if (true)
                --bar: blue;
            @endif
        }
    </style>
</div>
