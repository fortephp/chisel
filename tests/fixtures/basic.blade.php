<div class="container">
    <h1>{{ $title }}</h1>

    @if($user)
        <p>Welcome, {{ $user->name }}!</p>
    @else
        <p>Please log in.</p>
    @endif

    @foreach($items as $item)
        <x-card :title="$item->name">
            {{ $item->description }}
        </x-card>
    @endforeach

    {{-- This section is commented out --}}
</div>
