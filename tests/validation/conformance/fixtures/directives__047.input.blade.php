@forelse (collect($users)->one()->two()->take(3) as $user)
<li>{{ $user->name }}</li>
@empty
<p>No users</p>
@endforelse