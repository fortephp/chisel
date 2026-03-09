
<div><div>
<div
    @click="if($wire.loginRequired){return}; isLiked = !isLiked; showUsers=false"
    wire:click="handle('{{ $key }}', '{{ $value["model"] }}')"
    @if ($authMode)
        @mouseover="
              if(
                  !$wire.loginRequired &&
                  $wire.reactions['{{ $key }}']['count'] > 0 &&
                   !showUsers
               ) {
                      showUsers = true;
                      $wire.lastReactedUser('{{ $key }}')
                  }
              "
    @endif
    class="flex cursor-pointer items-center"
    title="like"
>
</div>
</div>
</div>
    