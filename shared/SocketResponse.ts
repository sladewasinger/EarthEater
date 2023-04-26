export class SocketResponse {
    data: any;
    error: string | undefined;

    constructor(data: any, error?: string) {
        this.data = data;
        this.error = error;
    }

    static success(data: any): SocketResponse {
        return new SocketResponse(data);
    }

    static error(error: string): SocketResponse {
        return new SocketResponse(null, error);
    }
}
