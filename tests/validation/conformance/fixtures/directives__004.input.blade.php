@Foreach($filters as $item)
  <li class="list-unstyled">
    <a href="{{ $item->link }}" class="{{ $item->active ? 'fw-bold text-primary' : '' }}">
                    {{ $item->name }}
    </a>
  </li>
@endforeach