<input
    type="text"
    name="title"
    value="title"
    @required($user->isAdmin())
/>
