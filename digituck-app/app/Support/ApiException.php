<?php

namespace App\Support;

use Symfony\Component\HttpKernel\Exception\HttpException;

class ApiException extends HttpException
{
    public function __construct(int $status, public string $apiCode, string $message)
    {
        parent::__construct($status, $message);
    }
}
