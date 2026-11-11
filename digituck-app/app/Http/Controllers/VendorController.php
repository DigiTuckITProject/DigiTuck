<?php

namespace App\Http\Controllers;

use App\Support\Api;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class VendorController extends Controller
{
    public const DOCUMENT_COLUMNS = ['id', 'shop_id', 'submission_version', 'type', 'original_name', 'detected_mime', 'bytes', 'uploaded_at'];

    public static function profile($s): array
    {
        return ['name' => $s->name, 'description' => $s->description ?? '', 'phone' => $s->phone, 'address' => $s->address, 'area' => $s->area, 'hours' => json_decode($s->hours_json, true), 'isPaused' => (bool) $s->is_paused];
    }

    public static function requiredTypes(): array
    {
        return config('digituck.document_types');
    }

    public function view(Request $r)
    {
        $s = DB::table('shops')->where('owner_id', $r->attributes->get('account')->id)->first();

        return Api::send(! $s ? ['shop' => null, 'application' => null, 'documents' => [], 'requiredTypes' => self::requiredTypes()] : ['shop' => ['id' => $s->id, 'slug' => $s->slug, ...self::profile($s), 'version' => $s->version, 'submissionVersion' => $s->review_version, 'status' => $s->approval_status, 'suspensionReason' => $s->suspension_reason, 'rejectionReason' => $s->rejection_reason], 'application' => DB::table('vendor_applications')->where('shop_id', $s->id)->where('submission_version', $s->review_version)->first(), 'documents' => DB::table('vendor_documents')->select(self::DOCUMENT_COLUMNS)->where('shop_id', $s->id)->where('submission_version', $s->review_version)->get(), 'requiredTypes' => self::requiredTypes()]);
    }

    public function draft($s, array $snapshot): void
    {
        DB::table('vendor_applications')->insert(['id' => Api::id(), 'shop_id' => $s->id, 'submission_version' => $s->review_version + 1, 'profile_snapshot_json' => json_encode($snapshot), 'status' => 'DRAFT']);
        DB::table('shops')->where('id', $s->id)->update(['review_version' => $s->review_version + 1, 'approval_status' => $s->suspended_at ? 'SUSPENDED' : 'DRAFT', 'rejection_reason' => null, 'reviewed_by' => null, 'reviewed_at' => null, 'submitted_at' => null]);
    }

    public function save(Request $r)
    {
        $v = $r->validate(['name' => 'required|string|min:2|max:160', 'description' => 'present|nullable|string|max:2000', 'phone' => ['required', 'regex:/^\+[1-9]\d{7,14}$/'], 'address' => 'required|string|min:5|max:500', 'area' => 'required|string|min:2|max:120', 'hours' => 'present|array|max:7', 'hours.*.day' => 'required|integer|between:0,6|distinct', 'hours.*.open' => ['required', 'regex:/^([01]\d|2[0-3]):[0-5]\d$/'], 'hours.*.close' => ['required', 'regex:/^([01]\d|2[0-3]):[0-5]\d$/'], 'isPaused' => 'required|boolean', 'expectedVersion' => 'required|integer|min:0']);
        foreach ($v['hours'] as $h) {
            if ($h['open'] >= $h['close']) {
                Api::fail(422, 'INVALID_HOURS', 'Closing time must follow opening time.');
            }
        }
        $owner = $r->attributes->get('account')->id;
        DB::transaction(function () use ($owner, $v) {
            $s = DB::table('shops')->where('owner_id', $owner)->lockForUpdate()->first();
            $values = ['name' => trim($v['name']), 'description' => $v['description'] ?? '', 'phone' => $v['phone'], 'address' => trim($v['address']), 'area' => trim($v['area']), 'hours_json' => json_encode($v['hours']), 'is_paused' => $v['isPaused']];
            if (! $s) {
                if ($v['expectedVersion'] !== 0) {
                    Api::fail(409, 'STALE_VERSION', 'Refresh the profile.');
                } $id = Api::id();
                DB::table('shops')->insert(['id' => $id, 'owner_id' => $owner, 'slug' => 'shop-'.$id, ...$values, 'approval_status' => 'DRAFT']);
                DB::table('vendor_applications')->insert(['id' => Api::id(), 'shop_id' => $id, 'submission_version' => 1, 'profile_snapshot_json' => json_encode($v), 'status' => 'DRAFT']);
                Api::audit($owner, 'SHOP_CREATED', 'shop', $id);

                return;
            }
            Api::version($s, $v['expectedVersion']);
            $a = DB::table('vendor_applications')->where('shop_id', $s->id)->where('submission_version', $s->review_version)->lockForUpdate()->first();
            $material = $s->name !== $values['name'] || $s->address !== $values['address'] || $s->area !== $values['area'];
            if ($material && $a->submitted_at) {
                $this->draft($s, $v);
            } elseif (! $a->submitted_at) {
                DB::table('vendor_applications')->where('id', $a->id)->update(['profile_snapshot_json' => json_encode($v)]);
            }
            DB::table('shops')->where('id', $s->id)->update([...$values, 'version' => $s->version + 1]);
            Api::audit($owner, $material ? 'SHOP_MATERIAL_CHANGED' : 'SHOP_UPDATED', 'shop', $s->id);
        }, 3);

        return $this->view($r);
    }

    public function revise(Request $r)
    {
        $v = $r->validate(['expectedVersion' => 'required|integer|min:1']);
        DB::transaction(function () use ($r, $v) {
            $s = CatalogueController::ownShop($r, true);
            Api::version($s, $v['expectedVersion']);
            $a = DB::table('vendor_applications')->where('shop_id', $s->id)->where('submission_version', $s->review_version)->first();
            if (! $a->submitted_at) {
                Api::fail(409, 'ALREADY_DRAFT', 'This application is already a draft.');
            } $this->draft($s, self::profile($s));
            DB::table('shops')->where('id', $s->id)->increment('version');
            Api::audit($s->owner_id, 'APPLICATION_REVISED', 'shop', $s->id);
        }, 3);

        return $this->view($r);
    }

    public function submit(Request $r)
    {
        $v = $r->validate(['expectedVersion' => 'required|integer|min:1']);
        DB::transaction(function () use ($r, $v) {
            $s = CatalogueController::ownShop($r, true);
            Api::version($s, $v['expectedVersion']);
            $a = DB::table('vendor_applications')->where('shop_id', $s->id)->where('submission_version', $s->review_version)->lockForUpdate()->first();
            if ($a->status !== 'DRAFT') {
                Api::fail(409, 'ALREADY_SUBMITTED', 'This version has already been submitted.');
            } $types = DB::table('vendor_documents')->where('shop_id', $s->id)->where('submission_version', $s->review_version)->pluck('type')->all();
            if (array_diff(self::requiredTypes(), $types)) {
                Api::fail(422, 'DOCUMENTS_REQUIRED', 'Upload each document on the checklist before submitting.');
            } $u = DB::table('users')->where('id', $s->owner_id)->first();
            if ($u->status !== 'ACTIVE') {
                Api::fail(403, 'FORBIDDEN', 'Account is not active.');
            } DB::table('vendor_applications')->where('id', $a->id)->update(['profile_snapshot_json' => json_encode([...self::profile($s), 'ownerName' => $u->full_name]), 'status' => 'PENDING', 'submitted_at' => now()]);
            DB::table('shops')->where('id', $s->id)->update(['approval_status' => $s->suspended_at ? 'SUSPENDED' : 'PENDING', 'submitted_at' => now(), 'version' => $s->version + 1]);
            Api::audit($s->owner_id, 'APPLICATION_SUBMITTED', 'shop', $s->id, ['submissionVersion' => $s->review_version]);
        }, 3);

        return $this->view($r);
    }

    public function upload(Request $r)
    {
        $v = $r->validate(['expectedVersion' => 'required|integer|min:1', 'type' => 'required|string|max:80', 'document' => 'required|file|max:10240|mimetypes:application/pdf,image/jpeg,image/png']);
        if (! in_array($v['type'], self::requiredTypes(), true)) {
            Api::fail(422, 'DOCUMENT_TYPE', 'Select a document type from the checklist.');
        } $file = $r->file('document');
        $key = Api::id();
        Storage::disk('private')->put($key, file_get_contents($file->getRealPath()));
        try {
            DB::transaction(function () use ($r, $v, $file, $key) {
                $s = CatalogueController::ownShop($r, true);
                Api::version($s, $v['expectedVersion']);
                $a = DB::table('vendor_applications')->where('shop_id', $s->id)->where('submission_version', $s->review_version)->lockForUpdate()->first();
                if ($a->status !== 'DRAFT') {
                    Api::fail(409, 'SUBMISSION_FROZEN', 'Create a new revision before changing submitted documents.');
                } if (DB::table('vendor_documents')->where('shop_id', $s->id)->where('submission_version', $s->review_version)->count() >= 10) {
                    Api::fail(422, 'DOCUMENT_LIMIT', 'A version can contain at most 10 documents.');
                } DB::table('vendor_documents')->insert(['id' => Api::id(), 'shop_id' => $s->id, 'submission_version' => $s->review_version, 'type' => $v['type'], 'object_key' => $key, 'original_name' => substr(preg_replace('/[^a-zA-Z0-9._ -]/', '_', basename($file->getClientOriginalName())), 0, 120) ?: 'document', 'detected_mime' => $file->getMimeType(), 'bytes' => $file->getSize()]);
                DB::table('shops')->where('id', $s->id)->increment('version');
                Api::audit($s->owner_id, 'DOCUMENT_UPLOADED', 'shop', $s->id, ['type' => $v['type']]);
            }, 3);
        } catch (\Throwable $e) {
            Storage::disk('private')->delete($key);
            throw $e;
        }

        return $this->view($r)->setStatusCode(201);
    }

    public function remove(Request $r, string $id)
    {
        $v = $r->validate(['expectedVersion' => 'required|integer|min:1']);
        $key = DB::transaction(function () use ($r, $id, $v) {
            $s = CatalogueController::ownShop($r, true);
            $d = Api::found(DB::table('vendor_documents')->where('id', $id)->where('shop_id', $s->id)->where('submission_version', $s->review_version)->first());
            Api::version($s, $v['expectedVersion']);
            $a = DB::table('vendor_applications')->where('shop_id', $s->id)->where('submission_version', $s->review_version)->first();
            if ($a->status !== 'DRAFT') {
                Api::fail(409, 'SUBMISSION_FROZEN', 'Submitted documents cannot be deleted.');
            } DB::table('vendor_documents')->where('id', $id)->delete();
            DB::table('shops')->where('id', $s->id)->increment('version');
            Api::audit($s->owner_id, 'DOCUMENT_REMOVED', 'shop', $s->id);

            return $d->object_key;
        }, 3);
        Storage::disk('private')->delete($key);

        return $this->view($r);
    }

    public function download(Request $r, string $id)
    {
        $d = Api::found(DB::table('vendor_documents as d')->join('shops as s', 's.id', '=', 'd.shop_id')->where('d.id', $id)->select('d.*', 's.owner_id')->first());
        $u = $r->attributes->get('account');
        if ($u->role !== 'ADMIN' && ($u->role !== 'VENDOR' || $d->owner_id !== $u->id)) {
            Api::fail(404, 'NOT_FOUND', 'Document not found.');
        } if (! Storage::disk('private')->exists($d->object_key)) {
            Api::fail(404, 'NOT_FOUND', 'Document file not found.');
        } if ($u->role === 'ADMIN') {
            Api::audit($u->id, 'DOCUMENT_REVIEWED', 'document', $id);
        }

        return Storage::disk('private')->download($d->object_key, $d->original_name, ['Content-Type' => $d->detected_mime, 'X-Content-Type-Options' => 'nosniff']);
    }
}
