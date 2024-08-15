const docs = {
    path: '/',
    method: {
        get: {
            security: [{ bearerAuth: [] }],
            summary: 'get faq data',
            parameters: [
                {
                    in: 'query',
                    name: 'intent',
                    schema: { type: 'string' }
                },
                {
                    in: 'query',
                    name: 'language_id',
                    schema: { type: 'integer' }
                },
                {
                    in: 'query',
                    name: 'is_active',
                    schema: { nullable: true, type: 'integer', enum: ['0', '1'] }
                },
                {
                    in: 'query',
                    name: 'created',
                    schema: { type: 'date' }
                },
                {
                    in: 'query',
                    name: 'created_by',
                    schema: { type: 'integer' }
                },
                {
                    in: 'query',
                    name: 'updated_by',
                    schema: { type: 'integer' }
                },
                {
                    in: 'query',
                    name: 'start',
                    schema: { type: 'timestamp' },
                    default: Date.parse(new Date()) / 1000
                },
                {
                    in: 'query',
                    name: 'end',
                    schema: { type: 'timestamp' },
                    default: Date.parse(new Date()) / 1000
                },
            ],
        },
        post: {
            security: [{ bearerAuth: [] }],
            summary: 'create new faq data',
            requestBody: {
                content: {
                    'application/x-www-form-urlencoded': {
                        schema: {
                            type: 'object',
                            properties: {
                                intent: { type: 'string', default: '' },
                                language_id: { type: 'integer', default: '' },
                            },
                            required: ['intent', 'faq_category_id', 'language_id'],
                        },
                    },
                },
            },
        },
    },
};

const docsById = {
    path: '/{id}',
    method: {
        get: {
            security: [{ bearerAuth: [] }],
            summary: 'get faq data by id',
            parameters: [
                {
                    in: 'path',
                    name: 'id',
                    schema: { type: 'integer' },
                    required: true
                },
            ],
        },
        patch: {
            security: [{ bearerAuth: [] }],
            summary: 'update existing faq data by id',
            requestBody: {
                content: {
                    'application/x-www-form-urlencoded': {
                        schema: {
                            type: 'object',
                            properties: {
                                intent: { type: 'string', default: '' },
                                language_id: { type: 'integer', default: '' },
                                is_active: { type: 'integer', default: '', enum: ['0', '1'] },
                            },
                        },
                    },
                },
            },
        },
    },
};

const docImport = {
    path: '/import',
    method: {
        post: {
            security: [{ bearerAuth: [] }],
            summary: 'import faq data',
            requestBody: {
                content: {
                    'multipart/form-data': {
                        schema: {
                            type: 'object',
                            properties: {
                                file: { type: 'string', format: 'binary', description: 'must be .xlsx' },
                            },
                            required: ['file'],
                        }
                    }
                },
            },
        },
    },
};

const docTrain = {
    path: '/train',
    method: {
        post: {
            security: [{ bearerAuth: [] }],
            summary: 'train network from faq data',
        },
    },
};

export default [
    docs,
    docsById,
    docImport,
    docTrain
];
