<x-icon


            :class="Arr::toCssClasses(['...'])" 
            
            
            
            
            />

@props(

       [           'icon'
       
       
       
                   ]
       
       
       )

<div>
<x-icon                      @class([$icon,              'pe-2'] )
                                   />
           {{ $slot }}



           
       </div>