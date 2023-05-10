export class SocketResponse {
    data: any;
    error: string | undefined;
    type: 'success' | 'error' = 'success';

    private constructor(data?: any, error?: string, type?: 'success' | 'error') {
        this.data = data;
        this.error = error;
        this.type = type || 'success';
    }

    static success(data: any): SocketResponse {
        return new SocketResponse(data, null, 'success');
    }

    static error(error: string): SocketResponse {
        return new SocketResponse(null, error, 'error');
    }
}
