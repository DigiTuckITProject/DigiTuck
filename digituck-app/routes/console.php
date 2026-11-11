<?php

use App\Http\Controllers\AuthController;
use App\Services\Orders;
use App\Support\Api;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;

Artisan::command('orders:expire', function () {
    $this->info('Expired '.Orders::expire().' pending orders.');
});
Schedule::command('orders:expire')->everyMinute()->withoutOverlapping();
Artisan::command('admin:bootstrap', function () {
    $v = ['fullName' => $this->ask('Full name'), 'email' => strtolower(trim($this->ask('Email'))), 'phone' => $this->ask('International phone (+27...)'), 'password' => $this->secret('Password (12+ characters)')];
    validator($v, ['fullName' => 'required|string|min:2|max:120', 'email' => 'required|email|max:254', 'phone' => ['required', 'regex:/^\+[1-9]\d{7,14}$/'], 'password' => AuthController::passwordRules()])->validate();
    DB::transaction(function () use ($v) {
        $id = Api::id();
        DB::table('users')->insert(['id' => $id, 'full_name' => $v['fullName'], 'normalized_email' => $v['email'], 'normalized_phone' => $v['phone'], 'password_hash' => password_hash($v['password'], PASSWORD_BCRYPT, ['cost' => 12]), 'role' => 'ADMIN']);
        Api::audit($id, 'ADMIN_BOOTSTRAPPED', 'user', $id);
    });
    $this->info('Administrator created.');
});
