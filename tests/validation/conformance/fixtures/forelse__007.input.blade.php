@forelse ($items as $item)
        {{ $item }}
        @empty
        No items
        @endforelse