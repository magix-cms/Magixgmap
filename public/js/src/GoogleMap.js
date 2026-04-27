/**
 * @copyright MAGIX CMS Copyright (c) 2008-2026 Gerits Aurelien, http://www.gerits-aurelien.be, http://www.magix-cms.com
 * @license Dual licensed under the MIT or GPL Version 3 licenses.
 * @version 2.0 (Migration to AdvancedMarkerElement)
 * @date 17-01-2026
 * @author Aurélien Gérits <aurelien@magix-cms.com>
 * @name GoogleMap
 * @description Gestionnaire de cartes Google Maps avec support des marqueurs HTML personnalisés et itinéraires.
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
		this.map = {
			id: 'gmap_map',
			options: {
				zoom: 15,
				mapId: null, // Injecté via data-map-id
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
			directions: null,
			markers: [],
			infowindows: []
		};
		this.marker = null;
		this.markers = [];
		this.flags = [];
		this.goTo = null;
		this.goToContentString = ""; // Sauvegarde du HTML pour les directions
		this.layers = 0;

		this.options = {
			marker: {
				label: false,
				autoLabel: false
			}
		};

		if(typeof options === 'object') this.set(options);

		// Récupération dynamique du Map ID
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

	centerMap(toBounds, offsetX, offsetY) {
		let GM = this;
		let center;
		if (toBounds) {
			GM.map.instance.panToBounds(GM.map.instance.getBounds());
			center = GM.map.instance.getCenter();
		} else {
			center = GM.map.options.center;
			GM.map.instance.setZoom(GM.map.options.zoom);
		}
		let scale = Math.pow(2, GM.map.instance.getZoom());
		let worldCoordinateCenter = GM.map.instance.getProjection().fromLatLngToPoint(center);
		let pixelOffset = new GM.g.Point( (offsetX/scale) || 0,(offsetY/scale) || 0 );
		let worldCoordinateNewCenter = new GM.g.Point(worldCoordinateCenter.x - pixelOffset.x, worldCoordinateCenter.y + pixelOffset.y);
		let newCenter = GM.map.instance.getProjection().fromPointToLatLng(worldCoordinateNewCenter);
		GM.map.instance.setCenter(newCenter);
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

	hideLayer(layer) {
		if(Array.isArray(layer)) {
			layer.forEach((item) => this.hideLayer(item));
		} else {
			if(layer.setMap) layer.setMap(null);
			else layer.map = null;
		}
	}

	delDirections() {
		let GM = this;
		if (GM.map.directions !== null) {
			GM.hideMarkers(GM.flags);
			GM.map.directions.set('directions', null);
			let directions = document.getElementById('r-directions');
			if (directions) directions.classList.remove('sizedirection');
		}
		GM.showMarkers(GM.map.markers);
	}

	setDirection() {
		let GM = this;
		let dest = document.getElementById('getadress').value;

		if (dest.length > 0) {
			GM.delDirections();

			let request = {
				origin: dest,
				destination: GM.goTo.getPosition(),
				travelMode: google.maps.DirectionsTravelMode.DRIVING
			};
			let directionService = new GM.g.DirectionsService();
			directionService.route(request)
				.then((result) => {
					if (result) {
						let leg = result.routes[0].legs[0];
						let bounds = new GM.g.LatLngBounds();
						bounds.extend(leg.start_location);
						bounds.extend(leg.end_location);

						let flagsData = [
							{ pos: leg.start_location, label: 'A', color: 'grey', content: leg.start_address },
							{ pos: leg.end_location, label: 'B', color: 'main', content: GM.goToContentString }
						];

						GM.hideMarkers(GM.map.markers);

						flagsData.forEach((data, index) => {
							let iconUrl = "/"+GM.lang+"/gmap/?marker="+data.color+"&dotless=true";
							let markerEl = GM.createMarkerElement(iconUrl, data.label);
							let flag = new GM.g.Marker({
								map: GM.map.instance,
								position: data.pos,
								content: markerEl
							});
							let infowindow = new google.maps.InfoWindow({ content: data.content });
							flag.addListener('click', () => {
								infowindow.open({ map: GM.map.instance, anchor: flag });
							});
							GM.flags[index] = flag;
						});

						if (GM.map.directions === null) {
							GM.map.directions = new google.maps.DirectionsRenderer({
								preserveViewport: true,
								suppressMarkers: true
							});
						}
						GM.map.directions.setMap(GM.map.instance);
						GM.map.directions.setPanel(document.getElementById('r-directions'));
						GM.map.directions.setDirections(result);
						GM.showDirectionPanel();

						let x = document.getElementById('gmap-address').getBoundingClientRect().width;
						GM.map.instance.fitBounds(bounds,{ bottom: 0, left: x, right: 0, top: 0 });
					}
				})
				.catch((e) => { console.error("Erreur itinéraire:", e); });
		}
	}

	getDirection() {
		let GM = this;
		document.querySelector('.form-search').addEventListener('submit',(e) => {
			e.preventDefault();
			GM.setDirection();
		});

		let btn = document.querySelector('.hidepanel');
		btn.addEventListener('click',() => {
			let block = document.getElementById('gmap-address');
			btn.classList.toggle('open');
			block.classList.toggle('open');
		});

		let showform = document.getElementById('showform');
		showform.addEventListener('click',() => {
			if(showform.classList.contains('open')) {
				GM.delDirections();
				let bounds = new GM.g.LatLngBounds();
				GM.markers.forEach((m) => bounds.extend({lat: m.lat, lng: m.lng}));

				// Protection Zoom Infini
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

				let iconUrl = "/" + GM.lang + "/gmap/?marker=main";
				let labelText = null;

				if (GM.options.marker.label) {
					if (markerDetails.label && !GM.options.marker.autoLabel) {
						iconUrl += '&dotless=true';
						labelText = markerDetails.label;
					} else if (GM.options.marker.autoLabel && index > 0) {
						iconUrl += '&dotless=true';
						let i = index + 1;
						labelText = String.fromCharCode(64 + (i % 26 || 26));
					}
				}

				const markerElement = GM.createMarkerElement(iconUrl, labelText);

				let marker = new GM.g.Marker({
					map: GM.map.instance,
					position: point,
					content: markerElement,
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
				}

				infowindow.addListener('closeclick', () => GM.changeDirection(GM.map.infowindows[0]));
				marker.addListener('click', () => {
					GM.map.infowindows.forEach((iw) => iw.close());
					infowindow.open({ map: GM.map.instance, anchor: marker });
					GM.changeDirection(infowindow);
				});
			});

			// Protection Zoom Infini au chargement
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

			// Gestion clics externes
			document.querySelectorAll('.select-marker').forEach((select) => {
				select.addEventListener('click',(e) => {
					e.preventDefault();
					let i = select.dataset.marker;
					if(GM.map.markers[i]) {
						google.maps.event.trigger(GM.map.markers[i], "click");
					}
				});
			});
		}
	}

	createMarkerElement(iconUrl, labelText) {
		const container = document.createElement("div");
		container.style.position = "relative";
		const img = document.createElement("img");
		img.src = iconUrl;
		img.style.display = "block";
		container.appendChild(img);
		if (labelText) {
			const span = document.createElement("span");
			span.className = "marker-label";
			span.textContent = labelText;
			span.style.position = "absolute";
			span.style.top = "13px";
			span.style.left = "14px";
			span.style.transform = "translate(-50%, -50%)";
			span.style.pointerEvents = "none";
			container.appendChild(span);
		}
		return container;
	}
}

async function initMap() {
	const { Map } = await google.maps.importLibrary("maps");
	const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
	const { LatLngBounds, Point } = await google.maps.importLibrary("core");
	const { DirectionsService, DirectionsRenderer } = await google.maps.importLibrary("routes");

	let gMap = new GoogleMap({
		Map: Map,
		Marker: AdvancedMarkerElement,
		LatLngBounds: LatLngBounds,
		Point: Point,
		DirectionsService: DirectionsService,
		DirectionsRenderer: DirectionsRenderer
	}, configMap);
}

(g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
	key: configMap.api_key,
	v: "weekly", // Version hebdomadaire
	lang: configMap.lang
});

initMap();