<?php

declare(strict_types=1);

namespace Plugins\Magixgmap\db;

use App\Frontend\Db\BaseDb;
use Magepattern\Component\Database\QueryBuilder;

class MagixGmapFrontDb extends BaseDb
{
    /**
     * Récupère les données SEO et texte de la page principale de la carte
     */
    public function getPageContent(int $idLang): array
    {
        $qb = new QueryBuilder();
        $qb->select('*')
            ->from('mc_gmap_content')
            ->where('id_gmap = 1 AND id_lang = :lang AND published_gmap = 1', ['lang' => $idLang]);

        return $this->executeRow($qb) ?: [];
    }

    /**
     * Récupère toutes les adresses actives avec leurs coordonnées pour la carte
     */
    public function getActiveAddresses(int $idLang): array
    {
        $qb = new QueryBuilder();
        $qb->select(['a.id_address', 'a.order_address', 'ac.*'])
            ->from('mc_gmap_address', 'a')
            ->join('mc_gmap_address_content', 'ac', 'a.id_address = ac.id_address')
            ->where('ac.id_lang = :lang AND ac.published_address = 1', ['lang' => $idLang])
            ->orderBy('a.order_address', 'ASC');

        return $this->executeAll($qb) ?: [];
    }

    /**
     * Récupère la configuration globale (API Key, App ID, Couleur)
     */
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
}