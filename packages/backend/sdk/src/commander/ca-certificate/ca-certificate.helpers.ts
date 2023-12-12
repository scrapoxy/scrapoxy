import { promises as fs } from 'fs';
import { resolve } from 'path';
import { getEnvAssetsPath } from '../../helpers';


export async function readCaCert(): Promise<string> {
    const data = await fs.readFile(resolve(
        getEnvAssetsPath(),
        'certificates',
        'scrapoxy-ca.crt'
    ));

    return data.toString();
}


export async function readCaKey(): Promise<string> {
    const data = await fs.readFile(resolve(
        getEnvAssetsPath(),
        'certificates',
        'scrapoxy-ca.key'
    ));

    return data.toString();
}
