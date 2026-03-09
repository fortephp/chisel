<input
    type="checkbox"
    name="active"
    value="active"
    @checked(old('active', $user->active))
/>
