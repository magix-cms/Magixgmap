/**
 * @copyright MAGIX CMS Copyright (c) 2008-2026 Gerits Aurelien, http://www.gerits-aurelien.be, http://www.magix-cms.com
 * @license Dual licensed under the MIT or GPL Version 3 licenses.
 * @version 3.2 (Fix Destination text & Routes API FieldMasks)
 * @date 27-04-2026
 * @author Aurélien Gérits <aurelien@magix-cms.com>
 * @name GoogleMap
 * @description Gestionnaire de cartes Google Maps avec support des marqueurs natifs PinElement et itinéraires V3.
 */
class GoogleMap {
	/**
	 * @param {Object} Libraries
	 * @param {Object} options
	 */
	constructor(Libraries, options) {
		this.g = Libraries;
		this.OS = null;
		this.lang = null;
		this.origin = null;
		this.markerColor = options.markerColor || '#f3483c';
		this.map = {
			id: 'gmap_map',
			options: {
				zoom: 15,
				mapId: null,
				mapTypeControl: true,
				mapTypeControlOptions: {
					style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
					position: google.maps.ControlPosition.TOP_RIGHT
				},
				navigationControl: true,
				panControl: true,
				scrollwheel: false,
				streetViewControl: true
			},
			instance: null,
			polylines: [],
			markers: [],
			infowindows: []
		};
		this.marker = null;
		this.markers = [];
		this.flags = [];
		this.goTo = null;
		this.goToContentString = "";
		this.layers = 0;

		this.options = {
			marker: {
				label: false,
				autoLabel: false
			}
		};

		if(typeof options === 'object') this.set(options);

		const mapContainer = document.getElementById(this.map.id);
		if (mapContainer && mapContainer.dataset.mapId) {
			this.map.options.mapId = mapContainer.dataset.mapId;
		} else if (!this.map.options.mapId) {
			console.warn("GoogleMap: mapId manquant, utilisation de DEMO_MAP_ID");
			this.map.options.mapId = "DEMO_MAP_ID";
		}

		if(this.markers.length > 0) this.init();
	}

	set(options) {
		let instance = this;
		for (var key in options) {
			if (options.hasOwnProperty(key)) instance[key] = options[key];
		}
	}

	getAddressInfos(content) {
		var newC = { company: '', address: '', city: '', country: '' };
		if (!content || typeof content !== 'string') return newC;

		let parts = content.split('<br />');
		newC.company = parts[0];
		newC.address = parts[1] || '';
		if(parts[2]) {
			let loc = parts[2].split(', ');
			newC.city = loc[0] || '';
			newC.country = loc[1] || '';
		}
		return newC;
	}

	changeDirection(infowindow) {
		let GM = this;
		GM.goTo = infowindow;
		let content = GM.getAddressInfos(infowindow.getContent());
		let pos = infowindow.getPosition();

		document.querySelector('#address .address').textContent = content.address;
		document.querySelector('#address .city').textContent = content.city;
		document.querySelector('#address .country').textContent = content.country;

		let lat = typeof pos.lat === 'function' ? pos.lat() : pos.lat;
		let lng = typeof pos.lng === 'function' ? pos.lng() : pos.lng;

		let href = (GM.OS === 'IOS' ? 'http://maps.apple.com/maps?ll=' : 'geo:') + lat + ',' + lng + '?q=' + encodeURIComponent(content.address + ',' + content.city + ',' + content.country);
		document.getElementById('openapp').setAttribute('href', href);
	}

	showDirectionPanel() {
		let directions = document.getElementById('r-directions');
		if (directions) {
			directions.classList.add('sizedirection');
		}
	}

	showMarkers(markers) {
		let map = this.map.instance;
		for (let i = 0; i < markers.length; i++) {
			markers[i].map = map;
		}
	}

	hideMarkers(markers) {
		for (let i = 0; i < markers.length; i++) {
			markers[i].map = null;
		}
	}

	delDirections() {
		let GM = this;
		if (GM.map.polylines && GM.map.polylines.length > 0) {
			GM.map.polylines.forEach(p => p.setMap(null));
			GM.map.polylines = [];
		}
		GM.hideMarkers(GM.flags);

		let directions = document.getElementById('r-directions');
		if (directions) {
			directions.classList.remove('sizedirection');
			directions.innerHTML = '';
		}
		GM.showMarkers(GM.map.markers);
	}

