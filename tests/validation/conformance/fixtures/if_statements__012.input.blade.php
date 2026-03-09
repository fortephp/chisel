@something('test') {{ $one }}
    @elsesomething('something else?') 
    {{ $two }} 
    @else
 {{ $three }}
@endsomething