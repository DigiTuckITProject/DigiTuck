-- Collation compatibility variant: utf8mb4_unicode_ci replaces utf8mb4_0900_ai_ci.
-- Fixes unknown-collation errors only; destination server compatibility must still be checked.
-- DigiTuck shareable MySQL 8.4 schema. Import into an EMPTY database.
-- No customer/vendor accounts, password hashes, sessions, documents or orders are included.

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_events` (
  `id` char(36) NOT NULL,
  `actor_id` char(36) DEFAULT NULL,
  `action` varchar(80) NOT NULL,
  `entity_type` varchar(80) NOT NULL,
  `entity_id` char(36) NOT NULL,
  `safe_metadata_json` json DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ix_audit_entity` (`entity_type`,`entity_id`,`created_at`),
  KEY `ix_audit_actor` (`actor_id`,`created_at`),
  CONSTRAINT `audit_events_ibfk_1` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 */ /*!50003 TRIGGER `audit_events_update` BEFORE UPDATE ON `audit_events` FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'History is append-only' */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 */ /*!50003 TRIGGER `audit_events_delete` BEFORE DELETE ON `audit_events` FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'History is append-only' */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_rate_limits` (
  `hashed_account_key` char(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `hashed_ip_key` char(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `window_start` datetime(3) NOT NULL,
  `failure_count` int NOT NULL DEFAULT '0',
  `blocked_until` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`hashed_account_key`,`hashed_ip_key`,`window_start`),
  KEY `ix_rate_expiry` (`blocked_until`,`window_start`),
  KEY `ix_rate_window` (`window_start`),
  CONSTRAINT `ck_failure_count` CHECK ((`failure_count` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` char(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(120) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  CONSTRAINT `ck_category_active` CHECK ((`is_active` in (0,1)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `idempotency_requests` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `operation` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `request_key` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `request_hash` char(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `resource_id` char(36) DEFAULT NULL,
  `response_status` int DEFAULT NULL,
  `response_json` json DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expires_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_idempotency` (`user_id`,`operation`,`request_key`),
  KEY `ix_idempotency_expiry` (`expires_at`),
  CONSTRAINT `idempotency_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_response_status` CHECK (((`response_status` is null) or (`response_status` between 100 and 599)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_movements` (
  `id` char(36) NOT NULL,
  `product_id` char(36) NOT NULL,
  `order_id` char(36) DEFAULT NULL,
  `actor_id` char(36) DEFAULT NULL,
  `type` varchar(16) NOT NULL,
  `quantity_delta` int NOT NULL,
  `available_after` int NOT NULL,
  `reason` varchar(1000) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_order_movement` (`order_id`,`product_id`,`type`),
  KEY `actor_id` (`actor_id`),
  KEY `ix_product_movement` (`product_id`,`created_at`),
  CONSTRAINT `inventory_movements_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `inventory_movements_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `inventory_movements_ibfk_3` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_movement_sign` CHECK ((((`type` = _utf8mb4'RESERVE') and (`quantity_delta` < 0) and (`order_id` is not null)) or ((`type` = _utf8mb4'RELEASE') and (`quantity_delta` > 0) and (`order_id` is not null)) or ((`type` = _utf8mb4'ADJUST') and (`quantity_delta` <> 0) and (`order_id` is null)))),
  CONSTRAINT `ck_movement_stock` CHECK ((`available_after` >= 0)),
  CONSTRAINT `ck_movement_type` CHECK ((`type` in (_utf8mb4'RESERVE',_utf8mb4'RELEASE',_utf8mb4'ADJUST')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 */ /*!50003 TRIGGER `inventory_movements_update` BEFORE UPDATE ON `inventory_movements` FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'History is append-only' */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 */ /*!50003 TRIGGER `inventory_movements_delete` BEFORE DELETE ON `inventory_movements` FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'History is append-only' */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `knex_migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `batch` int DEFAULT NULL,
  `migration_time` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `knex_migrations_lock` (
  `index` int unsigned NOT NULL AUTO_INCREMENT,
  `is_locked` int DEFAULT NULL,
  PRIMARY KEY (`index`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_events` (
  `id` char(36) NOT NULL,
  `order_id` char(36) NOT NULL,
  `actor_id` char(36) DEFAULT NULL,
  `from_status` varchar(16) DEFAULT NULL,
  `to_status` varchar(16) NOT NULL,
  `reason` varchar(1000) DEFAULT NULL,
  `restock_detail_json` json DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `actor_id` (`actor_id`),
  KEY `ix_order_event_time` (`order_id`,`created_at`),
  CONSTRAINT `order_events_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `order_events_ibfk_2` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_event_from` CHECK (((`from_status` is null) or (`from_status` in (_utf8mb4'PENDING',_utf8mb4'ACCEPTED',_utf8mb4'PREPARING',_utf8mb4'READY',_utf8mb4'COLLECTED',_utf8mb4'REJECTED',_utf8mb4'CANCELLED',_utf8mb4'EXPIRED')))),
  CONSTRAINT `ck_event_to` CHECK ((`to_status` in (_utf8mb4'PENDING',_utf8mb4'ACCEPTED',_utf8mb4'PREPARING',_utf8mb4'READY',_utf8mb4'COLLECTED',_utf8mb4'REJECTED',_utf8mb4'CANCELLED',_utf8mb4'EXPIRED')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 */ /*!50003 TRIGGER `order_events_update` BEFORE UPDATE ON `order_events` FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'History is append-only' */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 */ /*!50003 TRIGGER `order_events_delete` BEFORE DELETE ON `order_events` FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'History is append-only' */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` char(36) NOT NULL,
  `order_id` char(36) NOT NULL,
  `product_id` char(36) NOT NULL,
  `shop_id` char(36) NOT NULL,
  `name_snapshot` varchar(160) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `quantity` int NOT NULL,
  `line_total` decimal(10,2) NOT NULL,
  `restocked_qty` int NOT NULL DEFAULT '0',
  `written_off_qty` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_order_product` (`order_id`,`product_id`),
  KEY `order_id` (`order_id`,`shop_id`),
  KEY `product_id` (`product_id`,`shop_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`, `shop_id`) REFERENCES `orders` (`id`, `shop_id`) ON DELETE RESTRICT,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`, `shop_id`) REFERENCES `products` (`id`, `shop_id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_item_disposition` CHECK (((`restocked_qty` >= 0) and (`written_off_qty` >= 0) and ((`restocked_qty` + `written_off_qty`) <= `quantity`))),
  CONSTRAINT `ck_item_price` CHECK (((`unit_price` > 0) and (`line_total` = (`unit_price` * `quantity`)))),
  CONSTRAINT `ck_item_quantity` CHECK ((`quantity` between 1 and 99))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 */ /*!50003 TRIGGER `order_items_snapshot` BEFORE UPDATE ON `order_items` FOR EACH ROW BEGIN
      IF NOT (NEW.id <=> OLD.id) OR NOT (NEW.order_id <=> OLD.order_id) OR NOT (NEW.product_id <=> OLD.product_id) OR NOT (NEW.shop_id <=> OLD.shop_id) OR NOT (NEW.name_snapshot <=> OLD.name_snapshot) OR NOT (NEW.unit_price <=> OLD.unit_price) OR NOT (NEW.quantity <=> OLD.quantity) OR NOT (NEW.line_total <=> OLD.line_total) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Order snapshot is immutable'; END IF; END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 */ /*!50003 TRIGGER `order_items_delete` BEFORE DELETE ON `order_items` FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Order history cannot be deleted' */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` char(36) NOT NULL,
  `reference` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `customer_id` char(36) NOT NULL,
  `shop_id` char(36) NOT NULL,
  `status` varchar(16) NOT NULL DEFAULT 'PENDING',
  `total_amount` decimal(10,2) NOT NULL,
  `currency` char(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'ZAR',
  `notes` varchar(500) DEFAULT NULL,
  `shop_name_snapshot` varchar(160) NOT NULL,
  `pickup_address_snapshot` varchar(500) NOT NULL,
  `expires_at` datetime(3) NOT NULL,
  `collected_at` datetime(3) DEFAULT NULL,
  `version` int NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `reference` (`reference`),
  UNIQUE KEY `uq_order_shop` (`id`,`shop_id`),
  KEY `ix_order_customer` (`customer_id`,`created_at`),
  KEY `ix_order_queue` (`shop_id`,`status`,`created_at`),
  KEY `ix_order_expiry` (`status`,`expires_at`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_order_amount` CHECK ((`total_amount` > 0)),
  CONSTRAINT `ck_order_collected` CHECK ((((`status` = _utf8mb4'COLLECTED') and (`collected_at` is not null)) or ((`status` <> _utf8mb4'COLLECTED') and (`collected_at` is null)))),
  CONSTRAINT `ck_order_currency` CHECK ((`currency` = _utf8mb4'ZAR')),
  CONSTRAINT `ck_order_status` CHECK ((`status` in (_utf8mb4'PENDING',_utf8mb4'ACCEPTED',_utf8mb4'PREPARING',_utf8mb4'READY',_utf8mb4'COLLECTED',_utf8mb4'REJECTED',_utf8mb4'CANCELLED',_utf8mb4'EXPIRED'))),
  CONSTRAINT `ck_order_version` CHECK ((`version` >= 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 */ /*!50003 TRIGGER `orders_snapshot` BEFORE UPDATE ON `orders` FOR EACH ROW BEGIN
      IF NOT (NEW.id <=> OLD.id) OR NOT (NEW.reference <=> OLD.reference) OR NOT (NEW.customer_id <=> OLD.customer_id) OR NOT (NEW.shop_id <=> OLD.shop_id) OR NOT (NEW.total_amount <=> OLD.total_amount) OR NOT (NEW.currency <=> OLD.currency) OR NOT (NEW.notes <=> OLD.notes) OR NOT (NEW.shop_name_snapshot <=> OLD.shop_name_snapshot) OR NOT (NEW.pickup_address_snapshot <=> OLD.pickup_address_snapshot) OR NOT (NEW.expires_at <=> OLD.expires_at) OR NOT (NEW.created_at <=> OLD.created_at) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Order snapshot is immutable'; END IF; END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 */ /*!50003 TRIGGER `orders_delete` BEFORE DELETE ON `orders` FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Order history cannot be deleted' */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` char(36) NOT NULL,
  `shop_id` char(36) NOT NULL,
  `category_id` char(36) NOT NULL,
  `name` varchar(160) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `available_qty` int NOT NULL DEFAULT '0',
  `low_stock_threshold` int NOT NULL DEFAULT '5',
  `image_key` varchar(255) DEFAULT NULL,
  `is_visible` tinyint(1) NOT NULL DEFAULT '1',
  `moderation_hidden_at` datetime(3) DEFAULT NULL,
  `archived_at` datetime(3) DEFAULT NULL,
  `version` int NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_product_shop` (`id`,`shop_id`),
  KEY `category_id` (`category_id`),
  KEY `ix_product_catalogue` (`shop_id`,`category_id`,`is_visible`,`archived_at`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `products_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_product_price` CHECK ((`price` > 0)),
  CONSTRAINT `ck_product_stock` CHECK (((`available_qty` >= 0) and (`low_stock_threshold` >= 0))),
  CONSTRAINT `ck_product_version` CHECK ((`version` >= 1)),
  CONSTRAINT `ck_product_visible` CHECK ((`is_visible` in (0,1)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `security_locks` (
  `name` varchar(80) NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int unsigned NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY (`session_id`),
  KEY `ix_session_expiry` (`expires`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shops` (
  `id` char(36) NOT NULL,
  `owner_id` char(36) NOT NULL,
  `slug` varchar(160) NOT NULL,
  `name` varchar(160) NOT NULL,
  `description` text,
  `phone` varchar(16) NOT NULL,
  `address` varchar(500) NOT NULL,
  `area` varchar(120) NOT NULL,
  `timezone` varchar(64) NOT NULL DEFAULT 'Africa/Johannesburg',
  `hours_json` json NOT NULL,
  `approval_status` varchar(16) NOT NULL DEFAULT 'DRAFT',
  `is_paused` tinyint(1) NOT NULL DEFAULT '1',
  `review_version` int NOT NULL DEFAULT '1',
  `version` int NOT NULL DEFAULT '1',
  `rejection_reason` varchar(1000) DEFAULT NULL,
  `reviewed_by` char(36) DEFAULT NULL,
  `reviewed_at` datetime(3) DEFAULT NULL,
  `submitted_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `suspended_at` timestamp(3) NULL DEFAULT NULL,
  `suspension_reason` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `owner_id` (`owner_id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `reviewed_by` (`reviewed_by`),
  KEY `ix_shop_discovery` (`approval_status`,`area`),
  CONSTRAINT `shops_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `shops_ibfk_2` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_shop_approval` CHECK ((`approval_status` in (_utf8mb4'DRAFT',_utf8mb4'PENDING',_utf8mb4'APPROVED',_utf8mb4'REJECTED',_utf8mb4'SUSPENDED'))),
  CONSTRAINT `ck_shop_paused` CHECK ((`is_paused` in (0,1))),
  CONSTRAINT `ck_shop_versions` CHECK (((`review_version` >= 1) and (`version` >= 1)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` char(36) NOT NULL,
  `full_name` varchar(120) NOT NULL,
  `normalized_email` varchar(254) NOT NULL,
  `normalized_phone` varchar(16) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(16) NOT NULL,
  `status` varchar(16) NOT NULL DEFAULT 'ACTIVE',
  `auth_version` int NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `order_notifications` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `normalized_email` (`normalized_email`),
  UNIQUE KEY `normalized_phone` (`normalized_phone`),
  CONSTRAINT `ck_auth_version` CHECK ((`auth_version` >= 1)),
  CONSTRAINT `ck_user_role` CHECK ((`role` in (_utf8mb4'CUSTOMER',_utf8mb4'VENDOR',_utf8mb4'ADMIN'))),
  CONSTRAINT `ck_user_status` CHECK ((`status` in (_utf8mb4'ACTIVE',_utf8mb4'INACTIVE')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendor_applications` (
  `id` char(36) NOT NULL,
  `shop_id` char(36) NOT NULL,
  `submission_version` int NOT NULL,
  `profile_snapshot_json` json NOT NULL,
  `status` varchar(16) NOT NULL DEFAULT 'DRAFT',
  `submitted_at` datetime(3) DEFAULT NULL,
  `reviewed_by` char(36) DEFAULT NULL,
  `reviewed_at` datetime(3) DEFAULT NULL,
  `decision_reason` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_application_version` (`shop_id`,`submission_version`),
  KEY `reviewed_by` (`reviewed_by`),
  KEY `ix_application_review` (`status`,`submitted_at`),
  CONSTRAINT `vendor_applications_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `vendor_applications_ibfk_2` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_application_status` CHECK ((`status` in (_utf8mb4'DRAFT',_utf8mb4'PENDING',_utf8mb4'APPROVED',_utf8mb4'REJECTED'))),
  CONSTRAINT `ck_application_submission` CHECK ((((`status` = _utf8mb4'DRAFT') and (`submitted_at` is null)) or ((`status` <> _utf8mb4'DRAFT') and (`submitted_at` is not null)))),
  CONSTRAINT `ck_application_version` CHECK ((`submission_version` >= 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 */ /*!50003 TRIGGER `application_freeze` BEFORE UPDATE ON `vendor_applications` FOR EACH ROW BEGIN
      IF OLD.submitted_at IS NOT NULL AND (
        NOT (NEW.id <=> OLD.id) OR NOT (NEW.shop_id <=> OLD.shop_id) OR NOT (NEW.submission_version <=> OLD.submission_version)
        OR NOT (NEW.profile_snapshot_json <=> OLD.profile_snapshot_json) OR NOT (NEW.submitted_at <=> OLD.submitted_at) OR NEW.status = 'DRAFT'
      ) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Submitted application is immutable'; END IF;
    END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 */ /*!50003 TRIGGER `application_delete` BEFORE DELETE ON `vendor_applications` FOR EACH ROW BEGIN IF OLD.submitted_at IS NOT NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Submitted application cannot be deleted'; END IF; END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendor_documents` (
  `id` char(36) NOT NULL,
  `shop_id` char(36) NOT NULL,
  `submission_version` int NOT NULL,
  `type` varchar(80) NOT NULL,
  `object_key` varchar(255) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `detected_mime` varchar(100) NOT NULL,
  `bytes` bigint NOT NULL,
  `uploaded_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `superseded_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `object_key` (`object_key`),
  KEY `shop_id` (`shop_id`,`submission_version`),
  CONSTRAINT `vendor_documents_ibfk_1` FOREIGN KEY (`shop_id`, `submission_version`) REFERENCES `vendor_applications` (`shop_id`, `submission_version`) ON DELETE RESTRICT,
  CONSTRAINT `ck_document_mime` CHECK ((`detected_mime` in (_utf8mb4'application/pdf',_utf8mb4'image/jpeg',_utf8mb4'image/png'))),
  CONSTRAINT `ck_document_size` CHECK (((`bytes` > 0) and (`bytes` <= 10485760)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 */ /*!50003 TRIGGER `document_insert` BEFORE INSERT ON `vendor_documents` FOR EACH ROW BEGIN
        DECLARE submitted DATETIME(3);
        SELECT submitted_at INTO submitted FROM vendor_applications WHERE shop_id = NEW.shop_id AND submission_version = NEW.submission_version FOR UPDATE;
        IF submitted IS NOT NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Submitted documents are immutable'; END IF;
        
      END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 */ /*!50003 TRIGGER `document_update` BEFORE UPDATE ON `vendor_documents` FOR EACH ROW BEGIN
        DECLARE submitted DATETIME(3);
        SELECT submitted_at INTO submitted FROM vendor_applications WHERE shop_id = OLD.shop_id AND submission_version = OLD.submission_version FOR UPDATE;
        IF submitted IS NOT NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Submitted documents are immutable'; END IF;
        IF NOT (NEW.shop_id <=> OLD.shop_id) OR NOT (NEW.submission_version <=> OLD.submission_version) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Document application cannot change'; END IF;
      END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 */ /*!50003 TRIGGER `document_delete` BEFORE DELETE ON `vendor_documents` FOR EACH ROW BEGIN
        DECLARE submitted DATETIME(3);
        SELECT submitted_at INTO submitted FROM vendor_applications WHERE shop_id = OLD.shop_id AND submission_version = OLD.submission_version FOR UPDATE;
        IF submitted IS NOT NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Submitted documents are immutable'; END IF;
        
      END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;


insert into `categories` (`id`, `is_active`, `name`, `slug`) values ('ca000000-0000-4000-8000-000000000002', 1, 'Drinks', 'drinks'), ('ca000000-0000-4000-8000-000000000001', 1, 'Food', 'food'), ('ca000000-0000-4000-8000-000000000003', 1, 'Groceries', 'groceries'), ('ca000000-0000-4000-8000-000000000004', 1, 'Other', 'other');

insert into `knex_migrations` (`batch`, `id`, `migration_time`, `name`) values (1, 1, '2026-11-06 17:55:58.000', '001_foundation.mjs'), (2, 2, '2026-11-07 06:45:43.000', '002_phase_two.mjs'), (3, 3, '2026-11-08 20:29:11.000', '003_catalogue_categories.mjs'), (4, 4, '2026-11-09 08:35:48.000', '004_account_preferences.mjs');

insert into `knex_migrations_lock` (`index`, `is_locked`) values (1, 0);
