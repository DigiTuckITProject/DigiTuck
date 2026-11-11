# DigiTuck — private manual deployment

Target: https://sakhimhlongo-foundation.org.za
PHP: 8.3 or newer. This package includes compiled React, Laravel production dependencies, database SQL and a preconfigured private .env with a fresh application key. No Node server or node_modules is needed on the host.

This ZIP contains your database password and application key. Keep it private. Upload/extract it outside the website document root; never leave it available for public download.

## 1. Back up before replacing
Export the existing wcvttmms_digituck database (including triggers) through phpMyAdmin and download a backup of all existing website files. Keep both backups outside public_html. This package is a clean installation: existing accounts/products/orders are not included.

## 2. Upload to the domain directory
Your panel URL uses the Evolution hosting interface. In File Manager locate the directory containing this domain's public_html. A common layout is:

/home/HOSTING_USER/domains/sakhimhlongo-foundation.org.za/
    digituck-app/       PRIVATE Laravel code and .env
    public_html/        public files only
    database-sql/      clean SQL, outside public_html

Confirm the actual path in your panel; HOSTING_USER is a placeholder, not necessarily your database username. Back up/move the old public_html contents before placing the new files, so an old index.html does not override the Laravel entry point. Extract the package in the domain directory above public_html. The included public_html/index.php expects digituck-app beside public_html. If your host uses a different layout, adjust its $base path accordingly.

Enable hidden files in File Manager. Verify digituck-app/.env and public_html/.htaccess exist after extraction. The real .env must never be inside public_html. Keep normal private file permissions (such as 600 for .env where supported) and host-approved writable permissions on digituck-app/storage and digituck-app/bootstrap/cache; do not use 777.

## 3. Prepare database
The configuration already selects localhost, database wcvttmms_digituck and username wcvttmms_digituck with the supplied password. Verify this user has rights to the database, including CREATE, ALTER, INDEX and TRIGGER.

For the clean replacement you authorised, first verify your backup export is complete. In phpMyAdmin select ONLY wcvttmms_digituck, remove its old tables/views, and leave the database itself and its user in place. Do not touch other databases. The next step creates the new schema. Alternatively import database-sql/digituck.sql into the now-empty database and still run the migrations below for Laravel runtime tables.

The SQL uses utf8mb4_unicode_ci, not utf8mb4_0900_ai_ci. MySQL 8.4 was tested locally; older MySQL and MariaDB compatibility have not been verified. Check the host's version and PHP extensions before removing the old installation.

## 4. Finish installation using Terminal/SSH
Select PHP 8.3+ and enable PDO MySQL, GD/WebP, mbstring, fileinfo, XML and the usual Laravel extensions. Set upload_max_filesize=10M and post_max_size=12M. Activate HTTPS for the exact domain before signing in.

Run from your actual digituck-app directory using the host's PHP 8.3+ executable:

    php artisan migrate --force
    php artisan optimize
    php artisan admin:bootstrap

The application key is already generated: do not regenerate it. admin:bootstrap creates your first administrator interactively; there is no default admin password. If Terminal/SSH is unavailable, ask hosting support to run these commands. Do not upload a public installer or expose Artisan through a webpage.

## 5. Schedule inventory release
Create a cron job every minute, replacing both paths with the actual hosting paths:

    * * * * * /PATH/TO/PHP83 /ABSOLUTE/PATH/digituck-app/artisan schedule:run >> /ABSOLUTE/PATH/digituck-app/storage/logs/scheduler.log 2>&1

## 6. Verify
Visit https://sakhimhlongo-foundation.org.za/api/v1/health/ready and confirm status ready. Open /login and sign in as your administrator. Check Users/Audit search and pagination, vendor registration/products/inventory, guest cart, customer checkout and sign-out. Check that /.env cannot be downloaded. Keep APP_DEBUG=false. Read errors privately in digituck-app/storage/logs/laravel.log.

APP_URL is configured for the non-www HTTPS domain. Use that exact address; redirect www to the non-www domain in the hosting panel if needed.

Keep the private ZIP and backups off the public website. For future updates preserve production .env, APP_KEY and storage; do not import the clean SQL again.

Package verification is local only. No remote files or database were changed by preparing this package.
