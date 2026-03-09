{{-- format-ignore-start --}}

<x:slot:name

            param="value">
   <p>Content</p>
            </x:slot:name>

<p>{{ $one }}: {{ $two }}</p>
<p>
{{ $one  }}:
{{ $two }}
</p>
{{-- 
                                                                            Just 
                                                a comment --}}
@if         ($true)
            <span>Hello</span>
            @elseif                     ($anotherValue)
            <div>
                <p>Hello world</p>
                <div>
                @pair
                    Test
                    @directive   ($test  + $that-$another   + $thing)
            @endpair
                </div>
                </div>
            @else
            
            <p>Test {{ $title}}     test
                    </p>
            
            @endif

            @switch($i)
            @case(1)
                First case...
                @break
            @case(2)
                Second case...
                @break
            @default



                Default case...
            @endswitch

            @unless($true)

            @endunless
            
            @directive   ($test  + $that-$another   + $thing)
            @unless($true) 
                Hello @endunless
            
            @unless($true)
                                    <p>World
                                    
                                    </p>
            
            
                                    <x-icon 
                                    @class([$icon, 'pe-2'])
                                                >
                        <div>
                        <p>test</p>
                        </div>
                                            </x-icon>
            
            
                                    
            @endunless

            <div>
            @forelse ($users as $user)
                <li>{{ $user->name }}</li>
                                                                    @endforelse
                                                                </div>
                                                                
                                                                @forelse ($users as $user)
                                                                    <li>{{ $user->name }}</li>
                                                                @endforelse
                                                                <?php

                                                                $kernel = $app->                make(Illuminate\Contracts\Console\Kernel::class);
                                                                
                                                                $status =           $kernel->
                                                                
                                                                                        handle(
                                                                                                    $input = new Symfony\Component\Console\Input\ArgvInput,
                                                                                                    new Symfony\Component\Console\Output\ConsoleOutput
                                                                );
                                                                
                                                                ?>
{{-- format-ignore-end --}}

<x-slot:name param="value">
    <p>Content</p>
</x-slot>

<p>{{ $one }}: {{ $two }}</p>
<p>
    {{ $one }}:
    {{ $two }}
</p>
{{--
    Just
    a comment
--}}
@if ($true)
    <span>Hello</span>
@elseif ($anotherValue)
    <div>
        <p>Hello world</p>
        <div>
            @pair
                Test
                @directive($test + $that - $another + $thing)
            @endpair
        </div>
    </div>
@else
    <p>Test {{ $title }} test</p>
@endif

@switch($i)
    @case(1)
        First case...

        @break
    @case(2)
        Second case...

        @break
    @default
        Default case...
@endswitch

@unless ($true)
    
@endunless

@directive($test + $that - $another + $thing)
@unless ($true)
    Hello
@endunless

@unless ($true)
    <p>World</p>

    <x-icon @class([$icon, "pe-2"])>
        <div>
            <p>test</p>
        </div>
    </x-icon>
@endunless

<div>
    @forelse ($users as $user)
        <li>{{ $user->name }}</li>
    @endforelse
</div>

@forelse ($users as $user)
    <li>{{ $user->name }}</li>
@endforelse

<?php

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$status = $kernel->handle(
    $input = new Symfony\Component\Console\Input\ArgvInput(),
    new Symfony\Component\Console\Output\ConsoleOutput(),
);

?>
