import {
    Inject,
    Injectable,
    Logger,
} from '@nestjs/common';
import {
    EConnectMode,
    EProjectStatus,
} from '@scrapoxy/common';
import { pki } from 'node-forge';
import { COMMANDER_MASTER_MODULE_CONFIG } from './master.constants';
import {
    CertificateNotFoundError,
    NoProjectProxyError,
} from '../../commander-client';
import {
    generateCertificateFromCa,
    readCaCert,
    readCaKey,
} from '../../helpers';
import { StorageprovidersService } from '../../storages';
import type { ICommanderMasterModuleConfig } from './master.module';
import type { OnModuleInit } from '@nestjs/common';
import type {
    ICertificate,
    IProjectToConnect,
    IProxyToConnect,
} from '@scrapoxy/common';


function isModeMitmActive(
    mode: EConnectMode, defaultMitm: boolean
): boolean {
    if (mode === EConnectMode.MITM) {
        return true;
    }

    if (mode === EConnectMode.TUNNEL) {
        return false;
    }

    return defaultMitm;
}


@Injectable()
export class CommanderMasterService implements OnModuleInit {
    protected readonly logger = new Logger(CommanderMasterService.name);

    private caCert!: pki.Certificate;

    private caKey!: pki.rsa.PrivateKey;

    constructor(
        @Inject(COMMANDER_MASTER_MODULE_CONFIG)
        private readonly config: ICommanderMasterModuleConfig,
        private readonly storageproviders: StorageprovidersService
    ) {
    }

    async onModuleInit(): Promise<void> {
        // Load CA certificate
        const caCert = await readCaCert();
        this.caCert = pki.certificateFromPem(caCert);

        const caKey = await readCaKey();
        this.caKey = pki.privateKeyFromPem(caKey);
    }

    //////////// PROJECT ////////////
    async getProjectToConnect(
        token: string,
        mode: EConnectMode,
        certificateHostname: string | null
    ): Promise<IProjectToConnect> {
        this.logger.debug(`getProjectToConnect(): token=${token} / mode=${mode} / certificateHostname=${certificateHostname}`);

        const project = await this.storageproviders.storage.getProjectByToken(token);
        let certificate: ICertificate | null;

        if (isModeMitmActive(
            mode,
            project.mitm
        ) && certificateHostname
            && certificateHostname.length > 0
        ) {
            try {
                certificate = await this.storageproviders.storage.getCertificateForHostname(certificateHostname);
            } catch (err: any) {
                if (!(err instanceof CertificateNotFoundError)) {
                    throw err;
                }

                const certificateInfo = generateCertificateFromCa(
                    this.caCert,
                    this.caKey,
                    certificateHostname,
                    this.config.mitm.certificateDurationInMs
                );

                certificate = certificateInfo.certificate;

                await this.storageproviders.storage.createCertificateForHostname(
                    certificateHostname,
                    certificate
                );
            }
        } else {
            certificate = null;
        }

        const projectToConnect: IProjectToConnect = {
            id: project.id,
            autoScaleUp: project.autoScaleUp,
            certificate,
            cookieSession: project.cookieSession,
            status: project.status,
            useragentOverride: project.useragentOverride,
        };

        return projectToConnect;
    }

    async scaleUpProject(projectId: string): Promise<void> {
        this.logger.debug(`scaleUpProject(): projectId=${projectId}`);

        const project = await this.storageproviders.storage.getProjectById(projectId);

        project.status = EProjectStatus.HOT;

        await Promise.all([
            this.storageproviders.storage.updateProject(project),
            this.storageproviders.storage.updateProjectLastDataTs(
                project.id,
                Date.now()
            ),
        ]);
    }


    //////////// PROXIES ////////////
    async getNextProxyToConnect(
        projectId: string,
        proxyname: string | null
    ): Promise<IProxyToConnect> {
        this.logger.debug(`getNextProxyToConnect(): projectId=${projectId} / proxyname=${proxyname}`);

        let proxy: IProxyToConnect;
        try {
            proxy = await this.storageproviders.storage.getNextProxyToConnect(
                projectId,
                proxyname
            );
        } catch (err: any) {
            if (!proxyname ||
                proxyname.length <= 0 ||
                !(err instanceof NoProjectProxyError)) {
                throw err;
            }

            // If proxy doesn't exist anymore, fallback to any proxy
            proxy = await this.storageproviders.storage.getNextProxyToConnect(
                projectId,
                null
            );
        }

        const nowTime = Date.now();

        await this.storageproviders.storage.updateProxyLastConnectionTs(
            proxy.projectId,
            proxy.connectorId,
            proxy.id,
            nowTime
        );

        return proxy;
    }
}
