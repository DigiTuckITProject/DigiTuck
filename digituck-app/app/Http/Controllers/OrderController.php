<?php

namespace App\Http\Controllers;

use App\Services\Orders;
use App\Support\Api;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    private function input(Request $r): array
    {
        $v = $r->validate(['shopId' => 'required|uuid', 'items' => 'required|array|min:1|max:50', 'items.*.productId' => 'required|uuid|distinct', 'items.*.quantity' => 'required|integer|between:1,99', 'items.*.expectedUnitPrice' => ['required', 'regex:/^(0|[1-9]\d{0,7})\.\d{2}$/'], 'notes' => 'sometimes|nullable|string|max:500']);

        return ['shopId' => $v['shopId'], 'items' => array_map(fn ($i) => ['productId' => $i['productId'], 'quantity' => (int) $i['quantity'], 'expectedUnitPrice' => $i['expectedUnitPrice']], $v['items']), 'notes' => $v['notes'] ?? ''];
    }

    public function quote(Request $r)
    {
        $v = $this->input($r);

        return Api::send(DB::transaction(fn () => Orders::review($v), 3));
    }

    public function place(Request $r)
    {
        $v = $this->input($r);
        $key = $r->header('Idempotency-Key');
        validator(['key' => $key], ['key' => 'required|uuid'])->validate();

        return Api::send(Orders::place($r->attributes->get('account')->id, $key, $v), 201);
    }

    public function index(Request $r)
    {
        [$p,$l] = Api::page();

        return Api::send(Orders::owned($r->attributes->get('account'))->select(Orders::COLUMNS)->orderByDesc('o.created_at')->orderBy('o.id')->offset(($p - 1) * $l)->limit($l)->get());
    }

    public function detail(Request $r, string $id)
    {
        return Api::send(Orders::detail($r->attributes->get('account'), $id));
    }

    public function transition(Request $r, string $id)
    {
        $v = $r->validate(['expectedVersion' => 'required|integer|min:1', 'status' => 'required|in:ACCEPTED,PREPARING,READY,COLLECTED,REJECTED,CANCELLED', 'reason' => 'sometimes|nullable|string|max:1000']);
        $v['reason'] = $v['reason'] ?? '';
        Orders::transition($r->attributes->get('account'), $id, $v);

        return $this->detail($r, $id);
    }
}
