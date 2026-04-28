<?php

declare(strict_types=1);

namespace Plugins\Magixgmap\src;

use App\Backend\Controller\BaseController;
use Plugins\Magixgmap\db\MagixGmapAdminDb;
use Magepattern\Component\HTTP\Request;
use Magepattern\Component\Tool\FormTool;
use Magepattern\Component\Tool\SmartyTool;
use Magepattern\Component\HTTP\Url; // 🟢 AJOUT : Indispensable pour nettoyer les URL (slugs)

class BackendController extends BaseController
{
    public function run(): void
    {
        SmartyTool::addTemplateDir('admin', ROOT_DIR . 'plugins' . DS . 'MagixGmap' . DS . 'views' . DS . 'admin');

        $action = $_GET['action'] ?? 'index';

        // Interception native de table-forms.tpl (bouton crayon)
        if (isset($_GET['edit'])) {
            $action = 'edit';
        }

        if ($action === 'savePage' && Request::isMethod('POST')) {
            $this->processSavePage();
            return;
        }

        if ($action === 'saveAddress' && Request::isMethod('POST')) {
            $this->processSaveAddress();
            return;
        }

        if ($action === 'saveConfig' && Request::isMethod('POST')) {
            $this->processSaveConfig();
            return;
        }

        if ($action && $action !== 'run' && method_exists($this, $action)) {
            $this->$action();
            return;
        }

        $this->index();
    }

    public function index(): void
    {
        $db = new MagixGmapAdminDb();
        $idLangDefault = (int)($this->defaultLang['id_lang'] ?? 1);

        $langs = $db->fetchLanguages();
        $config = $db->getConfig();
        $rawAddressesList = $db->getAddressesList($idLangDefault);

        $pageData = [];
        foreach ($langs as $idLang => $iso) {
            $pageData[$idLang] = $db->getPageContent((int)$idLang);
        }

        $configMap = [
            'api_key' => $config['api_key'] ?? '',
            'appId'   => $config['appId'] ?? '',
            'lang'    => $this->defaultLang['iso_code'] ?? 'fr'
        ];

        $targetColumns = ['id_address', 'company_address', 'city_address', 'published_address'];

        $rawScheme = array_merge(
            $db->getTableScheme('mc_gmap_address'),
            $db->getTableScheme('mc_gmap_address_content')
        );

        $associations = [
            'id_address'        => ['title' => 'id', 'type' => 'text', 'class' => 'text-center text-muted small px-2'],
            'company_address'   => ['title' => 'Entreprise / Nom', 'type' => 'text', 'class' => 'fw-bold'],
            'city_address'      => ['title' => 'Ville', 'type' => 'text', 'class' => ''],
            'published_address' => ['title' => 'Statut', 'type' => 'bin', 'class' => 'text-center px-3', 'enum' => 'published_']
        ];

        $this->getScheme($rawScheme, $targetColumns, $associations);
        $this->getItems('addressesList', $rawAddressesList, true);

        $sessionToken = $this->session->getToken();

        $this->view->assign([
            'langs'         => $langs,
            'gmapConfig'    => $config,
            'pageData'      => $pageData,
            'configMapJson' => json_encode($configMap),
            'hashtoken'     => $sessionToken,
            'url_token'     => urlencode($sessionToken)
        ]);

        $this->view->display('index.tpl');
    }

    public function add(): void
    {
        $db = new MagixGmapAdminDb();
        $config = $db->getConfig();

        $configMap = [
            'api_key' => $config['api_key'] ?? '',
            'lang'    => $this->defaultLang['iso_code'] ?? 'fr'
        ];

        $this->view->assign([
            'langs'         => $db->fetchLanguages(),
            'address'       => ['id_address' => 0],
            'configMapJson' => json_encode($configMap),
            'hashtoken'     => $this->session->getToken()
        ]);

        $this->view->display('form_address.tpl');
    }

    public function edit(): void
    {
        $idAddress = (int)($_GET['edit'] ?? 0);
        $db = new MagixGmapAdminDb();

        $address = $db->getAddressFull($idAddress);

        if (empty($address)) {
            header('Location: index.php?controller=MagixGmap');
            exit;
        }

        $config = $db->getConfig();
        $configMap = [
            'api_key' => $config['api_key'] ?? '',
            'lang'    => $this->defaultLang['iso_code'] ?? 'fr'
        ];

        $this->view->assign([
            'langs'         => $db->fetchLanguages(),
            'address'       => $address,
            'configMapJson' => json_encode($configMap),
            'hashtoken'     => $this->session->getToken()
        ]);

        $this->view->display('form_address.tpl');
    }

    // =========================================================
    // TRAITEMENTS POST / AJAX (Appelés nativement par le CMS)
    // =========================================================

    public function delete(): void
    {
        if (ob_get_length()) ob_clean();

        $rawToken = $_POST['hashtoken'] ?? $_GET['hashtoken'] ?? $_POST['token'] ?? $_GET['token'] ?? '';
        $token = str_replace(' ', '+', $rawToken);

        if (!$this->session->validateToken($token)) {
            echo $this->json->encode(['success' => false, 'message' => 'Token invalide.']);
            exit;
        }

        $id = $_GET['id'] ?? $_POST['id'] ?? null;
        $ids = $_POST['ids'] ?? $_GET['ids'] ?? ($id ? [$id] : []);
        $cleanIds = array_filter(array_map('intval', (array)$ids));

        if (!empty($cleanIds)) {
            $db = new MagixGmapAdminDb();
            $successCount = 0;

            foreach ($cleanIds as $idAddress) {
                if ($db->deleteAddress($idAddress)) {
                    $successCount++;
                }
            }

            if ($successCount > 0) {
                $msg = $successCount > 1 ? 'Les adresses ont été supprimées.' : 'L\'adresse a été supprimée.';
                echo $this->json->encode(['success' => true, 'message' => $msg, 'ids' => $cleanIds]);
                exit;
            }
        }

        echo $this->json->encode(['success' => false, 'message' => 'Aucune adresse sélectionnée ou erreur.']);
        exit;
    }

