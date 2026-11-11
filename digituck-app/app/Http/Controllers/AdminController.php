<?php

namespace App\Http\Controllers;

use App\Support\Api;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function vendors()
    {
        [$p,$l] = Api::page();

        return Api::send(DB::table('shops as s')->join('users as u', 'u.id', '=', 's.owner_id')->select('s.id', 's.name', 's.approval_status', 's.review_version', 's.version', 's.submitted_at', 'u.full_name as ownerName')->orderByDesc('s.updated_at')->offset(($p - 1) * $l)->limit($l)->get());
    }

    public function review(Request $r, string $id)
    {
        $v = $r->validate(['submissionVersion' => 'sometimes|integer|min:1']);
        $s = Api::found(DB::table('shops')->where('id', $id)->first());
        $a = Api::found(DB::table('vendor_applications')->where('shop_id', $id)->where('submission_version', $v['submissionVersion'] ?? $s->review_version)->first());

        return Api::send(['shop' => ['id' => $id, 'name' => $s->name, 'version' => $s->version, 'submissionVersion' => $s->review_version, 'status' => $s->approval_status, 'suspensionReason' => $s->suspension_reason], 'application' => $a, 'documents' => DB::table('vendor_documents')->select(VendorController::DOCUMENT_COLUMNS)->where('shop_id', $id)->where('submission_version', $a->submission_version)->get(), 'versions' => DB::table('vendor_applications')->select('submission_version', 'status', 'submitted_at', 'decision_reason')->where('shop_id', $id)->orderByDesc('submission_version')->get()]);
    }

    public function decide(Request $r, string $id)
    {
        $v = $r->validate(['expectedVersion' => 'required|integer|min:1', 'submissionVersion' => 'required|integer|min:1', 'action' => 'required|in:APPROVE,REJECT,SUSPEND', 'reason' => 'required|string|min:5|max:1000']);
        $actor = $r->attributes->get('account')->id;
        DB::transaction(function () use ($id, $v, $actor) {
            $s = Api::found(DB::table('shops')->where('id', $id)->lockForUpdate()->first());
            Api::version($s, $v['expectedVersion']);
            if ($s->review_version !== $v['submissionVersion']) {
                Api::fail(409, 'STALE_VERSION', 'Review the latest submission.');
            } $a = Api::found(DB::table('vendor_applications')->where('shop_id', $id)->where('submission_version', $v['submissionVersion'])->lockForUpdate()->first());
            if ($v['action'] === 'SUSPEND') {
                if ($s->approval_status !== 'APPROVED') {
                    Api::fail(409, 'INVALID_STATE', 'Only an approved shop can be suspended.');
                } DB::table('shops')->where('id', $id)->update(['approval_status' => 'SUSPENDED', 'suspended_at' => now(), 'suspension_reason' => $v['reason'], 'version' => $s->version + 1]);
            } else {
                $restore = $v['action'] === 'APPROVE' && $s->suspended_at && $a->status === 'APPROVED';
                if ($a->status !== 'PENDING' && ! $restore) {
                    Api::fail(409, 'INVALID_STATE', 'Only the current submitted application can be reviewed.');
                } if (! DB::table('users')->where('id', $s->owner_id)->where('status', 'ACTIVE')->exists()) {
                    Api::fail(409, 'OWNER_INACTIVE', 'The shop owner must be active.');
                } $status = $v['action'] === 'APPROVE' ? 'APPROVED' : 'REJECTED';
                if (! $restore) {
                    DB::table('vendor_applications')->where('id', $a->id)->update(['status' => $status, 'reviewed_by' => $actor, 'reviewed_at' => now(), 'decision_reason' => $v['reason']]);
                } DB::table('shops')->where('id', $id)->update(['approval_status' => $status === 'REJECTED' && $s->suspended_at ? 'SUSPENDED' : $status, 'reviewed_by' => $actor, 'reviewed_at' => now(), 'rejection_reason' => $status === 'REJECTED' ? $v['reason'] : null, ...($status === 'APPROVED' ? ['suspended_at' => null, 'suspension_reason' => null] : []), 'version' => $s->version + 1]);
            }
            Api::audit($actor, 'VENDOR_'.$v['action'], 'shop', $id, ['submissionVersion' => $v['submissionVersion'], 'reason' => $v['reason']]);
        }, 3);

        return $this->review($r, $id);
    }

    public function users()
    {
        if (request()->boolean('table')) {
            return $this->table('users', ['id', 'full_name', 'normalized_email', 'role', 'status'], ['full_name', 'normalized_email', 'role', 'status', 'created_at'], ['full_name', 'normalized_email', 'role', 'status']);
        }
        [$p,$l] = Api::page();

        return Api::send(DB::table('users')->select('id', 'full_name', 'normalized_email', 'role', 'status')->orderByDesc('created_at')->offset(($p - 1) * $l)->limit($l)->get());
    }

    public function status(Request $r, string $id)
    {
        $v = $r->validate(['status' => 'required|in:ACTIVE,INACTIVE', 'reason' => 'required|string|min:5|max:1000']);
        DB::transaction(function () use ($r, $id, $v) {
            DB::table('security_locks')->where('name', 'admin-status')->lockForUpdate()->first();
            DB::table('shops')->where('owner_id', $id)->lockForUpdate()->first();
            $u = Api::found(DB::table('users')->where('id', $id)->lockForUpdate()->first());
            if ($v['status'] === 'INACTIVE' && $u->role === 'ADMIN' && $u->status === 'ACTIVE' && DB::table('users')->where('role', 'ADMIN')->where('status', 'ACTIVE')->count() <= 1) {
                Api::fail(409, 'LAST_ADMIN', 'The last active administrator cannot be deactivated.');
            } DB::table('users')->where('id', $id)->update(['status' => $v['status'], 'auth_version' => $u->auth_version + 1]);
            Api::audit($r->attributes->get('account')->id, 'USER_STATUS_CHANGED', 'user', $id, $v);
        }, 3);

        return Api::send(['updated' => true]);
    }

    public function audit()
    {
        if (request()->boolean('table')) {
            return $this->table('audit_events', ['id', 'action', 'actor_id', 'entity_type', 'entity_id', 'created_at', 'safe_metadata_json'], ['action', 'actor_id', 'entity_type', 'entity_id', 'created_at'], ['action', 'actor_id', 'entity_type', 'entity_id']);
        }
        [$p,$l] = Api::page();

        return Api::send(DB::table('audit_events')->orderByDesc('created_at')->offset(($p - 1) * $l)->limit($l)->get());
    }

    private function table(string $table, array $columns, array $sorts, array $searchable)
    {
        [$page, $limit] = Api::page();
        $v = request()->validate(['search' => 'nullable|string|max:100', 'sort' => 'sometimes|in:'.implode(',', $sorts), 'direction' => 'sometimes|in:asc,desc']);
        $query = DB::table($table);
        $search = trim($v['search'] ?? '');
        if ($search !== '') {
            // Bind the search value; LOCATE treats percent/underscore as literal text.
            $query->where(function ($q) use ($searchable, $search) {
                foreach ($searchable as $column) {
                    $q->orWhereRaw('LOCATE(?, `'.$column.'`) > 0', [$search]);
                }
            });
        }
        $total = (clone $query)->count();
        $pages = max(1, (int) ceil($total / $limit));
        $page = min($page, $pages);
        $rows = $query->select($columns)->orderBy($v['sort'] ?? 'created_at', $v['direction'] ?? 'desc')->orderBy('id')->offset(($page - 1) * $limit)->limit($limit)->get();

        return Api::send(['rows' => $rows, 'page' => $page, 'pageSize' => $limit, 'total' => $total, 'pages' => $pages]);
    }
}
