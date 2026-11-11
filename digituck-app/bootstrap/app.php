<?php

use App\Http\Middleware\ApiSecurity;
use App\Http\Middleware\Role;
use App\Support\Api;
use App\Support\ApiException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias(['role' => Role::class]);
        $middleware->trimStrings(except: ['password', 'currentPassword', 'newPassword']);
        $middleware->web(append: [ApiSecurity::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(fn ($r) => $r->is('api/*'));
        $exceptions->render(function (Throwable $e, Request $r) {
            if (! $r->is('api/*')) {
                return null;
            }
            $status = $e instanceof HttpExceptionInterface ? $e->getStatusCode() : ($e instanceof ValidationException ? 422 : 500);
            $code = $e instanceof ApiException ? $e->apiCode : match ($status) {
                422 => 'VALIDATION_ERROR',419 => 'CSRF_INVALID',404 => 'NOT_FOUND',405 => 'METHOD_NOT_ALLOWED',default => 'SERVER_ERROR'
            };
            $message = $status === 500 ? 'Unable to complete the request. Please try again.' : ($status === 419 ? 'Your session expired. Refresh the page and try again.' : $e->getMessage());

            return response()->json(['error' => ['code' => $code, 'message' => $message, 'fieldErrors' => $e instanceof ValidationException ? $e->errors() : new stdClass, 'requestId' => $r->attributes->get('requestId') ?? Api::id()]], $status)->header('Cache-Control', 'no-store');
        });
    })->create();
