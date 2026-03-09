<x-jet-dropdown-link
    href="{{ route('logout') }}"
    @click.prevent="$root.submit();"
>
    {{ __('Log Out') }}
</x-jet-dropdown-link>