@switch($i)
            {{-- Leading node test. --}}
            
            <p>Test {{ $title}} 
            </p>
            @case(1) <p>First case...</p> @break
            @case(2) <p>Second case...</p>
            @break @default 
            
            
            <p>Default case...</p>
            @endswitch