import type { Config } from '@react-router/dev/config';

export default {
    ssr: true,
    basename: '/',

    // specific paths
    prerender: ["/", "/players"],

} satisfies Config;
