import type { Config } from '@react-router/dev/config';

export default {
    ssr: true,
    basename: '/',
    future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
    },
} satisfies Config;
