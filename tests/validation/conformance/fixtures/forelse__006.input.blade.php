<div>
        @forelse ($users as       ++++$           $user)
<li>{{ $user->name }}</li>
@empty
<p>No users</p>
@endforelse
            </div>