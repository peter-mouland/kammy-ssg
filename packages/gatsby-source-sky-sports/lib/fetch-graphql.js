/* eslint-disable no-console */
const axios = require('axios');

module.exports = async ({ api, query, variables }) => {
    const response = await axios.post(
        `${api}/graphql`,
        {
            query,
            variables,
        },
        { headers: { 'content-type': 'application/json' } },
    );

    return response.data;
};
