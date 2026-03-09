<div>
@if ($data['nextInspection'])
    <div
        class="text-gray inline-flex items-baseline text-base font-semibold"
    >
        @if ($data['nextInspection']->isToday())
                    Your inspection is today!
        @else
            <span class="mr-2 text-xs font-medium text-gray-700">
                {{ $data['nextInspection']->diffForhumans() }}
            </span>
            <span class="text-base font-semibold text-gray-900">
                {{ $data['nextInspection']->format('d.m.Y') }}
            </span>
        @endif
    </div>
@endif
</div>