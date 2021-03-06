import { ServiceConfigMap } from "./ServiceConfigMap";

export class Service {
    constructor(public name: string,
        public type: string,
        public config: ServiceConfigMap[]
    ) {
    }

    public url: string
}