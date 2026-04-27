{extends file="layout.tpl"}

{block name='head:title'}{if !empty($seo_title)}{$seo_title}{else}Nos Implantations{/if}{/block}
{block name='head:description'}{$seo_desc|default:''}{/block}

{block name="article:content"}

    {$breadcrumbs = [
    ['label' => (!empty($page.name_gmap)) ? $page.name_gmap : 'Nos Implantations']
    ]}
    {include file="components/breadcrumbs.tpl" breadcrumbs=$breadcrumbs}

    <header class="page-header mb-5 mt-3">
        <div class="row">
            <div class="col-12">
                <h1 class="display-4 fw-bold text-primary mb-3">
                    {$page.name_gmap|default:'Nos Implantations'}
                </h1>

                {if !empty($page.content_gmap)}
                    <div class="content-formatted text-muted">
                        {$page.content_gmap nofilter}
                    </div>
                {/if}
            </div>
        </div>
    </header>

    <section class="page-body mb-5">
        <div class="row g-4">

            <div class="col-12 col-lg-8">
                <div class="card shadow-sm border-0 h-100 overflow-hidden">
                    <div id="gmap_map" data-map-id="{$appId|default:'DEMO_MAP_ID'}" style="height: 600px; width: 100%;"></div>
                </div>
            </div>

            <aside class="col-12 col-lg-4" id="gmap-address">
                <div class="bg-body-tertiary p-4 rounded border h-100 d-flex flex-column">

                    <h2 class="h5 mb-4 fw-bold border-bottom pb-2">Liste de nos adresses</h2>

                    {* Liste des marqueurs cliquables *}
                    <div class="overflow-auto mb-4" style="max-height: 250px;">
                        <div class="list-group list-group-flush">
                            {if isset($addressesList) && $addressesList|count > 0}
                                {foreach $addressesList as $index => $addr}
                                    <a href="#" class="list-group-item list-group-item-action select-marker bg-transparent" data-marker="{$index}">
                                        <div class="d-flex w-100 justify-content-between">
                                            <h6 class="mb-1 fw-bold text-primary">{$addr.company_address}</h6>
                                        </div>
                                        <p class="mb-1 small text-muted">
                                            <i class="bi bi-geo-alt me-1"></i> {$addr.city_address}
                                        </p>
                                    </a>
                                {/foreach}
                            {else}
                                <p class="text-muted small">Aucune adresse renseignée pour le moment.</p>
                            {/if}
                        </div>
                    </div>

                    {* Bloc d'itinéraire *}
                    <div class="bg-white p-3 rounded shadow-sm border d-flex flex-column flex-grow-1">
                        <button id="showform" class="btn btn-outline-primary btn-sm w-100 mb-3">
                            <i class="bi bi-signpost-split me-1"></i> Calculer un itinéraire
                        </button>

                        <form class="form-search d-none mt-2">
                            <div class="input-group">
                                <input type="text" id="getadress" class="form-control form-control-sm" placeholder="Votre position (ex: Paris)">
                                <button type="submit" class="btn btn-primary btn-sm">Go</button>
                            </div>
                        </form>

                        <div id="address" class="mt-3 small text-muted d-none border-bottom pb-2">
                            <strong>Destination :</strong><br>
                            <span class="address"></span><br>
                            <span class="city"></span>, <span class="country"></span>
                        </div>

                        <div id="r-directions" class="mt-2 flex-grow-1 overflow-auto" style="max-height: 300px;"></div>

                        <div class="mt-2 text-center d-none">
                            <a id="openapp" href="#" class="btn btn-sm btn-link text-decoration-none">
                                <i class="bi bi-phone me-1"></i> Ouvrir dans l'application GPS
                            </a>
                        </div>
                    </div>

                </div>
            </aside>
        </div>
    </section>

{/block}

{block name="javascript_primary"}
    <script>
        const configMap = {$configMapJson nofilter};
    </script>
{/block}

{block name="javascript_data"}
    {$page_js = [
    'defer' => ['GoogleMap']
    ] scope="parent"}
{/block}

{block name="javascript" append}
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Petit script utilitaire pour afficher/masquer le formulaire d'itinéraire proprement
            const showFormBtn = document.getElementById('showform');
            const formSearch = document.querySelector('.form-search');
            const addressBlock = document.getElementById('address');
            const openAppBtn = document.getElementById('openapp').parentElement;

            if (showFormBtn && formSearch) {
                showFormBtn.addEventListener('click', function() {
                    formSearch.classList.toggle('d-none');
                    addressBlock.classList.toggle('d-none');
                    openAppBtn.classList.toggle('d-none');
                });
            }
        });
    </script>
{/block}