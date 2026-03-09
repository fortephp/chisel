<div
    class="my-4"
    @unless(config('filament-media-library.settings.show-upload-box-by-default')) x-foo
         x-show="showUploadBox"
         x-collapse
         x-cloak
     @endunless
>
<p>Hello, world!</p>
</div>