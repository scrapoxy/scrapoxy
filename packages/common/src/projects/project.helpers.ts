import type {
    IProjectData,
    IProjectView,
    IRangeMetrics,
} from './project.interface';


export function toProjectView(p: IProjectView): IProjectView {
    const view: IProjectView = {
        id: p.id,
        name: p.name,
        status: p.status,
        connectorDefaultId: p.connectorDefaultId,
    };

    return view;
}


export function toProjectData(p: IProjectData): IProjectData {
    const data: IProjectData = {
        id: p.id,
        name: p.name,
        status: p.status,
        connectorDefaultId: p.connectorDefaultId,
        autoRotate: p.autoRotate,
        autoScaleUp: p.autoScaleUp,
        autoScaleDown: p.autoScaleDown,
        cookieSession: p.cookieSession,
        mitm: p.mitm,
        proxiesMin: p.proxiesMin,
        useragentOverride: p.useragentOverride,
    };

    return data;
}


export function addRange(
    target: IRangeMetrics, source: IRangeMetrics
) {
    target.sum += source.sum;
    target.count += source.count;

    if (source.min != null) {
        if (target.min != null) {
            target.min = Math.min(
                target.min,
                source.min
            );
        } else {
            target.min = source.min;
        }
    }

    if (source.max != null) {
        if (target.max != null) {
            target.max = Math.max(
                target.max,
                source.max
            );
        } else {
            target.max = source.max;
        }
    }
}
