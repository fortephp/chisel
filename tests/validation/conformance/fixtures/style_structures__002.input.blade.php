<html>

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
        
                <script></script>
            </body>
        </html>