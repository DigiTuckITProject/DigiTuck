<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if ($this->app->environment('production')) {
            if (! $this->app->runningInConsole() && (! str_starts_with(config('app.url'), 'https://') || config('app.debug'))) {
                throw new \RuntimeException('Production requires HTTPS APP_URL and APP_DEBUG=false.');
            }
            config(['session.driver' => 'database', 'session.secure' => true, 'session.cookie' => '__Host-digituck_session', 'session.domain' => null, 'session.path' => '/']);
        }
        config(['session.table' => 'laravel_sessions', 'session.lifetime' => 30, 'session.http_only' => true, 'session.same_site' => 'lax']);
        if ($path = config('digituck.public_path')) {
            $this->app->usePublicPath($path);
        }
    }
}
