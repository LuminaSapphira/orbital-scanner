declare interface PrototypeData {
    extend(protos: Object[]): void;
    raw: any;
}
declare const data: PrototypeData;
declare namespace table {
    function deepcopy(other: any): any;
}