import { addRange } from '../project.helpers';
import type { IWindow } from './window.interface';
import type {
    IProjectMetricsAddView,
    IProjectMetricsView,
} from '../project.interface';


export class MetricsStore {
    static fromView(view: IProjectMetricsView) {
        return new MetricsStore(view);
    }

    private readonly windowsMap = new Map<string, IWindow>();

    private constructor(public readonly view: IProjectMetricsView) {
        this.windowsMap.clear();
        for (const window of view.windows) {
            this.windowsMap.set(
                window.id,
                window
            );
        }
    }

    add(view: IProjectMetricsAddView) {
        if (view.project.requests) {
            this.view.project.requests += view.project.requests;
        }

        if (view.project.stops) {
            this.view.project.stops += view.project.stops;
        }

        if (view.project.proxiesCreated) {
            this.view.project.proxiesCreated += view.project.proxiesCreated;
        }

        if (view.project.proxiesRemoved) {
            this.view.project.proxiesRemoved += view.project.proxiesRemoved;
        }

        if (view.project.bytesReceived) {
            this.view.project.bytesReceived += view.project.bytesReceived;
            this.view.project.bytesReceivedRate = view.project.bytesReceived;
        }

        if (view.project.bytesSent) {
            this.view.project.bytesSent += view.project.bytesSent;
            this.view.project.bytesSentRate = view.project.bytesSent;
        }

        if (view.project.snapshot) {
            this.view.project.snapshot.requests += view.project.snapshot.requests;
            this.view.project.snapshot.stops += view.project.snapshot.stops;
            this.view.project.snapshot.bytesReceived += view.project.snapshot.bytesReceived;
            this.view.project.snapshot.bytesSent += view.project.snapshot.bytesSent;
        }

        if (view.project.requestsBeforeStop) {
            addRange(
                this.view.project.requestsBeforeStop,
                view.project.requestsBeforeStop
            );
        }

        if (view.project.uptimeBeforeStop) {
            addRange(
                this.view.project.uptimeBeforeStop,
                view.project.uptimeBeforeStop
            );
        }

        if (view.windows) {
            for (const window of view.windows) {
                const windowFound = this.windowsMap.get(window.id);

                if (!windowFound) {
                    throw new Error(`Cannot window ${window.id} for project ${view.project.id}`);
                }

                windowFound.count += window.count;
                windowFound.requests += window.requests;
                windowFound.stops += window.stops;
                windowFound.bytesReceived += window.bytesReceived;
                windowFound.bytesSent += window.bytesSent;

                if (window.snapshot) {
                    windowFound.snapshots.push(window.snapshot);

                    while (windowFound.snapshots.length > window.size) {
                        windowFound.snapshots.shift();
                    }
                }
            }
        }
    }
}
