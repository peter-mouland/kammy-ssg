import { useQuery } from '@tanstack/react-query';

const BASE_URL =
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000/api/fpl' : 'https://kammy-proxy.vercel.app/api/fpl';
class LivePlayerError extends Error {
    constructor(message) {
        super(`LivePlayer: ${message}`);
        this.name = 'LivePlayer';
    }
}

export function queryFPL(url) {
    if (typeof url === 'undefined') throw new LivePlayerError('Missing URL for fetch function');
    return fetch(`${BASE_URL}/${url}`, {
        method: 'GET',
    }).then((response) => {
        if (response.ok) {
            // 1xx: Informational
            // 2xx: Success
            // 3xx: Redirection
            return response.json();
        }
        // 4xx: Client errors
        // 5xx: Server errors
        return Promise.reject(new LivePlayerError(`Fetch Error ${response.status}`));
    });
}

export const useFPLBootstrap = (filter) =>
    useQuery({
        queryKey: ['fpl', 'bootstrap'],
        queryFn: () => queryFPL(`bootstrap-static`),
        select: filter,
    });

export const useElements = (elementCode) =>
    useFPLBootstrap((bootstrap) => bootstrap.elements.find((element) => element.code === elementCode));
