

@if (true)
{{ 'foo' }}
{{ 'bar' }}
@else
{{ 'bar' }}
{{ 'baz' }}
@endif


@if (true)
{{ 'foo' }} {{ 'bar' }}
@else
{{ 'bar' }} {{ 'baz' }}
@endif

@if (true)
{{ 'foo' }} {{ 'bar' }}
@endif

@if (true)
{{ 'foo' }} {{ 'bar' }}
@else
A
@endif

@if (true)
A
@endif
