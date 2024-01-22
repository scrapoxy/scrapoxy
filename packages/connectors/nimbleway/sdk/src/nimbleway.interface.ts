export interface INimblewayGeoItem {
    name: string;
    code: string;
}


export interface INimblewayCountry extends INimblewayGeoItem {
    cities: INimblewayGeoItem[];
}
