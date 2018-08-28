export class ProcessedRequest {
    public id: string
    constructor(
        public date: Date,
        public status: number,
        public name: string,
        public request: string,
        public response: string,
        public matches: string[]
    ) {
    }
}