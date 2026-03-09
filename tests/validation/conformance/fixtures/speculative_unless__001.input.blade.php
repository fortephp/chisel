@unlessdisk ('local1')
            <!-- The application is not using the local disk1... -->
            @unlessdisk ('local2')
                <!-- The application is not using the local disk2... -->
                @unlessdisk ('local3')
                <!-- The application is not using the local disk3... -->
                @unlessdisk ('local4')
                <div>
                <p>Hello   {{ $world }}</p>
            </div>
            @enddisk
            @enddisk
            @enddisk
            @enddisk