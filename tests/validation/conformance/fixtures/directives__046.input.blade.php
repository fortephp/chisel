@foreach (collect()->where('foo', 'bar')->where('bar', 'foo') as $item)
<!-- -->
@endforeach