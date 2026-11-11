<?php

use App\Http\Controllers\AdminController as Admin;
use App\Http\Controllers\AuthController as Auth;
use App\Http\Controllers\CatalogueController as Catalogue;
use App\Http\Controllers\OrderController as Orders;
use App\Http\Controllers\VendorController as Vendor;
use App\Support\Api;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

Route::prefix('api/v1')->group(function () {
    Route::get('health/live', fn () => Api::send(['status' => 'ok', 'service' => 'digituck-api']));
    Route::get('health/ready', function () {
        DB::table('users')->limit(1)->count();
        DB::table('laravel_sessions')->limit(1)->count();

        return Api::send(['status' => 'ready', 'service' => 'digituck-api']);
    });
    Route::get('auth/csrf', [Auth::class, 'csrf']);
    Route::post('auth/register', [Auth::class, 'register']);
    Route::post('auth/login', [Auth::class, 'login']);
    Route::post('auth/logout', [Auth::class, 'logout']);
    Route::get('shops', [Catalogue::class, 'shops']);
    Route::get('shops/{slug}', [Catalogue::class, 'shop']);
    Route::get('categories', [Catalogue::class, 'categories']);
    Route::get('products/{id}/image', [Catalogue::class, 'image'])->whereUuid('id');
    Route::middleware('role')->group(function () {
        Route::get('auth/me', [Auth::class, 'me']);
        Route::patch('account', [Auth::class, 'account']);
        Route::post('account/password', [Auth::class, 'password']);
        Route::match(['GET', 'PATCH'], 'account/preferences', [Auth::class, 'preferences']);
    });
    Route::middleware('role:CUSTOMER')->group(function () {
        Route::post('checkout/quote', [Orders::class, 'quote']);
        Route::post('orders', [Orders::class, 'place']);
    });
    foreach (['orders' => 'CUSTOMER', 'vendor/orders' => 'VENDOR'] as $prefix => $role) {
        Route::prefix($prefix)->middleware('role:'.$role)->group(function () {
            Route::get('/', [Orders::class, 'index']);
            Route::get('{id}', [Orders::class, 'detail'])->whereUuid('id');
            Route::post('{id}/transitions', [Orders::class, 'transition'])->whereUuid('id');
        });
    }
    Route::prefix('vendor')->middleware('role:VENDOR')->group(function () {
        Route::get('dashboard', [Catalogue::class, 'dashboard']);
        Route::get('products', [Catalogue::class, 'products']);
        Route::post('products', [Catalogue::class, 'create']);
        Route::match(['PATCH', 'DELETE'], 'products/{id}', [Catalogue::class, 'change'])->whereUuid('id');
        Route::post('products/{id}/stock', [Catalogue::class, 'change'])->whereUuid('id');
        Route::post('products/{id}/image', [Catalogue::class, 'uploadImage'])->whereUuid('id');
        Route::get('shop', [Vendor::class, 'view']);
        Route::put('shop', [Vendor::class, 'save']);
        Route::post('shop/revise', [Vendor::class, 'revise']);
        Route::post('shop/submit', [Vendor::class, 'submit']);
        Route::post('documents', [Vendor::class, 'upload']);
        Route::delete('documents/{id}', [Vendor::class, 'remove'])->whereUuid('id');
        Route::get('documents/{id}/download', [Vendor::class, 'download'])->whereUuid('id');
    });
    Route::prefix('admin')->middleware('role:ADMIN')->group(function () {
        Route::get('vendors', [Admin::class, 'vendors']);
        Route::get('vendors/{id}', [Admin::class, 'review'])->whereUuid('id');
        Route::post('vendors/{id}/decision', [Admin::class, 'decide'])->whereUuid('id');
        Route::get('documents/{id}/download', [Vendor::class, 'download'])->whereUuid('id');
        Route::get('users', [Admin::class, 'users']);
        Route::patch('users/{id}/status', [Admin::class, 'status'])->whereUuid('id');
        Route::get('audit', [Admin::class, 'audit']);
    });
});
Route::any('api/{path}', fn () => Api::fail(404, 'NOT_FOUND', 'API endpoint not found.'))->where('path', '.*');
Route::get('{path?}', function () {
    $path = public_path('index.html');
    abort_unless(is_file($path), 503, 'Build the React frontend first.');

    return response()->file($path, ['Cache-Control' => 'no-cache', 'X-Content-Type-Options' => 'nosniff', 'X-Frame-Options' => 'DENY', 'Content-Security-Policy' => "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; font-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"]);
})->where('path', '.*');
