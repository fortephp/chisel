@extends('layouts.master')

@section('title', 'Product Categories')

@section('content')
<h1>Product Categories</h1>

@foreach ($categories as $category)
<h2>{{ $category->name }}</h2>

@if ($category->products->isEmpty())
<p>No products in this category.</p>
@else
<ul>
@foreach ($category->products as $product)
<li>{{ $product->name }} - ${{ $product->price }}</li>
@endforeach
</ul>
@endif
@endforeach
@endsection