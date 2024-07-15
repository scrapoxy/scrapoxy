import { promises as fs } from 'fs';
import { gzipSync } from 'zlib';


interface IEntrypoint {
    domain: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    country_iso: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    sticky_port_first: number;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    sticky_port_last: number;
}

interface IEndpoint {
    code: string;
    hostname: string;
    portMin: number;
    portMax: number;
}

(async() => {
    const sourceRaw = await fs.readFile('tools/smartproxy_entrypoints.json');
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const source = JSON.parse(sourceRaw.toString()) as { entry_points: IEntrypoint[] };
    const entryPointsFiltered = source.entry_points.filter((ep) => {
        return ![
            'gate.smartproxy.com', 'state.smartproxy.com', 'city.smartproxy.com',
        ].includes(ep.domain);
    });
    const endpoints: IEndpoint[] = entryPointsFiltered.map((ep) => ({
        code: ep.country_iso.toLowerCase(),
        hostname: ep.domain,
        portMin: ep.sticky_port_first,
        portMax: ep.sticky_port_last + 1,
    }))
        .sort((
            a, b
        ) => a.code.localeCompare(b.code));
    const listOfIsos = endpoints.map((ep) => ep.code.toUpperCase());
    const listOfIsosRaw = JSON.stringify(
        listOfIsos,
        null,
        4
    );
    await fs.writeFile(
        'tools/smartproxy_isocodes.json',
        listOfIsosRaw
    );

    const endpointsRaw = JSON.stringify(
        endpoints,
        null,
        4
    );
    await fs.writeFile(
        'tools/smartproxy_endpoints.json',
        endpointsRaw
    );

    // create a gzip file
    const endpointsGzRaw = gzipSync(endpointsRaw);
    await fs.writeFile(
        'tools/smartproxy_endpoints.json.gz',
        endpointsGzRaw
    );

})()
    .catch(console.error);
