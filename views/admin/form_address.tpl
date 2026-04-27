{extends file="layout.tpl"}

{block name='head:title'}{if $address.id_address > 0}Modifier{else}Ajouter{/if} une adresse{/block}

{block name='article'}
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h1 class="h3 mb-0 text-gray-800">
            <i class="bi bi-geo-alt me-2"></i> {if $address.id_address > 0}Modifier{else}Ajouter{/if} une adresse
        </h1>
        <a href="index.php?controller=MagixGmap" class="btn btn-outline-secondary btn-sm">
            <i class="bi bi-arrow-left"></i> Retour au module
        </a>
    </div>

    <div class="card shadow-sm border-0 mb-4">
        <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
            <h6 class="m-0 fw-bold text-primary">Informations du marqueur</h6>
            {if isset($langs)}
                {include file="components/dropdown-lang.tpl"}
            {/if}
        </div>

        <div class="card-body p-4">
            <form id="address_form" action="index.php?controller=MagixGmap&action=saveAddress" method="post" class="validate_form {if $address.id_address == 0}add_form{/if}">
                <input type="hidden" name="hashtoken" value="{$hashtoken|default:''}">
                <input type="hidden" name="id_address" value="{$address.id_address|default:0}">

                <div class="tab-content" id="lang-tab-content">
                    {if isset($langs)}
                        {foreach $langs as $id => $iso}
                            {* ATTENTION : La classe .tab-pane est ciblée par gmapdetect.js *}
                            <div class="tab-pane fade {if $iso@first}show active{/if}" id="lang-{$id}" role="tabpanel">

                                <div class="row mb-3">
                                    <div class="col-md-9">
                                        <label class="form-label fw-medium">Nom de l'entreprise / Lieu ({$iso|upper}) <span class="text-danger">*</span></label>
                                        <input type="text" name="address_content[{$id}][company_address]" class="form-control" value="{$address.translations.$id.company_address|default:''}" {if $iso@first}required{/if}>
                                    </div>
                                    <div class="col-md-3">
                                        <label class="form-label fw-medium">Statut</label>
                                        <div class="form-check form-switch mt-1 fs-5">
                                            <input type="hidden" name="address_content[{$id}][published_address]" value="0">
                                            <input class="form-check-input" type="checkbox" role="switch" id="status_{$id}" name="address_content[{$id}][published_address]" value="1" {if ($address.translations.$id.published_address|default:1) == 1}checked{/if}>
                                        </div>
                                    </div>
                                </div>

                                <h6 class="fw-bold mt-4 mb-3 border-bottom pb-2 text-secondary"><i class="bi bi-map"></i> Coordonnées (Détection automatique)</h6>

                                <div class="row g-3 mb-3">
                                    <div class="col-12">
                                        <label class="form-label">Rue et numéro</label>
                                        <input type="text" name="address_content[{$id}][address_address]" class="form-control address" value="{$address.translations.$id.address_address|default:''}">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Code postal</label>
                                        <input type="text" name="address_content[{$id}][postcode_address]" class="form-control postcode" value="{$address.translations.$id.postcode_address|default:''}">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Ville</label>
                                        <input type="text" name="address_content[{$id}][city_address]" class="form-control city" value="{$address.translations.$id.city_address|default:''}">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Pays</label>
                                        <input type="text" name="address_content[{$id}][country_address]" class="form-control country" value="{$address.translations.$id.country_address|default:''}">
                                    </div>
                                </div>

                                <div class="row g-3 mb-4 p-3 bg-light rounded border border-success border-opacity-25">
                                    <div class="col-md-6">
                                        <label class="form-label text-success fw-bold"><i class="bi bi-geo-alt-fill"></i> Latitude</label>
                                        <input type="text" name="address_content[{$id}][lat_address]" class="form-control lat" value="{$address.translations.$id.lat_address|default:''}">
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label text-success fw-bold"><i class="bi bi-geo-alt-fill"></i> Longitude</label>
                                        <input type="text" name="address_content[{$id}][lng_address]" class="form-control lng" value="{$address.translations.$id.lng_address|default:''}">
                                    </div>
                                </div>

                                <h6 class="fw-bold mt-4 mb-3 border-bottom pb-2 text-secondary"><i class="bi bi-info-circle"></i> Informations de contact</h6>

                                <div class="row g-3 mb-3">
                                    <div class="col-md-4">
                                        <label class="form-label">Téléphone</label>
                                        <input type="text" name="address_content[{$id}][phone_address]" class="form-control" value="{$address.translations.$id.phone_address|default:''}">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Email</label>
                                        <input type="email" name="address_content[{$id}][email_address]" class="form-control" value="{$address.translations.$id.email_address|default:''}">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Lien externe</label>
                                        <input type="text" name="address_content[{$id}][link_address]" class="form-control" value="{$address.translations.$id.link_address|default:''}">
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label fw-medium">Description libre :</label>
                                    <textarea class="form-control" name="address_content[{$id}][content_address]" rows="3">{$address.translations.$id.content_address|default:''}</textarea>
                                </div>

                            </div>
                        {/foreach}
                    {/if}
                </div>

                <hr class="my-4">
                <div class="d-flex justify-content-end">
                    <button class="btn btn-primary px-5" type="submit">
                        <i class="bi bi-save me-2"></i> Enregistrer
                    </button>
                </div>
            </form>
        </div>
    </div>
{/block}

{block name="javascripts" append}
    <script>
        // Injection pour gmapdetect.js
        const configMap = {$configMapJson nofilter};
    </script>
    <script src="{$site_url}/{$baseadmin}/templates/js/GoogleMapDetect.min.js?v={$smarty.now}"></script>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            if (typeof initMap === "function") {
                initMap();
            }
        });
    </script>
{/block}