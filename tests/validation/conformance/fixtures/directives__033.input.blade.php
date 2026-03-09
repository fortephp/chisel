@class([
            'text-sm font-medium leading-4',
            'text-gray-700' => !$error,
            'dark:text-gray-300' => !$error && config('forms.dark_mode'),
            'text-danger-700' => $error,
            'dark:text-danger-400' => $error && config('forms.dark_mode'),
        ])