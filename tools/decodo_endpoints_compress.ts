import { promises as fs } from 'fs';
import { gzipSync } from 'zlib';


(async() => {
    const sourceRaw = await fs.readFile('tools/decodo_endpoints.json');
    const source = JSON.parse(sourceRaw.toString());
    const endpointsSorted = source
        .map((ep: any) => {
            ep.code = ep.code.toLowerCase();

            return ep;
        })
        .sort((
            a: any, b: any
        ) => a.code.localeCompare(b.code));
    console.log(endpointsSorted);

    const endpointsRaw = JSON.stringify(
        endpointsSorted,
        null,
        4
    );
    // create a gzip file
    const endpointsGzRaw = gzipSync(endpointsRaw);
    await fs.writeFile(
        'tools/decodo_endpoints.json.gz',
        endpointsGzRaw
    );

})()
    .catch(console.error);
