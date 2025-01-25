import type {
    IEvomiProductResidential,
    IEvomiProductServer,
    IEvomiProductServerPackage,
} from './evomi.interface';


export function isValidResidentialProduct(product: IEvomiProductResidential | undefined): boolean {
    return !!product?.balance_mb && product.balance_mb > 0;
}

function isValidServerProductPackage(
    pkg: IEvomiProductServerPackage | undefined, now: Date
) {
    return pkg?.ips && pkg.ips.length > 0 &&
        now <= new Date(pkg.expiryDate);
}


export function isValidServerProduct(product: IEvomiProductServer | undefined): boolean {
    if (!product?.packages ||
        product.packages.length <= 0) {
        return false;
    }

    for (const pkg of product.packages) {
        if (isValidServerProductPackage(
            pkg,
            new Date()
        )) {
            return true;
        }
    }

    return false;
}
