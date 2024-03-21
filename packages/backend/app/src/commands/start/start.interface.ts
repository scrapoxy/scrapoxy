export interface IPackageInfo {
    name: string;
    version: string;
    description: string;
}


export interface IAppStartModuleConfig {
    package: IPackageInfo;
    standalone?: boolean;
    master?: boolean;
    commander?: boolean;
    distributed?: string;
    frontend?: boolean;
    refreshAll?: boolean;
    refreshConnectors?: boolean;
    refreshFreeproxies?: boolean;
    refreshMetrics?: boolean;
    refreshProxies?: boolean;
    refreshTasks?: boolean;
    storage?: string;
    test?: boolean;
    datacenterLocalAppUrl?: string;
    proxyLocalAppUrl?: string;
}
