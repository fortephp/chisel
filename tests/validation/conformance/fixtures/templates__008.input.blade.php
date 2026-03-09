@extends('layouts.master')

        @section('title', 'Notification')
        
        @section('content')
        <h1>Notification</h1>
        
        @switch($notification->type)
        @case('message')
        <p>You have a new message from {{ $notification->from }}.</p>
        @break
        
        @case('alert')
        <p>Alert: {{ $notification->message }}</p>
        @break
        
        @case('reminder')
        <p>Reminder: {{ $notification->message }}</p>
        @break
        
        @default
        <p>You have a new notification.</p>
        @endswitch
        @endsection