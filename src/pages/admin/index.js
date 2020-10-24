/* global fetch */
import React, { useState, useEffect } from 'react';
import Link from 'gatsby-link';
import { useCookies } from 'react-cookie';

import Layout from '../../components/layout';
import Button from '../../components/button';
import Spacer from '../../components/spacer';
import useMeta from '../../hooks/use-meta';

const regenerateGatsby = (setIsLoading) => {
    setIsLoading(true);
    return fetch('https://webhook.gatsbyjs.com/hooks/data_source/publish/b5688433-a49a-4368-84e6-8a08eb2e4377', {
        method: 'post',
    });
};

// eslint-disable-next-line no-unused-vars
const regenerateNetlify = (setIsLoading) => {
    setIsLoading(true);
    return fetch('https://api.netlify.com/build_hooks/5f5fd04913fd8644b328305a', {
        method: 'post',
    });
};

const AdminPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [, setCookie] = useCookies(['is-admin']);
    useEffect(() => {
        setCookie('is-admin', 'true', { path: '/', maxAge: 60 * 60 * 24 * 365 });
    });
    const { formattedTime, getFromNow } = useMeta();
    const publish = () => regenerateGatsby(setIsLoading);
    return (
        <Layout title="Admin - Links">
            <div id="admin-page" data-b-layout="container">
                <Spacer all={{ vertical: Spacer.spacings.MEDIUM }}>
                    <h1>Admin</h1>
                </Spacer>
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
                </ul>
            </div>
        </Layout>
    );
};

export default AdminPage;
