
@switch($i)
{{-- Leading node test. --}}

<p>Test {{ $title}} 
</p>
@case(1)
First case...
@break
@case(2)
Second case...
@break
@default



Default case...
@endswitch