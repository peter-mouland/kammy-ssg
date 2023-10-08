import * as React from 'react';
import { Link } from 'gatsby';
import { useCookies } from 'react-cookie';

import * as Layout from '../../components/layout';
import Button from '../../components/button';
import Spacer from '../../components/spacer';
import useMeta from '../../hooks/use-meta';
import NavBar from '../../components/nav-bar';

import type { HeadFC, PageProps } from 'gatsby';

const regenerateNetlify = () =>
    fetch('https://api.netlify.com/build_hooks/5f5fd04913fd8644b328305a', {
        method: 'post',
    });

const AdminPage: React.FC<PageProps> = () => {
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const [, setCookie] = useCookies(['is-admin']);
    React.useEffect(() => {
        setCookie('is-admin', 'true', { path: '/', maxAge: 60 * 60 * 24 * 365 });
    });
    const { formattedTime, getFromNow } = useMeta();
    const publish = () => {
        setIsLoading(true);
        return regenerateNetlify();
    };

    return (
        <Layout.Container>
            <Layout.PrimaryNav>
                <NavBar />
            </Layout.PrimaryNav>
            <Layout.Body>
                <Layout.Title>Admin</Layout.Title>
                <Spacer all={{ vertical: Spacer.spacings.MEDIUM }}>
                    <strong>Last Build:</strong> {formattedTime}{' '}
                    <small style={{ color: '#888', fontSize: '0.9em' }}>({getFromNow()})</small>
                </Spacer>
                <ul>
                    <li>
                        <Spacer all={{ bottom: Spacer.spacings.SMALL }}>
                            <p>Regenerate the site, with updated scores (takes about 10 mins).</p>
                            {isLoading && (
                                <Spacer all={{ bottom: Spacer.spacings.TINY }}>
                                    <a
                                        href="https://www.gatsbyjs.com/dashboard/organization/a81aa224-77fc-4be4-aa1a-16732e90fe97/sites"
                                        target="_gatsby"
                                    >
                                        view progress
                                    </a>{' '}
                                </Spacer>
                            )}
                        </Spacer>
                        <Spacer all={{ bottom: Spacer.spacings.LARGE }}>
                            <Button
                                onClick={publish}
                                isDisabled={isLoading}
                                isLoading={isLoading}
                                type={Button.types.PRIMARY}
                                htmlType="button"
                            >
                                Publish Site Update
                            </Button>
                        </Spacer>
                    </li>
                    <li>
                        <Spacer all={{ bottom: Spacer.spacings.SMALL }}>
                            View the DraftFF Player list as well as the Sky Sports Players.
                        </Spacer>
                        <Spacer all={{ bottom: Spacer.spacings.LARGE }}>
                            <Link to="players">View Latest Players</Link>
                        </Spacer>
                    </li>
                </ul>{' '}
            </Layout.Body>
        </Layout.Container>
    );
};

export default AdminPage;
export const Head: HeadFC = () => <title>Admin</title>;