	setDirection() {
		let GM = this;
		let dest = document.getElementById('getadress').value;

		if (dest.length > 0) {
			GM.delDirections();

			// 🟢 1. CORRECTION : On utilise '*' pour garantir que TOUS les champs (dont les textes) sont renvoyés
			let request = {
				origin: dest,
				destination: GM.goTo.getPosition(),
				travelMode: 'DRIVING',
				fields: ['*']
			};

			GM.g.Route.computeRoutes(request)
				.then((result) => {
					if (result.routes && result.routes.length > 0) {
						let route = result.routes[0];
						let leg = route.legs[0];

						GM.hideMarkers(GM.map.markers);

						// 🟢 2. CORRECTION : Dans l'API JS, c'est directement l'objet de coordonnées !
						let startPos = leg.startLocation;
						let endPos = leg.endLocation;

						let flagsData = [
							{ pos: startPos, label: 'A', color: '#808080', content: dest },
							{ pos: endPos, label: 'B', color: GM.markerColor, content: GM.goToContentString }
						];

						flagsData.forEach((data, index) => {
							let pin = new GM.g.PinElement({
								background: data.color,
								glyphColor: 'white',
								borderColor: '#ffffff'
							});
							if (data.label) pin.glyphText = data.label;

							let flag = new GM.g.Marker({
								map: GM.map.instance,
								position: data.pos,
								content: pin
							});

							let infowindow = new google.maps.InfoWindow({ content: data.content });
							flag.addListener('gmp-click', () => {
								infowindow.open({ map: GM.map.instance, anchor: flag });
							});
							GM.flags[index] = flag;
						});

						GM.map.polylines = route.createPolylines();
						GM.map.polylines.forEach(polyline => polyline.setMap(GM.map.instance));

						const panel = document.getElementById('r-directions');
						if (panel) {
							panel.innerHTML = '<h6 class="fw-bold px-3 pt-3 mb-2 text-primary border-bottom pb-2">Détail de l\'itinéraire</h6>';
							let list = document.createElement('ol');
							list.className = "list-group list-group-flush list-group-numbered mb-3 shadow-sm";

							if (leg.steps) {
								leg.steps.forEach(step => {
									let li = document.createElement('li');
									li.className = "list-group-item bg-transparent text-muted small py-2 ms-2 me-2 border-bottom";

									// 🟢 3. CORRECTION : Le vrai chemin pour extraire le texte d'instruction de Google
									li.innerHTML = step.navigationInstruction?.instructions || step.instructions || "Continuer sur l'itinéraire.";

									list.appendChild(li);
								});
							}
							panel.appendChild(list);
						}

						GM.showDirectionPanel();

						let x = document.getElementById('gmap-address').getBoundingClientRect().width;
						GM.map.instance.fitBounds(route.viewport, { bottom: 0, left: x, right: 0, top: 0 });
					}
				})
				.catch((e) => { console.error("Erreur itinéraire:", e); });
		}
	}

	getDirection() {
		let GM = this;
		const form = document.querySelector('.form-search');
		if(form) {
			form.addEventListener('submit', (e) => {
				e.preventDefault();
				GM.setDirection();
			});
		}

		let btn = document.querySelector('.hidepanel');
		if (btn) {
			btn.addEventListener('click',() => {
				let block = document.getElementById('gmap-address');
				btn.classList.toggle('open');
				block.classList.toggle('open');
			});
		}

		let showform = document.getElementById('showform');
		if(showform) {
			showform.addEventListener('click',() => {
				if(showform.classList.contains('open')) {
					GM.delDirections();
					let bounds = new GM.g.LatLngBounds();
					GM.markers.forEach((m) => bounds.extend({lat: m.lat, lng: m.lng}));

					if (GM.markers.length > 1) {
						GM.map.instance.fitBounds(bounds);
					} else if (GM.markers.length === 1) {
						GM.map.instance.setCenter({lat: GM.markers[0].lat, lng: GM.markers[0].lng});
						GM.map.instance.setZoom(GM.map.options.zoom);
					}
					document.getElementById('getadress').value = '';
				}
				showform.classList.toggle('open');
			});
		}
	}

