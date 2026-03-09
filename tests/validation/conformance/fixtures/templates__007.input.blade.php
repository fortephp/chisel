@extends('layouts.master')

        @section('title', 'Dashboard')
        
        @section('content')
        <h1>Dashboard</h1>
        
        @if(Auth::check())
        
        @if (Auth::user()->isAdmin())
        @else
        @endif
        @else
                                                @endif
        @endsection