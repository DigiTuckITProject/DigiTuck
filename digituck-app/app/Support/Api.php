<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class Api
{
    public static function fail(int $status, string $code, string $message): never
    {
        throw new ApiException($status, $code, $message);
    }

    public static function found($row)
    {
        if (! $row) {
            self::fail(404, 'NOT_FOUND', 'Resource not found.');
        }

        return $row;
    }

    public static function version($row, int $version): void
    {
        if ((int) $row->version !== $version) {
            self::fail(409, 'STALE_VERSION', 'This record changed. Refresh before trying again.');
        }
    }

    public static function id(): string
    {
        return (string) Str::uuid();
    }

    public static function send($data, int $status = 200)
    {
        return response()->json(['data' => $data, 'meta' => ['requestId' => request()->attributes->get('requestId')]], $status);
    }

    public static function audit(?string $actor, string $action, string $type, string $id, array $metadata = []): void
    {
        DB::table('audit_events')->insert(['id' => self::id(), 'actor_id' => $actor, 'action' => $action, 'entity_type' => $type, 'entity_id' => $id, 'safe_metadata_json' => json_encode($metadata)]);
    }

    public static function page(): array
    {
        $v = request()->validate(['page' => 'sometimes|integer|min:1', 'limit' => 'sometimes|integer|min:1|max:100']);

        return [(int) ($v['page'] ?? 1), (int) ($v['limit'] ?? 20)];
    }

    public static function cents(string $price): int
    {
        [$a,$b] = explode('.', $price);

        return ((int) $a) * 100 + (int) $b;
    }

    public static function money(int $cents): string
    {
        if ($cents < 0 || $cents > 9999999999) {
            self::fail(422, 'TOTAL_TOO_LARGE', 'Reduce the cart total.');
        }

        return intdiv($cents, 100).'.'.str_pad((string) ($cents % 100), 2, '0', STR_PAD_LEFT);
    }
}
