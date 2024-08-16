const docsFaqs = {
    path: '/faqs',
    method: {
        get: {
            security: [{ bearerAuth: [] }],
            summary: 'export faq data',
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
    },
};

export default [
    docsFaqs
];
