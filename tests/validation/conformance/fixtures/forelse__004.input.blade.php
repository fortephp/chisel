<div>
        @forelse ($users as $user)
<li>{{ $user->name }}</li>
@endforelse
            </div>



        @forelse ($users as $user)
    <li>{{ $user->name }}
    </li>
@endforelse