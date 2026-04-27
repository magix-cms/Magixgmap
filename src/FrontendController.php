<?php

declare(strict_types=1);

namespace Plugins\MagixGmap\src;

use App\Frontend\Controller\BaseController;
use Plugins\MagixGmap\db\MagixGmapFrontDb;
use Magepattern\Component\Tool\SmartyTool;

class FrontendController extends BaseController
{
    public function run(): void
    {
        SmartyTool::addTemplateDir('front', ROOT_DIR . 'plugins' . DS . 'MagixGmap' . DS . 'views' . DS . 'front');

        $action = $_GET['action'] ?? 'index';

        if ($action && $action !== 'run' && method_exists($this, $action)) {
            $this->$action();
        } else {
            $this->index();
        }
    }

    private function index(): void
    {
        $db = new MagixGmapFrontDb();
        $idLang = (int)$this->currentLang['id_lang'];
        $isoLang = $this->currentLang['iso_code'] ?? 'fr';

        // 1. Récupération des données
        $pageData = $db->getPageContent($idLang);
        $addresses = $db->getActiveAddresses($idLang);
        $config = $db->getConfig();

        // Si la page n'est pas configurée ou publiée, on affiche des infos par défaut
        if (empty($pageData)) {
            $pageData = [
                'name_gmap'    => 'Nos implantations',
                'content_gmap' => ''
            ];
            $seoTitle = 'Nos implantations';
            $seoDesc  = '';
        } else {
            $seoTitle = !empty($pageData['seo_title']) ? $pageData['seo_title'] : ($pageData['name_gmap'] ?? 'Carte');
            $seoDesc  = $pageData['seo_desc'] ?? '';
        }

        // 2. Formatage des marqueurs pour le script Vanilla JS (gmap.js)
        $markersJS = [];
        foreach ($addresses as $addr) {
            $markersJS[] = [
                'lat'      => (float)$addr['lat_address'], // Indispensable de parser en Float pour JS !
                'lng'      => (float)$addr['lng_address'],
                'company'  => $addr['company_address'],
                'address'  => $addr['address_address'],
                'postcode' => $addr['postcode_address'],
                'city'     => $addr['city_address'],
                'country'  => $addr['country_address'],
                'link'     => $addr['link_address'] ?? '',
                // Vous pouvez ajouter d'autres champs nécessaires à gmap.js
            ];
        }

        // 3. Construction de l'objet de configuration global
        $configMap = [
            'api_key'     => $config['api_key'] ?? '',
            'appId'       => !empty($config['appId']) ? $config['appId'] : 'DEMO_MAP_ID',
            'lang'        => $isoLang,
            'markerColor' => $config['markerColor'] ?? '#f3483c', // 🟢 ON AJOUTE LA COULEUR
            'markers'     => $markersJS
        ];

        // 4. Assignation à Smarty
        $this->view->assign([
            'seo_title'     => $seoTitle,
            'seo_desc'      => $seoDesc,
            'page'          => $pageData,
            'addressesList' => $addresses,
            'appId'         => !empty($config['appId']) ? $config['appId'] : 'DEMO_MAP_ID', // 🟢 Et fallback ici pour la div !
            'configMapJson' => json_encode($configMap)
        ]);

        $this->view->display('index.tpl');
    }
}