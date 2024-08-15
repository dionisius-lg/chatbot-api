const docs = {
    path: '/',
    method: {
        post: {
            summary: 'post token',
            requestBody: {
                content: {
                    'application/x-www-form-urlencoded': {
                        schema: {
                            type: 'object',
                            properties: {
                                username: { type: 'string', default: '' },
                                password: { type: 'string', default: '' },
                            },
                            required: ['username', 'password'],
                        }
                    },
                },
            },
        },
    },
};

const refreshdocs = {
    path: '/refresh',
    method: {
        get: {
            security: [{ bearerRefreshAuth: [] }],
            summary: 'get refresh token',
        },
    },
};

export default [
    docs,
    refreshdocs
];
