export const ADDRESS_SWAGGER_PROPS = {
    hostname: {
        type: 'string',
        description: 'hostname of the proxy',
        example: '116.226.159.130',
    },
    port: {
        type: 'number',
        description: 'TCP port of the proxy',
        example: 3128,
    },
};


export interface IAddress {
    hostname: string;
    port: number;
}
