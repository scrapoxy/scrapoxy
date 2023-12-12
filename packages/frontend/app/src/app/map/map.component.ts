import {
    Component,
    ElementRef,
    Inject,
    ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
    EEventScope,
    EProxyStatus,
    isProxyOnline,
    ProxiesSynchronizedEvent,
} from '@scrapoxy/common';
import {
    CommanderFrontendClientService,
    EventsService,
    getCountryName,
    ProjectCurrentService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import jsVectorMap from 'jsvectormap';
import 'jsvectormap/dist/maps/world';
import { Subscription } from 'rxjs';
import type {
    AfterViewInit,
    OnDestroy,
    OnInit,
} from '@angular/core';
import type {
    ICommanderFrontendClient,
    IFingerprint,
    IProxyBase,
    ISynchronizeLocalProxiesBase,
} from '@scrapoxy/common';


interface IMarker {
    name: string;
    coords: number[];
    style: {
        fill: string;
    };
    proxy: IProxyBase;
}


function getTooltipContent(proxy: IProxyBase): string {
    const fingerprint = proxy.fingerprint as IFingerprint;
    let content = '<div class="fp-tooltip">';
    content += `<div class="fp-row"><div class="fp-title">IP:</div><div class="fp-content">${fingerprint.ip}</div></div>`;

    if (fingerprint.asnNetwork) {
        content += `<div class="fp-row"><div class="fp-title">Network:</div><div class="fp-content">${fingerprint.asnNetwork}</div></div>`;
    }

    if (fingerprint.asnName) {
        content += `<div class="fp-row"><div class="fp-title">ASN:</div><div class="fp-content">${fingerprint.asnName}</div></div>`;
    }

    if (fingerprint.continentName) {
        content += `<div class="fp-row"><div class="fp-title">Zone:</div><div class="fp-content">${fingerprint.continentName} (${fingerprint.continentCode})</div></div>`;
    }

    if (fingerprint.countryName) {
        content += `<div class="fp-row"><div class="fp-title">Zone:</div><div class="fp-content">${fingerprint.countryName} (${fingerprint.countryCode})</div></div>`;
    }

    if (fingerprint.cityName) {
        content += `<div class="fp-row"><div class="fp-title">City:</div><div class="fp-content">${fingerprint.cityName}</div></div>`;
    }

    if (fingerprint.timezone) {
        content += `<div class="fp-row"><div class="fp-title">TZ:</div><div class="fp-content">${fingerprint.timezone}</div></div>`;
    }

    content += '</div>';

    return content;
}


function getStatusColor(proxy: IProxyBase): string {
    if (proxy.status === EProxyStatus.ERROR) {
        return '#fc1a6d';
    }

    if (isProxyOnline(proxy)) {
        return '#74c12f';
    } else {
        return '#f9d76e';
    }
}


interface ICounter {
    name: string;
    count: number;
}


class ListByName {
    private readonly items = new Map<string, string[]>();

    private readonly labels = new Map<string, string>();

    get size() {
        return this.items.size;
    }

    top(count: number): ICounter[] {
        const counters: ICounter[] = [];

        for (const [
            name, ids,
        ] of this.items.entries()) {
            counters.push({
                name: this.labels.get(name) ?? name,
                count: ids.length,
            });
        }

        counters.sort((
            a, b
        ) => {
            const diff = b.count - a.count;

            if (diff !== 0) {
                return diff;
            }

            return a.name.localeCompare(b.name);
        });

        return counters.slice(
            0,
            count
        );
    }

    add(
        name: string, nameLabel: string, id: string, action?: (name: string) => void
    ) {
        const ids = this.items.get(name);

        if (ids) {
            ids.push(id);
        } else {
            this.items.set(
                name,
                [
                    id,
                ]
            );

            if (action) {
                action(name);
            }
        }

        this.labels.set(
            name,
            nameLabel
        );
    }

    remove(
        id: string, action?: (name: string) => void
    ) {
        const itemsToRemove: string[] = [];

        for (const [
            name, ids,
        ] of this.items.entries()) {
            const index = ids.indexOf(id);

            if (index >= 0) {
                ids.splice(
                    index,
                    1
                );

                if (ids.length <= 0) {
                    itemsToRemove.push(name);
                }
            }
        }

        while (itemsToRemove.length > 0) {
            const name = itemsToRemove.pop() as string;
            this.items.delete(name);
            this.labels.delete(name);

            if (action) {
                action(name);
            }
        }
    }
}


const REGION_DEFAULT_COLOR = '#dfdfdf';
const REGION_PROXIES_COLOR = '#c2e4b3';


@Component({
    templateUrl: 'map.component.html',
    styleUrls: [
        './map.component.scss',
    ],
})
export class MapComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild('fullscreen') fullscreenElement: ElementRef;

    projectId: string;

    projectName = '';

    proxiesByConnectors = new ListByName();

    proxiesByCountries = new ListByName();

    proxiesByCities = new ListByName();

    proxiesByAsns = new ListByName();

    private readonly listener: () => void;

    private map: any;

    private readonly markersMap = new Map<string, IMarker>();

    private readonly subscription = new Subscription();

    constructor(
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        private readonly events: EventsService,
        projectCurrentService: ProjectCurrentService,
        private readonly route: ActivatedRoute,
        private readonly toastsService: ToastsService
    ) {
        projectCurrentService.project$.subscribe((value) => {
            this.projectName = value?.name ?? '';
        });
    }

    ngAfterViewInit() {
        this.map = new jsVectorMap({
            selector: '#map',
            map: 'world',
            regionStyle: {
                initial: {
                    fill: REGION_DEFAULT_COLOR,
                    stroke: '#f7f8f9',
                    strokeWidth: 0.1,
                    fillOpacity: 1,
                },
            },
            onRegionTooltipShow: (event: any) => {
                event.preventDefault();
            },
            markersSelectable: false,
            onMarkerTooltipShow: (
                event: any, tooltip: any
            ) => {
                tooltip.text(
                    tooltip.text(),
                    true
                );
            },
            onLoaded(map: any) {
                this.listener = () => {
                    map.updateSize();
                };

                window.addEventListener(
                    'resize',
                    this.listener
                );
            },
        });

        this.map.updateSize();
    }

    async ngOnInit(): Promise<void> {
        this.projectId = this.route.snapshot.params.projectId;

        this.subscription.add(this.events.event$.subscribe((event) => {
            if (!event) {
                return;
            }

            switch (event.id) {
                case ProxiesSynchronizedEvent.id: {
                    const synced = event as ProxiesSynchronizedEvent;
                    this.onProxiesSynchronized(synced.actions);

                    break;
                }
            }
        }));

        this.events.register({
            scope: EEventScope.PROXIES,
            projectId: this.projectId,
        });

        try {
            const views = await this.commander.getAllProjectConnectorsAndProxiesById(this.projectId);
            for (const view of views) {
                for (const proxy of view.proxies) {
                    this.addProxy(proxy);
                }
            }

            this.buildMarkers();
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Connectors',
                err.message
            );
        }
    }

    get proxiesCount(): number {
        return this.markersMap.size;
    }

    ngOnDestroy() {
        if (this.listener) {
            window.removeEventListener(
                'resize',
                this.listener
            );
        }

        this.events.unregister({
            scope: EEventScope.PROXIES,
            projectId: this.projectId,
        });

        this.subscription.unsubscribe();
    }

    openFullScreen() {
        const elem = this.fullscreenElement.nativeElement;

        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            /* Firefox */
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
            /* Chrome, Safari and Opera */
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            /* IE/Edge */
            elem.msRequestFullscreen();
        }

        setTimeout(
            () => {
                this.map.updateSize();
            },
            1000
        );

    }

    private onProxiesSynchronized(actions: ISynchronizeLocalProxiesBase) {
        for (const proxy of actions.created) {
            this.addProxy(proxy);
        }

        for (const proxy of actions.updated) {
            this.removeProxy(proxy);
            this.addProxy(proxy);
        }

        for (const proxy of actions.removed) {
            this.removeProxy(proxy);
        }

        this.buildMarkers();
    }

    private addProxy(proxy: IProxyBase) {
        if (this.projectId !== proxy.projectId) {
            return;
        }

        if (this.markersMap.has(proxy.id)) {
            return;
        }

        // Connector
        this.proxiesByConnectors.add(
            proxy.connectorId,
            proxy.connectorId,
            proxy.id
        );

        // Country
        const countryCode = proxy.fingerprint?.countryCode;

        if (countryCode) {
            this.proxiesByCountries.add(
                countryCode,
                getCountryName(countryCode) ?? countryCode,
                proxy.id,
                (code) => {
                    const mapRegions = this.map.regions[ code.toUpperCase() ];

                    if (mapRegions) {
                        mapRegions.element.setStyle(
                            'fill',
                            REGION_PROXIES_COLOR
                        );
                    }
                }
            );

            // City
            const cityName = proxy.fingerprint?.cityName;

            if (cityName) {
                const city = `${countryCode}#${cityName}`;

                this.proxiesByCities.add(
                    city,
                    `${cityName} (${countryCode})`,
                    proxy.id
                );
            }
        }

        // ASN
        const asnName = proxy.fingerprint?.asnName;

        if (asnName) {
            this.proxiesByAsns.add(
                asnName,
                asnName,
                proxy.id
            );
        }

        // Marker
        if (
            proxy.fingerprint?.latitude &&
            proxy.fingerprint?.longitude
        ) {
            const marker: IMarker = {
                name: getTooltipContent(proxy),
                coords: [
                    proxy.fingerprint.latitude, proxy.fingerprint.longitude,
                ],
                style: {
                    fill: getStatusColor(proxy),
                },
                proxy,
            };

            this.markersMap.set(
                proxy.id,
                marker
            );
        }
    }

    private removeProxy(proxy: IProxyBase) {
        if (this.projectId !== proxy.projectId) {
            return;
        }

        // Connector
        this.proxiesByConnectors.remove(proxy.id);

        // Country
        this.proxiesByCountries.remove(
            proxy.id,
            (countryCode) => {
                const mapRegions = this.map.regions[ countryCode.toUpperCase() ];

                if (mapRegions) {
                    mapRegions.element.setStyle(
                        'fill',
                        REGION_DEFAULT_COLOR
                    );
                }
            }
        );

        // City
        this.proxiesByCities.remove(proxy.id);

        // Asn
        this.proxiesByAsns.remove(proxy.id);

        // Marker
        this.markersMap.delete(proxy.id);
    }

    private buildMarkers() {
        this.map.removeMarkers();
        this.map.addMarkers(Array.from(this.markersMap.values()));
    }
}
