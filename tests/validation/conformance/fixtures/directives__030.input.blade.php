

               @once
               <li>
               <button
                   type="button"
                   wire:loading.attr="disabled"
               >
                   <x-component::name
                       class="w-4 h-4 text-primary-500"
                       wire:loading.delay
                       wire:target="{{ one }} {{ two }}"
                   />
               </button>
           </li>
               @endonce
