<?php

namespace App\Services;

use App\Support\Api;
use Illuminate\Support\Facades\DB;

class Orders
{
    public static function review(array $input): array
    {
        $s = DB::table('shops')->where('id', $input['shopId'])->lockForUpdate()->first();
        if (! $s || $s->approval_status !== 'APPROVED' || $s->suspended_at) {
            Api::fail(409, 'SHOP_UNAVAILABLE', 'This shop is not accepting orders.');
        }
        $local = now()->setTimezone($s->timezone);
        $open = false;
        foreach (json_decode($s->hours_json, true) as $h) {
            if ($h['day'] === $local->dayOfWeek && $h['open'] <= $local->format('H:i') && $local->format('H:i') < $h['close']) {
                $open = true;
            }
        }
        if ($s->is_paused || ! $open || ! DB::table('users')->where('id', $s->owner_id)->where('status', 'ACTIVE')->exists()) {
            Api::fail(409, 'SHOP_UNAVAILABLE', 'This shop is paused or closed. Please try during its opening hours.');
        }
        $rows = DB::table('products')->where('shop_id', $s->id)->whereIn('id', array_column($input['items'], 'productId'))->orderBy('id')->lockForUpdate()->get()->keyBy('id');
        $categories = DB::table('categories')->where('is_active', true)->pluck('id')->all();
        $items = [];
        $cents = 0;
        $can = true;
        foreach ($input['items'] as $line) {
            $p = $rows->get($line['productId']);
            $available = $p && ! $p->archived_at && ! $p->moderation_hidden_at && $p->is_visible && in_array($p->category_id, $categories, true);
            $price = $p?->price ?? $line['expectedUnitPrice'];
            $qty = $available ? $p->available_qty : 0;
            $cents += Api::cents($price) * $line['quantity'];
            $can = $can && $available && $qty >= $line['quantity'];
            $items[] = ['productId' => $line['productId'], 'name' => $p?->name ?? 'Unavailable product', 'quantity' => $line['quantity'], 'price' => $price, 'previousPrice' => $line['expectedUnitPrice'], 'available' => $qty, 'availableForSale' => (bool) $available];
        }

        return ['shopName' => $s->name, 'address' => $s->address, 'items' => $items, 'total' => Api::money($cents), 'canOrder' => $can];
    }

    public static function place(string $customer, string $key, array $input): array
    {
        usort($input['items'], fn ($a, $b) => strcmp($a['productId'], $b['productId']));
        // Match the previous JavaScript canonical encoding, including Unicode notes.
        $hash = hash('sha256', json_encode($input, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_LINE_TERMINATORS));

        return DB::transaction(function () use ($customer, $key, $input, $hash) {
            $identity = ['user_id' => $customer, 'operation' => 'checkout', 'request_key' => $key];
            DB::table('idempotency_requests')->insertOrIgnore(['id' => Api::id(), ...$identity, 'request_hash' => $hash]);
            $saved = DB::table('idempotency_requests')->where($identity)->lockForUpdate()->first();
            if ($saved->request_hash !== $hash) {
                Api::fail(409, 'IDEMPOTENCY_CONFLICT', 'This checkout key was already used for a different cart.');
            } if ($saved->response_json) {
                return json_decode($saved->response_json, true);
            }
            $checked = self::review($input);
            if (! DB::table('users')->where('id', $customer)->where('role', 'CUSTOMER')->where('status', 'ACTIVE')->sharedLock()->first()) {
                Api::fail(403, 'CUSTOMER_REQUIRED', 'Sign in with an active customer account.');
            }
            if (! $checked['canOrder'] || collect($checked['items'])->contains(fn ($i) => $i['price'] !== $i['previousPrice'])) {
                Api::fail(409, 'CART_CHANGED', 'Prices or stock changed. Review the latest cart before placing your order.');
            }
            $result = ['id' => Api::id(), 'reference' => 'DT-'.strtoupper(bin2hex(random_bytes(8)))];
            DB::table('orders')->insert([...$result, 'customer_id' => $customer, 'shop_id' => $input['shopId'], 'total_amount' => $checked['total'], 'notes' => $input['notes'], 'shop_name_snapshot' => $checked['shopName'], 'pickup_address_snapshot' => $checked['address'], 'expires_at' => now()->addMinutes(15)]);
            foreach ($checked['items'] as $i) {
                DB::table('order_items')->insert(['id' => Api::id(), 'order_id' => $result['id'], 'product_id' => $i['productId'], 'shop_id' => $input['shopId'], 'name_snapshot' => $i['name'], 'unit_price' => $i['price'], 'quantity' => $i['quantity'], 'line_total' => Api::money(Api::cents($i['price']) * $i['quantity'])]);
                $changed = DB::table('products')->where('id', $i['productId'])->where('available_qty', '>=', $i['quantity'])->update(['available_qty' => DB::raw('available_qty - '.(int) $i['quantity']), 'version' => DB::raw('version + 1')]);
                if ($changed !== 1) {
                    Api::fail(409, 'CART_CHANGED', 'Stock changed. Review your cart.');
                } DB::table('inventory_movements')->insert(['id' => Api::id(), 'product_id' => $i['productId'], 'order_id' => $result['id'], 'actor_id' => $customer, 'type' => 'RESERVE', 'quantity_delta' => -$i['quantity'], 'available_after' => $i['available'] - $i['quantity'], 'reason' => 'Pickup order placed']);
            }
            DB::table('order_events')->insert(['id' => Api::id(), 'order_id' => $result['id'], 'actor_id' => $customer, 'to_status' => 'PENDING']);
            DB::table('idempotency_requests')->where($identity)->update(['resource_id' => $result['id'], 'response_status' => 201, 'response_json' => json_encode($result)]);

            return $result;
        }, 3);
    }

