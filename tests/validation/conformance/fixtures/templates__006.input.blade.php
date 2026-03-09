@extends('layouts.master')

@section('title', 'Dashboard')

@section('content')
<h1>Dashboard</h1>

@if (Auth::check())
<p>Welcome back, {{ Auth::user()->name }}!</p>

@if (Auth::user()->isAdmin())
<p>You have <a href="">admin</a> privileges.</p>
@else
<p>You are a regular user.</p>
@endif
@else
<p>Please <a href="{{ route('login') }}">log in</a> to continue.</p>
@endif
@endsection