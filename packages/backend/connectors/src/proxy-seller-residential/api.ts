import { Agents } from '@scrapoxy/backend-sdk';
import axios from 'axios';
import { EProxySellerResidentialResponseStatus } from './ps-residential.interface';
import type {
    IProxySellerResidentialResponse,
    IProxySellerResidentList,
    IProxySellerResidentListCreate,
} from './ps-residential.interface';
import type { AxiosInstance } from 'axios';


export class ErrorProxySellerServerApi extends Error {}


export class ProxySellerResidentialApi {
    private readonly instance: AxiosInstance;

    constructor(
        token: string,
        agents: Agents
    ) {
        this.instance = axios.create({
            ...agents.axiosDefaults,
            baseURL: `https://proxy-seller.com/personal/api/v1/${token}/`,
        });

        this.instance.interceptors.response.use(
            (res) => {
                if (res.data.status === EProxySellerResidentialResponseStatus.SUCCESS) {
                    return res;
                }

                if (res.data.errors && res.data.errors.length > 0) {
                    throw new ErrorProxySellerServerApi(res.data.errors[ 0 ].message);
                }

                throw new ErrorProxySellerServerApi('Unknown error on Proxy-Seller API');
            },
            (err) => {
                throw err;
            }
        );
    }

    async getAllListsByTitle(title: string): Promise<IProxySellerResidentList[]> {
        const res = await this.instance.get<IProxySellerResidentialResponse<IProxySellerResidentList[]>>('resident/lists');
        const lists = res.data.data.filter((l) => l.title === title);

        return lists;
    }

    async createList(create: IProxySellerResidentListCreate): Promise<IProxySellerResidentList> {
        const list = await this.instance.post<IProxySellerResidentialResponse<IProxySellerResidentList>>(
            'resident/list',
            create
        );

        return list.data.data;
    }

    async removeListById(id: number) {
        await this.instance.delete(
            'resident/list/delete',
            {
                params: {
                    id,
                },
            }
        );
    }

    async ping(): Promise<void> {
        await this.instance.get('system/ping');
    }
}