    public function reorder(): void
    {
        if (ob_get_length()) ob_clean();

        $rawToken = $_GET['hashtoken'] ?? '';
        $token = str_replace(' ', '+', $rawToken);

        if (!$this->session->validateToken($token)) {
            echo $this->json->encode(['success' => false, 'message' => 'Token invalide']);
            exit;
        }

        $input = file_get_contents('php://input');
        $data = json_decode($input, true);

        if (isset($data['order']) && is_array($data['order'])) {
            $db = new MagixGmapAdminDb();
            if ($db->updateAddressesOrder($data['order'])) {
                echo $this->json->encode(['success' => true, 'message' => 'Ordre mis à jour avec succès.']);
                exit;
            }
        }

        echo $this->json->encode(['success' => false, 'message' => 'Données invalides.']);
        exit;
    }

    private function processSavePage(): void
    {
        $token = $_POST['hashtoken'] ?? '';
        if (!$this->session->validateToken($token)) {
            $this->jsonResponse(false, 'Session expirée.');
        }

        $db = new MagixGmapAdminDb();

        if (isset($_POST['page_content']) && is_array($_POST['page_content'])) {
            foreach ($_POST['page_content'] as $idLang => $data) {

                // 🟢 NOUVEAU : Traitement intelligent de l'URL SEO (Slug)
                $title = $data['name_gmap'] ?? '';
                $userUrl = $data['seo_url'] ?? '';

                // Magie de Magix : Si vide on prend le titre, sinon on nettoie ce qui a été tapé
                $finalSeoUrl = empty($userUrl) ? Url::clean($title) : Url::clean($userUrl);

                $cleanData = [
                    'name_gmap'      => FormTool::simpleClean($title),
                    'content_gmap'   => $data['content_gmap'] ?? '',
                    'seo_title'      => FormTool::simpleClean($data['seo_title'] ?? ''),
                    'seo_desc'       => FormTool::simpleClean($data['seo_desc'] ?? ''),
                    'seo_url'        => $finalSeoUrl, // Sauvegarde de l'URL formatée
                    'published_gmap' => isset($data['published_gmap']) ? 1 : 0
                ];
                $db->savePageContent((int)$idLang, $cleanData);
            }
        }

        $this->jsonResponse(true, 'La page a été enregistrée avec succès.', ['type' => 'update']);
    }

    private function processSaveAddress(): void
    {
        $token = $_POST['hashtoken'] ?? '';
        if (!$this->session->validateToken($token)) {
            $this->jsonResponse(false, 'Session expirée.');
        }

        $db = new MagixGmapAdminDb();
        $idAddress = (int)($_POST['id_address'] ?? 0);

        $contentData = [];
        if (isset($_POST['address_content']) && is_array($_POST['address_content'])) {
            foreach ($_POST['address_content'] as $idLang => $c) {
                $lat = str_replace(',', '.', (string)($c['lat_address'] ?? '0'));
                $lng = str_replace(',', '.', (string)($c['lng_address'] ?? '0'));

                $contentData[$idLang] = [
                    'company_address'  => FormTool::simpleClean($c['company_address'] ?? ''),
                    'content_address'  => $c['content_address'] ?? '',
                    'address_address'  => FormTool::simpleClean($c['address_address'] ?? ''),
                    'postcode_address' => FormTool::simpleClean($c['postcode_address'] ?? ''),
                    'city_address'     => FormTool::simpleClean($c['city_address'] ?? ''),
                    'country_address'  => FormTool::simpleClean($c['country_address'] ?? ''),
                    'phone_address'    => FormTool::simpleClean($c['phone_address'] ?? ''),
                    'email_address'    => FormTool::simpleClean($c['email_address'] ?? ''),
                    'link_address'     => FormTool::simpleClean($c['link_address'] ?? ''),
                    'lat_address'      => (float)$lat,
                    'lng_address'      => (float)$lng,
                    'published_address'=> isset($c['published_address']) ? 1 : 0
                ];
            }
        }

        if ($db->saveAddress($idAddress, [], $contentData)) {
            $this->jsonResponse(true, 'Adresse enregistrée avec succès.', [
                'redirect_url' => 'index.php?controller=MagixGmap'
            ]);
        } else {
            $this->jsonResponse(false, 'Erreur lors de l\'enregistrement de l\'adresse.');
        }
    }

    private function processSaveConfig(): void
    {
        $token = $_POST['hashtoken'] ?? '';
        if (!$this->session->validateToken($token)) {
            $this->jsonResponse(false, 'Session expirée.');
        }

        $db = new MagixGmapAdminDb();

        $configData = [
            'api_key'     => FormTool::simpleClean($_POST['api_key'] ?? ''),
            'appId'       => FormTool::simpleClean($_POST['appId'] ?? ''),
            'markerColor' => FormTool::simpleClean($_POST['markerColor'] ?? '#f3483c')
        ];

        $db->saveConfig($configData);
        $this->jsonResponse(true, 'Configuration mise à jour avec succès.', ['type' => 'update']);
    }
}