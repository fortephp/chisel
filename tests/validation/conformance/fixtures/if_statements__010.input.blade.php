<div>
        @if (count($tenants = filament()->getUserTenants(filament()->auth()->user()))
        )
        @endif
        </div>