CREATE TABLE IF NOT EXISTS `mc_gmap` (
    `id_gmap` int UNSIGNED NOT NULL AUTO_INCREMENT,
    `date_register` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id_gmap`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `mc_gmap_content` (
    `id_content` int UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_gmap` int UNSIGNED NOT NULL,
    `id_lang` smallint UNSIGNED NOT NULL,
    `name_gmap` varchar(200) COLLATE utf8mb4_general_ci DEFAULT NULL,
    `content_gmap` text COLLATE utf8mb4_general_ci,
    `seo_url` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Slug de la page',
    `seo_title` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
    `seo_desc` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
    `published_gmap` tinyint(1) NOT NULL DEFAULT '0',
    `last_update` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id_content`),
    KEY `id_gmap` (`id_gmap`),
    KEY `id_lang` (`id_lang`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `mc_gmap_address` (
    `id_address` int UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_address` smallint UNSIGNED NOT NULL DEFAULT '0',
    `date_register` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id_address`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `mc_gmap_address_content` (
    `id_content` int UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_address` int UNSIGNED NOT NULL,
    `id_lang` smallint UNSIGNED NOT NULL,
    `company_address` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
    `content_address` text COLLATE utf8mb4_general_ci,
    `address_address` varchar(200) COLLATE utf8mb4_general_ci NOT NULL,
    `postcode_address` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
    `city_address` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
    `country_address` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
    `phone_address` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
    `mobile_address` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
    `fax_address` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
    `email_address` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
    `vat_address` varchar(80) COLLATE utf8mb4_general_ci DEFAULT NULL,
    `lat_address` decimal(10,8) NOT NULL COMMENT 'Latitude précise',
    `lng_address` decimal(11,8) NOT NULL COMMENT 'Longitude précise',
    `link_address` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
    `blank_address` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Ouverture lien dans un nouvel onglet',
    `published_address` tinyint(1) NOT NULL DEFAULT '0',
    `last_update` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id_content`),
    KEY `id_lang` (`id_lang`),
    KEY `id_address` (`id_address`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `mc_gmap_config` (
    `id_gmap_config` int UNSIGNED NOT NULL AUTO_INCREMENT,
    `config_id` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
    `config_value` text COLLATE utf8mb4_general_ci,
    PRIMARY KEY (`id_gmap_config`),
    UNIQUE KEY `idx_config_id` (`config_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO `mc_gmap_config` (`config_id`, `config_value`) VALUES
('markerColor', '#f3483c'),
('api_key', ''),
('appId', '');

ALTER TABLE `mc_gmap_content`
    ADD CONSTRAINT `fk_gmap_content_gmap` FOREIGN KEY (`id_gmap`) REFERENCES `mc_gmap` (`id_gmap`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `mc_gmap_address_content`
    ADD CONSTRAINT `fk_gmap_address_content_address` FOREIGN KEY (`id_address`) REFERENCES `mc_gmap_address` (`id_address`) ON DELETE CASCADE ON UPDATE CASCADE;