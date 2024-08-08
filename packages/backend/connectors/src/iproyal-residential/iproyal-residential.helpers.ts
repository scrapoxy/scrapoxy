import type {
    IIproyalResidentialCountries,
    IIproyalResidentialItem,
} from '@scrapoxy/common';


function toIproyalResidentialItem(i: IIproyalResidentialItem): IIproyalResidentialItem {
    const item: IIproyalResidentialItem = {
        code: i.code,
        name: i.name,
    };

    return item;
}


export function toIproyalResidentialCountries(z: IIproyalResidentialCountries): IIproyalResidentialCountries {
    const countries: IIproyalResidentialCountries = {
        countries: z.countries.map((c) => ({
            code: c.code,
            name: c.name,
            cities: {
                options: c.cities.options.map(toIproyalResidentialItem),
            },
            states: {
                options: c.states.options.map(toIproyalResidentialItem),
            },
        })),
    };

    return countries;
}