	init() {
		let GM = this;
		if (GM.markers.length > 0) {
			GM.origin = {
				OriginContent : GM.markers[0].company,
				OriginAddress : GM.markers[0].address,
				OriginCity : GM.markers[0].postcode + ' ' + GM.markers[0].city,
				OriginCountry : GM.markers[0].country,
				OriginPosition : {lat: GM.markers[0].lat, lng: GM.markers[0].lng},
				OriginRoute: 1,
				OriginMarker: null
			};

			GM.map.options['center'] = {lat: GM.markers[0].lat, lng: GM.markers[0].lng};
			GM.map.instance = new GM.g.Map(document.getElementById(GM.map.id), GM.map.options);

			let bounds = new GM.g.LatLngBounds();

			GM.markers.forEach((markerDetails, index) => {
				let company = (markerDetails.link === '' || markerDetails.link === null) ? markerDetails.company : '<a href="'+markerDetails.link+'">'+markerDetails.company+'</a>';
				let point = {lat: markerDetails.lat, lng: markerDetails.lng};

				let labelText = null;
				if (GM.options.marker.label) {
					if (markerDetails.label && !GM.options.marker.autoLabel) {
						labelText = markerDetails.label;
					} else if (GM.options.marker.autoLabel && index > 0) {
						let i = index + 1;
						labelText = String.fromCharCode(64 + (i % 26 || 26));
					}
				}

				let pin = new GM.g.PinElement({
					background: GM.markerColor,
					glyphColor: 'white',
					borderColor: '#ffffff'
				});
				if (labelText) pin.glyphText = labelText;

				let marker = new GM.g.Marker({
					map: GM.map.instance,
					position: point,
					content: pin,
					title: markerDetails.company
				});

				bounds.extend(point);

				let contentString = company +'<br />'+markerDetails.address+'<br />'+markerDetails.postcode+' '+markerDetails.city+', '+markerDetails.country;
				let infowindow = new google.maps.InfoWindow({ content: contentString });

				GM.map.infowindows[index] = infowindow;
				GM.map.markers[index] = marker;

				if (index === 0) {
					GM.goTo = infowindow;
					GM.goToContentString = contentString;
					GM.origin.OriginMarker = marker;
					infowindow.open({ map: GM.map.instance, anchor: marker });
					// 🟢 CORRECTION : On force le remplissage des textes "Destination" au chargement
					GM.changeDirection(infowindow);
				}

				infowindow.addListener('closeclick', () => GM.changeDirection(GM.map.infowindows[0]));

				marker.addListener('gmp-click', () => {
					GM.map.infowindows.forEach((iw) => iw.close());
					infowindow.open({ map: GM.map.instance, anchor: marker });
					GM.changeDirection(infowindow);
				});
			});

			if(GM.map.markers.length > 1) {
				GM.map.instance.fitBounds(bounds);
			} else {
				GM.map.instance.setZoom(GM.map.options.zoom);
			}

			if(GM.origin.OriginRoute && GM.goTo !== null) GM.getDirection();

			if(GM.map.options.streetViewControl) {
				let stv = GM.map.instance.getStreetView();
				google.maps.event.addListener(stv, 'visible_changed', () => {
					let v = stv.getVisible();
					let el = document.getElementById('gmap-address');
					if(el) { el.style.opacity = v ? '0' : '1'; el.style.visibility = v ? 'hidden' : 'visible'; }
				});
			}

			document.querySelectorAll('.select-marker').forEach((select) => {
				select.addEventListener('click', (e) => {
					e.preventDefault();
					let i = select.dataset.marker;
					if(GM.map.markers[i]) {
						google.maps.event.trigger(GM.map.markers[i], "gmp-click");
					}
				});
			});
		}
	}
}

async function initMap() {
	const { Map } = await google.maps.importLibrary("maps");
	const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");
	const { LatLngBounds, Point } = await google.maps.importLibrary("core");
	const { Route } = await google.maps.importLibrary("routes");

	let gMap = new GoogleMap({
		Map: Map,
		Marker: AdvancedMarkerElement,
		PinElement: PinElement,
		LatLngBounds: LatLngBounds,
		Point: Point,
		Route: Route,
		markerColor: configMap.markerColor || '#f3483c'
	}, configMap);
}

(g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
	key: configMap.api_key,
	v: "weekly",
	lang: configMap.lang
});

initMap();