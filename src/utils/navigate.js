import { navigate } from 'gatsby-link';
import { LOCALES, EN_GB } from '@clearscore/config.i18n';

const DEFAULT_LOCALE = process.env.DEFAULT_LOCALE || EN_GB;

const langFromPath = (pathname) =>
    [pathname]
        .map((text) => /^\/\w{2}\//.exec(text))
        .map((lang) => (lang === null ? DEFAULT_LOCALE : lang[0].replace(/\//g, '')))
        .pop();

const isDefault = (pathname) =>
    pathname === '/' ||
    langFromPath(pathname) === DEFAULT_LOCALE ||
    LOCALES.every((lang) => lang !== langFromPath(pathname));

const urlPrefix = (lang) => (lang === DEFAULT_LOCALE ? '/' : `/${lang}`);

const removeUrlPrefix = (pathname) => (isDefault(pathname) ? pathname : pathname.substr(4));

export const navigatePath = (to) => {
    if (typeof document === 'undefined') return '';
    return `/${urlPrefix(langFromPath(document.location.pathname))}${to}`;
};

export default ({ lang }) => {
    if (langFromPath(document.location.pathname) === lang) return;
    navigate(urlPrefix(lang) + removeUrlPrefix(document.location.pathname));
};