    public static function owned($u)
    {
        $q = DB::table('orders as o')->join('shops as s', 's.id', '=', 'o.shop_id')->join('users as u', 'u.id', '=', 'o.customer_id');

        return $u->role === 'VENDOR' ? $q->where('s.owner_id', $u->id) : $q->where('o.customer_id', $u->id);
    }

    public const COLUMNS = ['o.id', 'o.reference', 'o.status', 'o.total_amount', 'o.shop_name_snapshot', 'o.pickup_address_snapshot', 'o.created_at', 'o.expires_at', 'o.version', 'u.full_name as customerName'];

    public static function detail($u, string $id)
    {
        $o = Api::found(self::owned($u)->where('o.id', $id)->select([...self::COLUMNS, 'o.notes'])->first());
        $o->items = DB::table('order_items')->where('order_id', $id)->select('id', 'name_snapshot', 'unit_price', 'quantity', 'line_total')->orderBy('id')->get();

        return $o;
    }

    private static function state($order, string $status, ?string $actor, string $reason): void
    {
        if (in_array($status, ['CANCELLED', 'REJECTED', 'EXPIRED'], true)) {
            foreach (DB::table('order_items')->where('order_id', $order->id)->orderBy('product_id')->get() as $item) {
                $p = DB::table('products')->where('id', $item->product_id)->lockForUpdate()->first();
                $after = $p->available_qty + $item->quantity;
                DB::table('products')->where('id', $p->id)->update(['available_qty' => $after, 'version' => $p->version + 1]);
                DB::table('order_items')->where('id', $item->id)->update(['restocked_qty' => $item->quantity]);
                DB::table('inventory_movements')->insert(['id' => Api::id(), 'product_id' => $p->id, 'order_id' => $order->id, 'actor_id' => $actor, 'type' => 'RELEASE', 'quantity_delta' => $item->quantity, 'available_after' => $after, 'reason' => 'Unprepared order released']);
            }
        }
        DB::table('orders')->where('id', $order->id)->update(['status' => $status, 'version' => $order->version + 1, ...($status === 'COLLECTED' ? ['collected_at' => now()] : [])]);
        DB::table('order_events')->insert(['id' => Api::id(), 'order_id' => $order->id, 'actor_id' => $actor, 'from_status' => $order->status, 'to_status' => $status, 'reason' => $reason]);
    }

    public static function transition($u, string $id, array $v): void
    {
        $found = Api::found(self::owned($u)->where('o.id', $id)->select('o.shop_id')->first());
        $ok = DB::transaction(function () use ($u, $id, $v, $found) {
            $s = DB::table('shops')->where('id', $found->shop_id)->lockForUpdate()->first();
            $o = Api::found(DB::table('orders')->where('id', $id)->lockForUpdate()->first());
            if ($u->role === 'VENDOR' ? $s->owner_id !== $u->id : $o->customer_id !== $u->id) {
                Api::fail(404, 'NOT_FOUND', 'Order not found.');
            } if ($o->status === 'PENDING' && $o->expires_at <= now()->format('Y-m-d H:i:s')) {
                self::state($o, 'EXPIRED', null, 'Vendor did not accept within 15 minutes');

                return false;
            } Api::version($o, $v['expectedVersion']);
            $allowed = $u->role === 'CUSTOMER' ? ['PENDING' => ['CANCELLED']] : ['PENDING' => ['ACCEPTED', 'REJECTED'], 'ACCEPTED' => ['PREPARING', 'CANCELLED'], 'PREPARING' => ['READY'], 'READY' => ['COLLECTED']];
            if (! in_array($v['status'], $allowed[$o->status] ?? [], true)) {
                Api::fail(409, 'INVALID_STATE', 'This action is not available for the current order status.');
            } if ($u->role === 'VENDOR' && in_array($v['status'], ['REJECTED', 'CANCELLED'], true) && strlen($v['reason']) < 3) {
                Api::fail(422, 'REASON_REQUIRED', 'Give a reason for rejecting or cancelling the order.');
            } self::state($o, $v['status'], $u->id, $v['reason']);

            return true;
        }, 3);
        if (! $ok) {
            Api::fail(409, 'ORDER_EXPIRED', 'This order expired before it was accepted.');
        }
    }

    public static function expire(): int
    {
        $count = 0;
        foreach (DB::table('orders')->where('status', 'PENDING')->where('expires_at', '<=', now())->select('id', 'shop_id')->limit(100)->get() as $candidate) {
            $count += DB::transaction(function () use ($candidate) {
                DB::table('shops')->where('id', $candidate->shop_id)->lockForUpdate()->first();
                $o = DB::table('orders')->where('id', $candidate->id)->where('status', 'PENDING')->where('expires_at', '<=', now())->lockForUpdate()->first();
                if (! $o) {
                    return 0;
                } self::state($o, 'EXPIRED', null, 'Vendor did not accept within 15 minutes');

                return 1;
            }, 3);
        }

        return $count;
    }
}
