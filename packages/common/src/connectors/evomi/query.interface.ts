import type { EEvomiProduct } from './evomi.interface';


export enum EEvomiQueryCredential {
    Products = 'products',
    Product = 'product',
}


export interface IEvomiQueryProduct {
    product: EEvomiProduct;
}


export interface IEvomiProduct {
    hostname?: string;
    port: number;
    username?: string;
    password?: string;
    countries: string[];
}
