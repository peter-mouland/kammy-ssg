import { useCookies } from 'react-cookie';

const useAdmin = () => {
    const [cookies, setCookie] = useCookies(['is-admin']);
    return {
        isAdmin: cookies['is-admin'] === 'true',
        setIsAdmin: () => {
            setCookie('is-admin', 'true', { path: '/', maxAge: 60 * 60 * 24 * 365 });
        },
    };
};

export default useAdmin;
