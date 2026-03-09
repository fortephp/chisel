@if($domains->isNotEmpty() || $customDomains->isNotEmpty())
    <option @if($selectedDomain === $value) selected="selected" @endif>{{ $label }}</option>
@endif