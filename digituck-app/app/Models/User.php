<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['full_name', 'normalized_phone'];

    protected $hidden = ['password_hash', 'auth_version'];

    public function getAuthPasswordName(): string
    {
        return 'password_hash';
    }

    public function getRememberTokenName(): string
    {
        return '';
    }

    protected function casts(): array
    {
        return ['auth_version' => 'integer', 'order_notifications' => 'boolean'];
    }
}
