<html>
            @directive($test)
            
                    @enddirective
            
                <style>
                                            
                                .thing {
                                    background-color: @foreach ($something as $somethingElse)
                                        {{ $thing}}
                                    @endforeach
                                }
                
                                </style>
            
                <style></style>
                <body>
            
            @if ($true)
                <style>
                            
            
            
            
            .thing {
                background-color: @foreach ($something as $somethingElse)
                    {{ $thing}}
                @endforeach
            }
            
                </style>
            
            @endif
            
                    <script>
            
            var app = '@if ($something) something @else something-else @endif'.trim();
            
            if (something) {
              // Do something.
            } else {
              // Do something else.
            }
                    
                    </script>
            
                    <script></script>
                </body>
            </html>