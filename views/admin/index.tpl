{extends file="layout.tpl"}

{block name='head:title'}Gestion de la Carte (Google Maps){/block}

{block name='article'}
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h1 class="h3 mb-0 text-gray-800">
            <i class="bi bi-geo-alt me-2"></i> Gestion de la Carte (Google Maps)
        </h1>
    </div>

    <div class="card shadow-sm border-0 mb-4">
        <div class="card-header bg-white p-0 border-bottom-0">
            <ul class="nav nav-tabs" id="gmapTab" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active py-3 fw-bold" id="page-tab" data-bs-toggle="tab" data-bs-target="#page_pane" type="button" role="tab">
                        <i class="bi bi-file-earmark-text me-2"></i> Contenu de la Page
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link py-3 fw-bold" id="config-tab" data-bs-toggle="tab" data-bs-target="#config_pane" type="button" role="tab">
                        <i class="bi bi-gear me-2"></i> Configuration Globale
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link py-3 fw-bold" id="addresses-tab" data-bs-toggle="tab" data-bs-target="#addresses_pane" type="button" role="tab">
                        <i class="bi bi-pin-map me-2"></i> Adresses (Marqueurs)
                        <span class="badge {if isset($addressesList) && $addressesList|count > 0}bg-primary{else}bg-secondary{/if} ms-1">
                            {if isset($addressesList)}{$addressesList|count}{else}0{/if}
                        </span>
                    </button>
                </li>
            </ul>
        </div>

        <div class="card-body p-4">
            <div class="tab-content" id="gmapTabContent">

                {* ==========================================================
                   ONGLET 1 : CONTENU DE LA PAGE (SEO & Textes)
                   ========================================================== *}
                <div class="tab-pane fade show active" id="page_pane" role="tabpanel">
                    <form id="edit_page_form" action="index.php?controller=MagixGmap&action=savePage" method="post" class="validate_form">
                        <input type="hidden" name="hashtoken" value="{$hashtoken|default:''}">

                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h5 class="mb-0 fw-bold text-primary">Textes et traductions</h5>
                            {if isset($langs)}
                                {include file="components/dropdown-lang.tpl"}
                            {/if}
                        </div>

                        <div class="tab-content">
                            {if isset($langs)}
                                {foreach $langs as $id => $iso}
                                    <fieldset role="tabpanel" class="tab-pane {if $iso@first}show active{/if}" id="lang-{$id}">

                                        <div class="row mb-3">
                                            <div class="col-md-9">
                                                <label for="name_gmap_{$id}" class="form-label fw-medium">Titre de la page (H1)</label>
                                                <input type="text" class="form-control" id="name_gmap_{$id}" name="page_content[{$id}][name_gmap]" value="{$pageData.$id.name_gmap|default:''}" />
                                            </div>
                                            <div class="col-md-3">
                                                <label class="form-label fw-medium">Statut de la page</label>
                                                <div class="form-check form-switch fs-5 mt-1">
                                                    <input type="hidden" name="page_content[{$id}][published_gmap]" value="0">
                                                    <input class="form-check-input" type="checkbox" role="switch" id="published_gmap_{$id}" name="page_content[{$id}][published_gmap]" value="1" {if ($pageData.$id.published_gmap|default:0) == 1}checked{/if} />
                                                    <label class="form-check-label fs-6 text-muted" for="published_gmap_{$id}">Publiée</label>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="mb-4">
                                            <label for="content_gmap_{$id}" class="form-label fw-medium">Texte de présentation :</label>
                                            <textarea class="form-control mceEditor" id="content_gmap_{$id}" name="page_content[{$id}][content_gmap]" rows="6">{$pageData.$id.content_gmap|default:''}</textarea>
                                        </div>

                                        <div class="accordion mb-3" id="seoAccordion_{$id}">
                                            <div class="accordion-item border-0 bg-light rounded">
                                                <h2 class="accordion-header">
                                                    <button class="accordion-button collapsed bg-transparent shadow-none fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#seo_{$id}">
                                                        <i class="bi bi-google me-2 text-primary"></i> Optimisation SEO
                                                    </button>
                                                </h2>
                                                <div id="seo_{$id}" class="accordion-collapse collapse" data-bs-parent="#seoAccordion_{$id}">
                                                    <div class="accordion-body bg-white border-top">
                                                        <div class="mb-3">
                                                            <label for="seo_url_{$id}" class="form-label d-flex justify-content-between">
                                                                URL simplifiée (Slug)
                                                                <span class="small text-muted fw-normal">Laissez vide pour générer automatiquement</span>
                                                            </label>
                                                            <input type="text" id="seo_url_{$id}" name="page_content[{$id}][seo_url]" class="form-control" value="{$pageData.$id.seo_url|default:''}" placeholder="ex: mon-super-magasin" />
                                                        </div>
                                                        <div class="mb-3">
                                                            <label for="seo_title_{$id}" class="form-label d-flex justify-content-between">
                                                                Titre SEO
                                                                <span id="count-title-{$id}" class="badge bg-success">0 / 70</span>
                                                            </label>
                                                            <input type="text" id="seo_title_{$id}" name="page_content[{$id}][seo_title]" class="form-control seo-counter" data-target="#count-title-{$id}" data-max="70" value="{$pageData.$id.seo_title|default:''}" />
                                                        </div>
                                                        <div class="mb-2">
                                                            <label for="seo_desc_{$id}" class="form-label d-flex justify-content-between">
                                                                Description SEO
                                                                <span id="count-desc-{$id}" class="badge bg-success">0 / 180</span>
                                                            </label>
                                                            <textarea id="seo_desc_{$id}" name="page_content[{$id}][seo_desc]" class="form-control seo-counter" data-target="#count-desc-{$id}" data-max="180" rows="3">{$pageData.$id.seo_desc|default:''}</textarea>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                    </fieldset>
                                {/foreach}
                            {else}
                                <div class="alert alert-warning">Aucune langue configurée.</div>
                            {/if}
                        </div>

                        <hr class="my-4">
                        <div class="d-flex justify-content-end">
                            <button class="btn btn-primary px-5" type="submit">
                                <i class="bi bi-save me-2"></i> Enregistrer la page
                            </button>
                        </div>
                    </form>
                </div>

                {* ==========================================================
                   ONGLET 2 : CONFIGURATION GLOBALE
                   ========================================================== *}
                <div class="tab-pane fade" id="config_pane" role="tabpanel">
                    <form id="edit_config_form" action="index.php?controller=MagixGmap&action=saveConfig" method="post" class="validate_form">
                        <input type="hidden" name="hashtoken" value="{$hashtoken|default:''}">

                        <div class="row mb-4 bg-light p-4 rounded border g-4">
                            <div class="col-md-6">
                                <label class="form-label fw-bold">Clé API Google Maps <span class="text-danger">*</span></label>
                                <div class="input-group">
                                    <span class="input-group-text bg-white"><i class="bi bi-key text-warning"></i></span>
                                    <input type="text" name="api_key" class="form-control" value="{$gmapConfig.api_key|default:''}" placeholder="AIzaSyB...">
                                </div>
                                <div class="form-text text-muted">Indispensable pour charger le script Google Maps.</div>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label fw-bold">Map ID (App ID) <span class="text-danger">*</span></label>
                                <div class="input-group">
                                    <span class="input-group-text bg-white"><i class="bi bi-fingerprint text-primary"></i></span>
                                    <input type="text" name="appId" class="form-control" value="{$gmapConfig.appId|default:''}" placeholder="ex: 8e0a97af9386fef">
                                </div>
                                <div class="form-text text-muted">Obligatoire pour le nouveau système "AdvancedMarkerElement".</div>
                            </div>

                            <div class="col-md-4">
                                <label class="form-label fw-bold">Couleur des marqueurs</label>
                                <div class="d-flex align-items-center">
                                    <input type="color" name="markerColor" class="form-control form-control-color border-0 p-0 me-2 shadow-sm" value="{$gmapConfig.markerColor|default:'#f3483c'}" title="Choisir la couleur" style="width: 40px; height: 40px; cursor: pointer;">
                                    <span class="small text-muted">Couleur par défaut (Hex)</span>
                                </div>
                            </div>
                        </div>

                        <hr class="my-4">
                        <div class="d-flex justify-content-end">
                            <button class="btn btn-primary px-5" type="submit">
                                <i class="bi bi-save me-2"></i> Enregistrer la configuration
                            </button>
                        </div>
                    </form>
                </div>

                {* ==========================================================
                   ONGLET 3 : LISTE DES ADRESSES (LA MAGIE DU CORE)
                   ========================================================== *}
                <div class="tab-pane fade" id="addresses_pane" role="tabpanel">

                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h5 class="mb-0 text-muted small text-uppercase fw-bold">Points sur la carte</h5>
                        <a href="index.php?controller=MagixGmap&action=add" class="btn btn-sm btn-success">
                            <i class="bi bi-plus-lg me-1"></i> Ajouter une adresse
                        </a>
                    </div>

                    {* Appel natif de table-forms ! *}
                    {include file="components/table-forms.tpl"
                    data=$addressesList
                    idcolumn="id_address"
                    sortable=true
                    activation=true
                    dlt=true
                    controller="MagixGmap"
                    }
                </div>

            </div>
        </div>
    </div>
{/block}

{block name="javascripts" append}
    <script src="{$site_url}/{$baseadmin}/templates/js/MagixFormTools.min.js?v={$smarty.now}"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            new MagixFormTools();
        });
    </script>
{/block}