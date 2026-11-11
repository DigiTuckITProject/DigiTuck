<?php

namespace App\Http\Middleware;

use App\Support\Api;
use Closure;
use Illuminate\Http\Request;

class Role
{
    public function handle(Request $r, Closure $next, ?string $role = null)
    {
        $u = $r->attributes->get('account');
        if (! $u) {
            Api::fail(401, 'UNAUTHENTICATED', 'Please sign in to continue.');
        }
        if ($role && $role !== $u->role) {
            Api::fail(403, 'FORBIDDEN', 'This action is not available for your account.');
        }

        return $next($r);
    }
}
