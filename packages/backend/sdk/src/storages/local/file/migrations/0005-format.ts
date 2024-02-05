import {
    PROXY_TIMEOUT_DISCONNECTED_DEFAULT,
    PROXY_TIMEOUT_UNREACHABLE_DEFAULT,
} from '@scrapoxy/common';


export const migration = {
    name: '0005-format',
    up: async({ context: data }: { context: any }) => {
        for (const project of data.projects ?? []) {
            if (typeof project.autoRotate === 'boolean') {
                project.autoRotate = {
                    enabled: project.autoRotate,
                    min: project.autoRotateDelayRange.min,
                    max: project.autoRotateDelayRange.max,
                };
            }
            delete project.autoRotateDelayRange;

            if (typeof project.autoScaleDown === 'boolean') {
                project.autoScaleDown = {
                    enabled: project.autoScaleDown,
                    value: project.autoScaleDownDelay,
                };
            }
            delete project.autoScaleDownDelay;

            for (const connector of project.connectors ?? []) {
                if (!connector.proxiesTimeoutDisconnected) {
                    connector.proxiesTimeoutDisconnected = PROXY_TIMEOUT_DISCONNECTED_DEFAULT;
                }

                if (!connector.proxiesTimeoutUnreachable) {
                    connector.proxiesTimeoutUnreachable = {
                        enabled: true,
                        value: PROXY_TIMEOUT_UNREACHABLE_DEFAULT,
                    };
                }
            }
        }
    },
    down: async({ context: data }: { context: any }) => {
        for (const project of data.projects ?? []) {
            project.autoRotateDelayRange = {
                min: project.autoRotate.min,
                max: project.autoRotate.max,
            };
            project.autoRotate = project.autoRotate.enabled;
            project.autoScaleDownDelay = project.autoScaleDown.value;
            project.autoScaleDown = project.autoScaleDown.enabled;

            for (const connector of project.connectors ?? []) {
                delete connector.proxiesTimeoutDisconnected;
                delete connector.proxiesTimeoutUnreachable;
            }
        }
    },
};
