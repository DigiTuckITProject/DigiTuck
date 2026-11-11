<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('users')) {
            foreach (['users' => ['auth_version', 'order_notifications'], 'shops' => ['suspended_at'], 'products' => ['available_qty'], 'orders' => ['version'], 'security_locks' => ['name']] as $table => $columns) {
                foreach ($columns as $column) {
                    if (! Schema::hasColumn($table, $column)) {
                        throw new RuntimeException('Existing database must be upgraded to DigiTuck schema 004 before adoption. Missing '.$table.'.'.$column);
                    }
                }
            }

            return;
        }
        $delimiter = ';';
        $buffer = '';
        try {
            foreach (file(database_path('schema/digituck.sql')) as $line) {
                if (preg_match('/^DELIMITER\s+(\S+)/', trim($line), $match)) {
                    $delimiter = $match[1];

                    continue;
                } if (str_starts_with(trim($line), '--') || trim($line) === '') {
                    continue;
                } $buffer .= $line;
                if (str_ends_with(rtrim($buffer), $delimiter)) {
                    DB::unprepared(substr(rtrim($buffer), 0, -strlen($delimiter)));
                    $buffer = '';
                }
            }
        } finally {
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }
    }

    public function down(): void
    {
        throw new RuntimeException('Business data is preserved. Restore a verified backup to reverse the migration.');
    }
};
