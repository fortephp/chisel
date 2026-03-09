{{-- foo.blade.php --}}

@props([
"model",
])

@can('update', $model)
update
@else
any
@endcan