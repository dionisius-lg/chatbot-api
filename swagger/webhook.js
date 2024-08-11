const docs = {
    path: '/',
    method: {
        post: {
            security: [{ apiKeyAuth: [] }],
            summary: 'post token',
            requestBody: {
                content: {
                    'application/x-www-form-urlencoded': {
                        schema: {
                            type: 'object',
                            properties: {
                                text: { type: 'string', default: '' },
                            },
                            required: ['text'],
                        }
                    },
                },
            },
        },
    },
};

export default [
    docs
];
