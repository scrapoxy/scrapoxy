import { EProxyStatus } from '@scrapoxy/common';
import type {
    IAzureError,
    IAzureInstanceView,
} from './azure.interface';


const REGION_PREFIX_TO_COUNTRY_CODE: Record<string, string> = {
    australia: 'au',
    brazil: 'br',
    canada: 'ca',
    france: 'fr',
    germany: 'de',
    israel: 'il',
    italy: 'it',
    japan: 'jp',
    korea: 'kr',
    mexico: 'mx',
    newzealand: 'nz',
    norway: 'no',
    poland: 'pl',
    qatar: 'qa',
    southafrica: 'za',
    spain: 'es',
    sweden: 'se',
    switzerland: 'ch',
    uae: 'ae',
    uk: 'gb',
};
const REGION_TO_COUNTRY_CODE: Record<string, string> = {
    centralindia: 'in',
    centralus: 'us',
    eastasia: 'cn',
    eastus: 'us',
    eastus2: 'us',
    jioindiacentral: 'in',
    jioindiawest: 'in',
    northcentralus: 'us',
    northeurope: 'eu',
    southcentralus: 'us',
    southeastasia: 'sg',
    southindia: 'in',
    westcentralus: 'us',
    westeurope: 'eu',
    westindia: 'in',
    westus: 'us',
    westus2: 'us',
    westus3: 'us',
};


export function convertRegionToCountryCode(region: string | null | undefined): string | null {
    if (!region) {
        return null;
    }

    for (const prefix in REGION_PREFIX_TO_COUNTRY_CODE) {
        if (region.startsWith(prefix)) {
            return REGION_PREFIX_TO_COUNTRY_CODE[ prefix ];
        }
    }

    return REGION_TO_COUNTRY_CODE[ region ] ?? null;
}


export function getAzureErrorMessage(error: IAzureError | undefined): string | undefined {
    if (!error) {
        return;
    }

    if (!error.details || error.details.length <= 0) {
        return error.message;
    }

    return error.details[ 0 ].message;
}


function convertPowerStateToProxyStatus(powerState: string): EProxyStatus {
    switch (powerState) {
        case 'stopped':
        case 'deallocated': {
            return EProxyStatus.STOPPED;
        }

        case 'stopping':
        case 'deallocating': {
            return EProxyStatus.STOPPING;
        }

        case 'starting': {
            return EProxyStatus.STARTING;
        }

        case 'running': {
            return EProxyStatus.STARTED;
        }

        default: {
            return EProxyStatus.ERROR;
        }
    }
}


export function convertAzureStateToProxyStatus(instanceView: IAzureInstanceView | undefined): EProxyStatus {
    if (!instanceView?.statuses) {
        return EProxyStatus.ERROR;
    }

    let
        powerState: string | undefined = void 0,
        provisioningState: string | undefined = void 0;
    for (const status of instanceView.statuses) {
        if (status.code) {
            if (status.code.startsWith('PowerState/')) {
                powerState = status.code.substring(11);
            } else if (status.code.startsWith('ProvisioningState/')) {
                provisioningState = status.code.substring(18);
            }
        }
    }

    switch (provisioningState) {
        case 'updating':
        case 'succeeded': {
            if (powerState) {
                return convertPowerStateToProxyStatus(powerState);
            }

            return EProxyStatus.ERROR;
        }

        case 'creating': {
            return EProxyStatus.STARTING;
        }

        case 'deleting': {
            return EProxyStatus.STOPPING;
        }

        default: {
            return EProxyStatus.ERROR;
        }
    }
}
