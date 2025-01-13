import {
    Component,
    Inject,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
    EventsMetricsClient,
    formatFileUnit,
    formatNumberUnit,
    MetricsStore,
} from '@scrapoxy/common';
import {
    CommanderFrontendClientService,
    EventsService,
    ProjectCurrentService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type {
    OnDestroy,
    OnInit,
} from '@angular/core';
import type { ICommanderFrontendClient } from '@scrapoxy/common';
import type {
    ChartData,
    ChartOptions,
} from 'chart.js';


function getOptions(labelize: (label: number) => string): ChartOptions {
    const options: ChartOptions = {
        animation: {
            duration: 0,
        },
        elements: {
            line: {
                borderWidth: 1,
                tension: 0,
                fill: false,
            },
            point: {
                radius: 0,
                hitRadius: 10,
                hoverRadius: 4,
            },
        },
        interaction: {
            mode: 'index',
        },
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                mode: 'index',
                callbacks: {
                    title: () => '',
                    label: (context) => {
                        const value = labelize(context.parsed.y as number);

                        return `${context.dataset.label}: ${value}`;
                    },
                    labelColor: (ctx) => {
                        const color = ctx.dataset.borderColor as string;

                        return {
                            borderColor: color,
                            backgroundColor: color,
                            borderWidth: 1,
                        };
                    },
                },
            },
        },
        responsive: true,
        scales: {
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    display: false,
                },
            },
            y: {
                beginAtZero: true,
                ticks: {
                    maxTicksLimit: 5,
                    callback: (l) => labelize(l as number),
                },
            },
        },
    };

    return options;
}


@Component({
    templateUrl: 'metrics.component.html',
})
export class MetricsComponent implements OnInit, OnDestroy {
    bytesChartOptions = getOptions((label) => formatFileUnit(label as number));

    requestsChartOptions = getOptions((label) => formatNumberUnit(label as number));

    stopsChartOptions = getOptions((label) => formatNumberUnit(label as number));

    bytesData: ChartData;

    stopsData: ChartData;

    requestsData: ChartData;

    readonly client: EventsMetricsClient;

    currentWindow = 0;

    projectId: string;

    projectName = '';

    constructor(
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        private readonly events: EventsService,
        projectCurrentService: ProjectCurrentService,
        private readonly route: ActivatedRoute,
        private readonly toastsService: ToastsService
    ) {
        this.client = new EventsMetricsClient(
            this.events,
            () => {
                this.refresh();
            }
        );

        projectCurrentService.project$.subscribe((value) => {
            this.projectName = value?.name ?? '';
        });
    }

    async ngOnInit(): Promise<void> {
        this.projectId = this.route.snapshot.params.projectId;

        try {
            const view = await this.commander.getProjectMetricsById(this.projectId);

            this.client.subscribe(
                this.projectId,
                MetricsStore.fromView(view)
            );

            this.refresh();
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Metrics',
                err.message
            );
        }
    }

    ngOnDestroy() {
        this.client.unsubscribe();
    }

    get requestsBeforeStopAvg(): number {
        const store = this.client.store;

        if (!store) {
            return 0;
        }

        const project = store.view.project;

        if (!project || project.requestsBeforeStop.count <= 0) {
            return 0;
        }

        return project.requestsBeforeStop.sum / project.requestsBeforeStop.count;
    }

    get uptimeBeforeStopAvg(): number {
        const store = this.client.store;

        if (!store) {
            return 0;
        }

        const project = store.view.project;

        if (!project || project.uptimeBeforeStop.count <= 0) {
            return 0;
        }

        return project.uptimeBeforeStop.sum / project.uptimeBeforeStop.count;
    }

    updateWindow(window: number) {
        this.currentWindow = window;
        this.refresh();
    }

    private refresh() {
        const store = this.client.store as MetricsStore;
        const snapshots = store.view.windows[ this.currentWindow ].snapshots;
        const labels = snapshots.map((
            val, ind
        ) => ind);

        this.bytesData = {
            labels,
            datasets: [
                {
                    data: snapshots.map(m => m?.bytesReceived),
                    label: 'Received',
                    borderColor: '#74c12f',
                },
                {
                    data: snapshots.map(m => m?.bytesSent),
                    label: 'Sent',
                    borderColor: '#f9d76e',
                },
            ],
        };

        this.requestsData = {
            labels,
            datasets: [
                {
                    data: snapshots.map(m => m?.requests),
                    label: 'Request count',
                    borderColor: '#bd5656',
                },
            ],
        };

        this.stopsData = {
            labels,
            datasets: [
                {
                    data: snapshots.map(m => m?.stops),
                    label: 'Stop orders',
                    borderColor: '#fc1a6d',
                },
            ],
        };
    }
}
