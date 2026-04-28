<?php

declare(strict_types=1);

namespace Plugins\Magixgmap\db;

use App\Backend\Db\BaseDb;
use Magepattern\Component\Database\QueryBuilder;

class MagixGmapAdminDb extends BaseDb
{
    // ==========================================
    // GESTION DE LA PAGE (SEO & Textes)
    // ==========================================

    public function getPageContent(int $idLang): array
    {
        $qb = new QueryBuilder();
        $qb->select('*')
            ->from('mc_gmap_content')
            ->where('id_gmap = 1 AND id_lang = :lang', ['lang' => $idLang]);

        return $this->executeRow($qb) ?: [];
    }

    public function savePageContent(int $idLang, array $data): bool
    {
        // 1. On s'assure que la ligne parente (id_gmap = 1) existe dans la table principale
        $qbRoot = new QueryBuilder();
        $qbRoot->select('id_gmap')->from('mc_gmap')->where('id_gmap = 1');
        if (!$this->executeRow($qbRoot)) {
            $qbInsertRoot = new QueryBuilder();
            $qbInsertRoot->insert('mc_gmap', ['id_gmap' => 1]);
            $this->executeInsert($qbInsertRoot);
        }

        // 2. On vérifie si la traduction existe déjà
        $qbCheck = new QueryBuilder();
        $qbCheck->select('id_content')->from('mc_gmap_content')
            ->where('id_gmap = 1 AND id_lang = :lang', ['lang' => $idLang]);

        $exists = $this->executeRow($qbCheck);

        $qb = new QueryBuilder();
        if ($exists) {
            $qb->update('mc_gmap_content', $data)
                ->where('id_gmap = 1 AND id_lang = :lang', ['lang' => $idLang]);
            return $this->executeUpdate($qb);
        } else {
            $data['id_gmap'] = 1;
            $data['id_lang'] = $idLang;
            $qb->insert('mc_gmap_content', $data);
            return $this->executeInsert($qb);
        }
    }

    // ==========================================
    // GESTION DE LA CONFIGURATION (API KEY)
    // ==========================================

    public function getConfig(): array
    {
        $qb = new QueryBuilder();
        $qb->select('*')->from('mc_gmap_config');
        $results = $this->executeAll($qb);

        $config = [];
        if ($results) {
            foreach ($results as $row) {
                $config[$row['config_id']] = $row['config_value'];
            }
        }
        return $config;
    }

    public function saveConfig(array $data): void
    {
        foreach ($data as $key => $value) {
            $qb = new QueryBuilder();
            $qb->update('mc_gmap_config', ['config_value' => $value])
                ->where('config_id = :key', ['key' => $key]);
            $this->executeUpdate($qb);
        }
    }

    // ==========================================
    // GESTION DES ADRESSES
    // ==========================================

    public function getAddressesList(int $idLang): array
    {
        $qb = new QueryBuilder();
        $qb->select(['a.id_address', 'a.order_address', 'ac.company_address', 'ac.city_address', 'ac.published_address'])
            ->from('mc_gmap_address', 'a')
            ->leftJoin('mc_gmap_address_content', 'ac', 'a.id_address = ac.id_address AND ac.id_lang = ' . $idLang)
            ->orderBy('a.order_address', 'ASC');

        return $this->executeAll($qb) ?: [];
    }

    public function getAddressFull(int $idAddress): array
    {
        // 1. Infos principales
        $qbMain = new QueryBuilder();
        $qbMain->select('*')->from('mc_gmap_address')->where('id_address = :id', ['id' => $idAddress]);
        $address = $this->executeRow($qbMain);

        if (!$address) {
            return [];
        }

        // 2. Traductions & Données
        $qbLang = new QueryBuilder();
        $qbLang->select('*')->from('mc_gmap_address_content')->where('id_address = :id', ['id' => $idAddress]);
        $langs = $this->executeAll($qbLang);

        $address['translations'] = [];
        if ($langs) {
            foreach ($langs as $l) {
                $address['translations'][$l['id_lang']] = $l;
            }
        }

        return $address;
    }

    public function saveAddress(int $idAddress, array $mainData, array $contentData): bool
    {
        // 1. Base de l'adresse
        $qbMain = new QueryBuilder();
        if ($idAddress > 0) {
            // Mise à jour (l'ordre est géré séparément via updateAddressesOrder)
            if (!empty($mainData)) {
                $qbMain->update('mc_gmap_address', $mainData)->where('id_address = :id', ['id' => $idAddress]);
                $this->executeUpdate($qbMain);
            }
        } else {
            // Insertion d'une nouvelle adresse

            // Si mainData est vide (car on ne passe pas l'ordre à la création), on le force pour éviter l'erreur SQL
            if (empty($mainData)) {
                $mainData['order_address'] = 999; // On la place à la fin par défaut
            }

            $qbMain->insert('mc_gmap_address', $mainData);
            if ($this->executeInsert($qbMain)) {
                $idAddress = (int)$this->getLastInsertId();
            } else {
                return false;
            }
        }

        // 2. Gestion des contenus (Traductions, coordonnées GPS)
        foreach ($contentData as $idLang => $data) {
            $qbCheck = new QueryBuilder();
            $qbCheck->select('id_content')->from('mc_gmap_address_content')
                ->where('id_address = :id AND id_lang = :lang', ['id' => $idAddress, 'lang' => $idLang]);

            if ($this->executeRow($qbCheck)) {
                $qbUp = new QueryBuilder();
                $qbUp->update('mc_gmap_address_content', $data)
                    ->where('id_address = :id AND id_lang = :lang', ['id' => $idAddress, 'lang' => $idLang]);
                $this->executeUpdate($qbUp);
            } else {
                $data['id_address'] = $idAddress;
                $data['id_lang']    = $idLang;
                $qbIn = new QueryBuilder();
                $qbIn->insert('mc_gmap_address_content', $data);
                $this->executeInsert($qbIn);
            }
        }
        return true;
    }

    public function deleteAddress(int $idAddress): bool
    {
        $qb = new QueryBuilder();
        $qb->delete('mc_gmap_address')->where('id_address = :id', ['id' => $idAddress]);
        return $this->executeDelete($qb);
    }

    /**
     * Met à jour l'ordre des adresses suite à un Drag & Drop (Sortable)
     */
    public function updateAddressesOrder(array $orderedIds): bool
    {
        $success = true;
        foreach ($orderedIds as $index => $idAddress) {
            $qb = new QueryBuilder();
            $qb->update('mc_gmap_address', ['order_address' => $index])
                ->where('id_address = :id', ['id' => (int)$idAddress]);

            if (!$this->executeUpdate($qb)) {
                $success = false;
            }
        }
        return $success;
    }
}