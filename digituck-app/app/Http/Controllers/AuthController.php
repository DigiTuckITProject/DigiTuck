<?php

namespace App\Http\Controllers;

use App\Support\Api;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;

class AuthController extends Controller
{
    public static function safe($u): array
    {
        return ['id' => $u->id, 'fullName' => $u->full_name, 'email' => $u->normalized_email, 'phone' => $u->normalized_phone, 'role' => $u->role];
    }

    public static function passwordRules(): array
    {
        return ['required', 'string', 'min:12', function ($attribute, $value, $fail) {
            if (is_string($value) && strlen($value) > 72) {
                $fail('Use at most 72 UTF-8 bytes.');
            }
        }];
    }

    private function normalize(Request $r): void
    {
        if (is_string($r->input('email'))) {
            $r->merge(['email' => strtolower(trim($r->input('email')))]);
        } if (is_string($r->input('phone'))) {
            $r->merge(['phone' => preg_replace('/[\s()\-]/', '', trim($r->input('phone')))]);
        }
    }

    private function throttle(Request $r, string $identity): void
    {
        // Atomic database cache counters; separate account and network buckets.
        foreach (['account:'.$identity => 5, 'ip:'.$r->ip() => 40] as $key => $max) {
            $key = 'auth:'.hash_hmac('sha256', $key, config('app.key'));
            if (RateLimiter::tooManyAttempts($key, $max)) {
                Api::fail(429, 'RATE_LIMITED', 'Too many attempts. Please try again in 15 minutes.');
            }
            if (RateLimiter::hit($key, 900) > $max) {
                Api::fail(429, 'RATE_LIMITED', 'Too many attempts. Please try again in 15 minutes.');
            }
        }
    }

    private function establish(Request $r, $u): void
    {
        $r->session()->invalidate();
        $r->session()->put(['userId' => $u->id, 'authVersion' => $u->auth_version, 'startedAt' => time()]);
        $r->session()->regenerateToken();
    }

    public function csrf(Request $r)
    {
        return Api::send(['csrfToken' => $r->session()->token()]);
    }

    public function me(Request $r)
    {
        return Api::send(self::safe($r->attributes->get('account')));
    }

    public function register(Request $r)
    {
        $this->normalize($r);
        $v = $r->validate(['fullName' => 'required|string|min:2|max:120', 'email' => 'required|email:rfc|max:254', 'phone' => ['required', 'regex:/^\+[1-9]\d{7,14}$/'], 'password' => self::passwordRules(), 'role' => 'required|in:CUSTOMER,VENDOR']);
        $this->throttle($r, 'register:'.$v['email']);
        try {
            $u = DB::transaction(function () use ($v) {
                $id = Api::id();
                DB::table('users')->insert(['id' => $id, 'full_name' => trim($v['fullName']), 'normalized_email' => $v['email'], 'normalized_phone' => $v['phone'], 'password_hash' => password_hash($v['password'], PASSWORD_BCRYPT, ['cost' => 12]), 'role' => $v['role']]);
                Api::audit($id, 'ACCOUNT_REGISTERED', 'user', $id);

                return DB::table('users')->where('id', $id)->first();
            });
        } catch (QueryException $e) {
            if (($e->errorInfo[1] ?? 0) === 1062) {
                Api::fail(409, 'ACCOUNT_CONFLICT', 'Unable to register with these details. Try signing in or use different details.');
            } throw $e;
        }
        $this->establish($r, $u);

        return Api::send(self::safe($u), 201);
    }

    public function login(Request $r)
    {
        $this->normalize($r);
        $v = $r->validate(['email' => 'required|email:rfc|max:254', 'password' => 'required|string|max:1024']);
        $this->throttle($r, $v['email']);
        $u = DB::table('users')->where('normalized_email', $v['email'])->first();
        $hash = $u?->password_hash ?? '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.';
        $valid = password_verify($v['password'], $hash);
        if (! $valid || ! $u || $u->status !== 'ACTIVE') {
            Api::fail(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
        }
        if (password_needs_rehash($hash, PASSWORD_BCRYPT, ['cost' => 12])) {
            DB::table('users')->where('id', $u->id)->where('password_hash', $hash)->update(['password_hash' => password_hash($v['password'], PASSWORD_BCRYPT, ['cost' => 12])]);
        }
        RateLimiter::clear('auth:'.hash_hmac('sha256', 'account:'.$v['email'], config('app.key')));
        $this->establish($r, $u);

        return Api::send(self::safe($u));
    }

    public function logout(Request $r)
    {
        $r->session()->invalidate();
        $r->session()->regenerateToken();

        return response()->noContent();
    }

    public function account(Request $r)
    {
        $this->normalize($r);
        $v = $r->validate(['fullName' => 'required|string|min:2|max:120', 'phone' => ['required', 'regex:/^\+[1-9]\d{7,14}$/']]);
        $u = $r->attributes->get('account');
        try {
            DB::transaction(function () use ($u, $v) {
                $shop = DB::table('shops')->where('owner_id', $u->id)->lockForUpdate()->first();
                $account = DB::table('users')->where('id', $u->id)->lockForUpdate()->first();
                if (! $account || $account->status !== 'ACTIVE') {
                    Api::fail(403, 'FORBIDDEN', 'Account is not active.');
                }
                if ($shop && $account->full_name !== trim($v['fullName'])) {
                    $application = DB::table('vendor_applications')->where('shop_id', $shop->id)->where('submission_version', $shop->review_version)->first();
                    if ($application->submitted_at) {
                        (new VendorController)->draft($shop, VendorController::profile($shop));
                    }
                    DB::table('shops')->where('id', $shop->id)->increment('version');
                }
                DB::table('users')->where('id', $u->id)->update(['full_name' => trim($v['fullName']), 'normalized_phone' => $v['phone']]);
                Api::audit($u->id, 'ACCOUNT_UPDATED', 'user', $u->id);
            }, 3);
        } catch (QueryException $e) {
            if (($e->errorInfo[1] ?? 0) === 1062) {
                Api::fail(409, 'ACCOUNT_CONFLICT', 'Unable to use these account details.');
            } throw $e;
        }

        return Api::send(self::safe(DB::table('users')->where('id', $u->id)->first()));
    }

    public function password(Request $r)
    {
        $v = $r->validate(['currentPassword' => 'required|string|max:1024', 'newPassword' => self::passwordRules()]);
        $u = $r->attributes->get('account');
        $this->throttle($r, 'password:'.$u->id);
        DB::transaction(function () use ($u, $v) {
            $row = DB::table('users')->where('id', $u->id)->lockForUpdate()->first();
            if (! password_verify($v['currentPassword'], $row->password_hash)) {
                Api::fail(422, 'INVALID_PASSWORD', 'Current password is incorrect.');
            } DB::table('users')->where('id', $u->id)->update(['password_hash' => password_hash($v['newPassword'], PASSWORD_BCRYPT, ['cost' => 12]), 'auth_version' => $row->auth_version + 1]);
            Api::audit($u->id, 'PASSWORD_CHANGED', 'user', $u->id);
        });

        return $this->logout($r);
    }

    public function preferences(Request $r)
    {
        $u = $r->attributes->get('account');
        if ($r->isMethod('PATCH')) {
            $v = $r->validate(['orderNotifications' => 'required|boolean']);
            DB::table('users')->where('id', $u->id)->update(['order_notifications' => $v['orderNotifications']]);
        }

        return Api::send(['orderNotifications' => (bool) DB::table('users')->where('id', $u->id)->value('order_notifications')]);
    }
}
