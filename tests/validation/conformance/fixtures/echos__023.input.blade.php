
        <div
            {{
                $attributes
                    ->merge($getExtraAttributes())
            }}
            {{ that="this" }}
            A
            <?php echo $something; ?>
            B
            @php($why->not->that)
            C
            @directive($attributes->merge($getExtraAttributes()))
            D
            {{ $getExtraAlpineAttributeBag() }}
        >
        </div>
    