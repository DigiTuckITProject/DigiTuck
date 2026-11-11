<?php

namespace App\Http\Controllers;

use App\Support\Api;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class CatalogueController extends Controller
{
    public static function shopsQuery()
    {
        return DB::table('shops as s')->join('users as u', 'u.id', '=', 's.owner_id')->where('s.approval_status', 'APPROVED')->whereNull('s.suspended_at')->where('u.status', 'ACTIVE');
    }

    public static function productsQuery(string $shop, bool $public = false)
    {
        $q = DB::table('products as p')->join('categories as c', 'c.id', '=', 'p.category_id')->where('p.shop_id', $shop)->whereNull('p.archived_at');
        if ($public) {
            $q->where('p.is_visible', true)->whereNull('p.moderation_hidden_at')->where('c.is_active', true);
        }

        return $q;
    }

    public static function productList(string $shop, bool $public = false): array
    {
        [$page,$limit] = Api::page();
        $q = self::productsQuery($shop, $public);
        $total = (clone $q)->count();
        $units = (int) (clone $q)->sum('p.available_qty');
        $items = $q->select('p.*', 'c.name as categoryName')->orderBy('p.name')->orderBy('p.id')->offset(($page - 1) * $limit)->limit($limit)->get()->map(fn ($p) => ['id' => $p->id, 'name' => $p->name, 'description' => $p->description ?? '', 'categoryId' => $p->category_id, 'categoryName' => $p->categoryName, 'price' => $p->price, 'availableQuantity' => $p->available_qty, 'lowStockThreshold' => $p->low_stock_threshold, 'isVisible' => (bool) $p->is_visible, 'moderationHidden' => (bool) $p->moderation_hidden_at, 'version' => $p->version, 'imageUrl' => $p->image_key ? '/api/v1/products/'.$p->id.'/image?v='.$p->version : null]);

        return ['items' => $items, 'total' => $total, 'availableUnits' => $units, 'page' => $page, 'limit' => $limit];
    }

    public function shops()
    {
        [$page,$limit] = Api::page();

        return Api::send(DB::transaction(fn () => self::shopsQuery()->select('s.id', 's.slug', 's.name', 's.description', 's.area', 's.address', 's.is_paused')->orderBy('s.name')->orderBy('s.id')->offset(($page - 1) * $limit)->limit($limit)->get()->map(function ($s) {
            $s->is_paused = (bool) $s->is_paused;
            $s->productCount = self::productsQuery($s->id, true)->count();
            $s->availableUnits = (int) self::productsQuery($s->id, true)->sum('p.available_qty');

            return $s;
        })));
    }

    public function shop(string $slug)
    {
        return Api::send(DB::transaction(function () use ($slug) {
            $s = Api::found(self::shopsQuery()->where('s.slug', $slug)->select('s.id', 's.slug', 's.name', 's.description', 's.area', 's.address', 's.is_paused')->first());
            $s->is_paused = (bool) $s->is_paused;

            return ['shop' => $s, 'products' => self::productList($s->id, true)];
        }));
    }

    public function categories()
    {
        return Api::send(DB::table('categories')->where('is_active', true)->select('id', 'name')->orderBy('name')->limit(100)->get());
    }

    public static function ownShop(Request $r, bool $lock = false)
    {
        $q = DB::table('shops')->where('owner_id', $r->attributes->get('account')->id);
        $s = ($lock ? $q->lockForUpdate() : $q)->first();
        if (! $s) {
            Api::fail(409, 'SHOP_REQUIRED', 'Save your business details before adding products.');
        }

        return $s;
    }

    public function products(Request $r)
    {
        return Api::send(DB::transaction(fn () => self::productList(self::ownShop($r)->id)));
    }

    private function input(Request $r): array
    {
        $v = $r->validate(['name' => 'required|string|min:2|max:160', 'description' => 'present|nullable|string|max:2000', 'categoryId' => 'required|uuid', 'price' => ['required', 'regex:/^(0|[1-9]\d{0,7})\.\d{2}$/'], 'lowStockThreshold' => 'required|integer|min:0|max:1000000', 'isVisible' => 'required|boolean']);
        if (Api::cents($v['price']) <= 0) {
            Api::fail(422, 'INVALID_PRICE', 'Price must be positive.');
        }
        if (! DB::table('categories')->where('id', $v['categoryId'])->where('is_active', true)->exists()) {
            Api::fail(422, 'CATEGORY_INVALID', 'Choose an active category.');
        }

        return ['name' => trim($v['name']), 'description' => $v['description'] ?? '', 'category_id' => $v['categoryId'], 'price' => $v['price'], 'low_stock_threshold' => $v['lowStockThreshold'], 'is_visible' => $v['isVisible']];
    }

    private function movement(Request $r, string $id, int $delta, int $after, string $reason): void
    {
        DB::table('inventory_movements')->insert(['id' => Api::id(), 'product_id' => $id, 'actor_id' => $r->attributes->get('account')->id, 'type' => 'ADJUST', 'quantity_delta' => $delta, 'available_after' => $after, 'reason' => $reason]);
    }

    public function create(Request $r)
    {
        $v = $r->validate(['initialQuantity' => 'required|integer|min:0|max:1000000']);

        return Api::send(DB::transaction(function () use ($r, $v) {
            $s = self::ownShop($r, true);
            $values = $this->input($r);
            $id = Api::id();
            DB::table('products')->insert(['id' => $id, 'shop_id' => $s->id, ...$values, 'available_qty' => $v['initialQuantity']]);
            if ($v['initialQuantity']) {
                $this->movement($r, $id, $v['initialQuantity'], $v['initialQuantity'], 'Initial inventory');
            }

            return ['id' => $id];
        }, 3), 201);
    }

    public function change(Request $r, string $id)
    {
        $v = $r->validate(['expectedVersion' => 'required|integer|min:1']);
        DB::transaction(function () use ($r, $id, $v) {
            $s = self::ownShop($r, true);
            $p = Api::found(DB::table('products')->where('shop_id', $s->id)->where('id', $id)->whereNull('archived_at')->lockForUpdate()->first());
            Api::version($p, $v['expectedVersion']);
            if ($r->isMethod('DELETE')) {
                $values = ['archived_at' => now(), 'is_visible' => false];
            } elseif ($r->is('*/stock')) {
                $stock = $r->validate(['quantityDelta' => 'required|integer|between:-1000000,1000000|not_in:0', 'reason' => 'required|string|min:3|max:1000']);
                $after = $p->available_qty + $stock['quantityDelta'];
                if ($after < 0 || $after > 1000000) {
                    Api::fail(422, 'INVALID_STOCK', 'Stock must stay between 0 and 1,000,000.');
                } $values = ['available_qty' => $after];
                $this->movement($r, $id, $stock['quantityDelta'], $after, $stock['reason']);
            } else {
                $values = $this->input($r);
            }
            DB::table('products')->where('id', $id)->update([...$values, 'version' => $p->version + 1]);
        }, 3);

        return Api::send(['updated' => true]);
    }

    public function uploadImage(Request $r, string $id)
    {
        $v = $r->validate(['expectedVersion' => 'required|integer|min:1', 'image' => 'required|file|max:2048|mimetypes:image/jpeg,image/png,image/webp']);
        $file = $r->file('image');
        $info = @getimagesize($file->getRealPath());
        if (! $info || $info[0] * $info[1] > 20000000) {
            Api::fail(422, 'INVALID_IMAGE', 'Select an image up to 20 megapixels.');
        }
        $source = @imagecreatefromstring(file_get_contents($file->getRealPath()));
        if (! $source) {
            Api::fail(422, 'INVALID_IMAGE', 'Unable to decode image.');
        }
        if ($file->getMimeType() === 'image/jpeg' && function_exists('exif_read_data')) {
            $orientation = (@exif_read_data($file->getRealPath()) ?: [])['Orientation'] ?? 1;
            if (in_array($orientation, [2, 4, 5, 7], true)) {
                imageflip($source, in_array($orientation, [4, 5], true) ? IMG_FLIP_VERTICAL : IMG_FLIP_HORIZONTAL);
            }
            $angle = match ($orientation) {
                3,4 => 180,5,6 => -90,7,8 => 90,default => 0
            };
            if ($angle) {
                $rotated = imagerotate($source, $angle, 0);
                imagedestroy($source);
                $source = $rotated;
            }
        }
        $width = imagesx($source);
        $height = imagesy($source);
        $ratio = min(1, 1200 / max($width, $height));
        $image = imagescale($source, max(1, (int) ($width * $ratio)), max(1, (int) ($height * $ratio)));
        ob_start();
        imagewebp($image, null, 85);
        $bytes = ob_get_clean();
        imagedestroy($source);
        imagedestroy($image);
        $key = Api::id();
        Storage::disk('private')->put($key, $bytes);
        try {
            DB::transaction(function () use ($r, $id, $v, $key) {
                $s = self::ownShop($r, true);
                $p = Api::found(DB::table('products')->where('id', $id)->where('shop_id', $s->id)->whereNull('archived_at')->lockForUpdate()->first());
                Api::version($p, $v['expectedVersion']);
                DB::table('products')->where('id', $id)->update(['image_key' => $key, 'version' => $p->version + 1]);
            }, 3);
        } catch (\Throwable $e) {
            Storage::disk('private')->delete($key);
            throw $e;
        }

        return Api::send(['updated' => true]);
    }

    public function image(Request $r, string $id)
    {
        $p = Api::found(DB::table('products')->where('id', $id)->whereNotNull('image_key')->whereNull('archived_at')->first());
        $owner = DB::table('shops')->where('id', $p->shop_id)->value('owner_id');
        if ($r->attributes->get('account')?->id !== $owner && (! self::shopsQuery()->where('s.id', $p->shop_id)->exists() || ! self::productsQuery($p->shop_id, true)->where('p.id', $id)->exists())) {
            Api::fail(404, 'NOT_FOUND', 'Image not found.');
        }
        if (! Storage::disk('private')->exists($p->image_key)) {
            Api::fail(404, 'NOT_FOUND', 'Image not found.');
        }

        return response(Storage::disk('private')->get($p->image_key), 200, ['Content-Type' => 'image/webp']);
    }

    public function dashboard(Request $r)
    {
        return Api::send(DB::transaction(function () use ($r) {
            $s = DB::table('shops')->where('owner_id', $r->attributes->get('account')->id)->select('id', 'name', 'address', 'approval_status', 'is_paused')->first();
            if (! $s) {
                return ['shop' => null, 'orders' => 0, 'products' => 0, 'pending' => 0, 'collectedValue' => '0.00', 'recent' => []];
            } $q = DB::table('orders')->where('shop_id', $s->id);

            return ['shop' => $s, 'orders' => (clone $q)->count(), 'products' => DB::table('products')->where('shop_id', $s->id)->whereNull('archived_at')->count(), 'pending' => (clone $q)->where('status', 'PENDING')->count(), 'collectedValue' => (string) ((clone $q)->where('status', 'COLLECTED')->sum('total_amount') ?: '0.00'), 'recent' => $q->select('id', 'reference', 'total_amount', 'status')->orderByDesc('created_at')->limit(5)->get()];
        }));
    }
}
