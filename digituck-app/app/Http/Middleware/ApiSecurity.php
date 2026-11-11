<?php

namespace App\Http\Middleware;

use App\Support\Api;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ApiSecurity
{
    public function handle(Request $r, Closure $next)
    {
        $r->attributes->set('requestId', Api::id());
        if (! $r->isMethodSafe()) {
            $token = $r->header('X-CSRF-Token');
            if (! is_string($token) || ! hash_equals($r->session()->token(), $token)) {
                Api::fail(419, 'CSRF_INVALID', 'Your session expired. Refresh the page and try again.');
            }
            $origin = $r->header('Origin');
            if (! $origin || ! hash_equals(rtrim(config('app.url'), '/'), $origin)) {
                Api::fail(403, 'ORIGIN_INVALID', 'Refresh the page and try again.');
            }
        }
        if ($id = $r->session()->get('userId')) {
            $u = DB::table('users')->where('id', $id)->first();
            if (! $u || $u->status !== 'ACTIVE' || $u->auth_version !== $r->session()->get('authVersion') || time() - $r->session()->get('startedAt', 0) > 28800) {
                $r->session()->invalidate();
                $r->session()->regenerateToken();
            } else {
                $r->attributes->set('account', $u);
            }
        }
        $response = $next($r);
        $response->headers->set('Cache-Control', 'no-store, private');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('Referrer-Policy', 'same-origin');

        return $response;
    }
}
