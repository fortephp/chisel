                  <div><div><div>  <x-something::component-name.here :action="$hintAction" :color="$hintColor" :icon="$hintIcon">
        {{ filled($hint) ? ($hint instanceof \Illuminate\Support\HtmlString ? $hint : \Illuminate\Support\Str::of($hint)->markdown()->sanitizeHtml()->toHtmlString()) : null }}
        </x-something::component-name.here></div></div></div>