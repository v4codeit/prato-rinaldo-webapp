export const isDev = process.env.NODE_ENV === 'development';

export function devLog(context: string, message: string, ...args: any[]) {
    if (isDev) {
        console.log(`[DEV][${context}] ${message}`, ...args);
    }
}

export function devWarn(context: string, message: string, ...args: any[]) {
    if (isDev) {
        console.warn(`[DEV][${context}] ${message}`, ...args);
    }
}

export function devError(context: string, message: string, ...args: any[]) {
    if (isDev) {
        console.error(`[DEV][${context}] ${message}`, ...args);
    }
}
