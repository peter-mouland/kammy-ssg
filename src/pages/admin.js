/* global fetch */
import React, { useState } from 'react';

import Layout from '../components/layout';
import Button from '../components/button';
import Spacer from '../components/spacer';

const NotFoundPage = () => {
    const [isLoading, setIsloading] = useState(false);
    const regenerate = () => {
        setIsloading(true);
        return fetch('https://webhook.gatsbyjs.com/hooks/data_source/publish/b5688433-a49a-4368-84e6-8a08eb2e4377', {
            method: 'post',
        });
    };
    return (
        <Layout meta={{ title: 'Admin Links', description: '' }}>
            {() => (
                <div id="admin-page" data-b-layout="container">
                    <Spacer all={{ vertical: Spacer.spacings.MEDIUM }}>
                        <h1>Admin</h1>
                    </Spacer>
                    <ul>
                        <li>
                            <Spacer all={{ bottom: Spacer.spacings.SMALL }}>
                                <p>Regenerate the site, with updated scores (takes about 10 mins).</p>
                                {isLoading && (
                                    <p>
                                        <a
                                            href="https://www.gatsbyjs.com/dashboard/organization/a81aa224-77fc-4be4-aa1a-16732e90fe97/sites"
                                            target="_gatsby"
                                        >
                                            view progress
                                        </a>{' '}
                                    </p>
                                )}
                            </Spacer>
                            <Spacer all={{ bottom: Spacer.spacings.LARGE }}>
                                <Button
                                    onClick={regenerate}
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
                                <Button isDisabled>
                                    View Latest Players
                                </Button>
                            </Spacer>
                        </li>
                    </ul>
                </div>
            )}
        </Layout>
    );
};

export default NotFoundPage;
