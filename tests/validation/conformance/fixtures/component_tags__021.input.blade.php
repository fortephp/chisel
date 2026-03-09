<x-filament::avatar
        :src="filament()->getTenantAvatarUrl($tenant)"
        {{ $attributes }}
        />