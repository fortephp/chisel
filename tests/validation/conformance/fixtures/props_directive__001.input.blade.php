
            @props(['hello', 'world'])
            
            <div>
            <div>
            @props(['hello', 'world', 'test' => [1,2,3,4,5, 'more' => ['hello', 'world', 'test' => [1,2,3,4,5]]]])
                                                                        </div>
                                            </div>
            
            <div>
            <p>Hello {{ $world }}!  </p>
                </div>