import { Request, Response, NextFunction } from "express";
import swagger from "swagger-ui-express";
import path from "path";
import { readdirSync } from "fs";
import { getContent } from "./../helpers/file";
import { isEmpty } from "./../helpers/value";

interface SwaggerTag {
    name: string;
    description?: string;
}

interface SwaggerPath {
    [key: string]: any;
}

interface SwaggerMethod {
    get?: { [key:string]: any };
    post?: { [key:string]: any };
    put?: { [key:string]: any };
    patch?: { [key:string]: any };
    delete?: { [key:string]: any };
}

interface SwaggerData {
    path: string;
    method: SwaggerMethod;
}

const setupSwagger = async (req: Request, res: Response, next: NextFunction) => {
    const { secure } = req;
    const host = req.get('host');
    const protocol = secure ? 'https' : 'http';
    const pkg = JSON.parse(getContent('package.json'));
    const basepath = path.resolve('./', 'swagger');

    let tags: SwaggerTag[] = [];
    let paths: SwaggerPath = {};

    const files = readdirSync(basepath).filter((file: string) => file.includes('.') && ['.json'].includes(path.extname(file)));

    await Promise.all(files.map(async (file: string) => {
        let data: SwaggerData[];

        try {
            let filedata = await import(path.join(basepath, file));

            switch (true) {
                case (filedata?.default && Array.isArray(filedata.default)):
                    data = filedata.default;
                    break;
                case (Array.isArray(filedata.default)):
                    data = filedata;
                    break;
                default:
                    data = [];
                    break;
            }
        } catch (err) {
            data = [];
        }

        if (!isEmpty(data)) {
            let pathname = path.parse(file).name;
            let tagname = pathname.replace(/_/g, ' ');

            if (!tags.some(tag => tag.name === tagname)) {
                tags.push({ name: tagname });
            }

            data.forEach((row) => {
                Object.keys(row.method).forEach((method) => {
                    let methodType = method as keyof SwaggerMethod;

                    if (row.method[methodType]) {
                        row.method[methodType].tags = [tagname];
                        row.method[methodType].responses = {
                            200: { description: 'success ok' },
                            201: { description: 'success created' },
                            400: { description: 'bad request' },
                            401: { description: 'unauthorized' },
                            403: { description: 'forbidden' },
                            404: { description: 'not found' },
                            405: { description: 'method not allowed' },
                            429: { description: 'too many request' },
                            500: { description: 'internal server error' }
                        };
                    }

                    switch (row.path) {
                        case '/':
                            paths[`/${pathname}`] = row.method;
                            break;
                        default:
                            paths[`/${pathname}${row.path}`] = row.method;
                            break;
                    }
                });
            });
        }
    }));

    const swaggerDocument =  {
        openapi: '3.0.0',
        info: {
            title: `docs ${pkg?.name}`,
            description: 'this is a list of available apis',
            version: pkg?.version || '1.0.0',
        },
        swagger_ui_extra_configuration: {
            filter: true,
            docExpansion: 'none'
        },
        servers: [
            {
                url: `${protocol}://${host}`,
                description: 'Remote Server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                },
                bearerRefreshAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                },
                apiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'x-api-key'
                }
            }
        },
        tags: tags,
        paths: paths,
        schemes: ['http'],
        consumes: ['application/json'],
        produces: ['application/json']
    };

    return swagger.setup(swaggerDocument, {
        swaggerOptions: {
            validatorUrl: null,
            filter: true,
        },
        customCss: `.swagger-ui .topbar { display: none }`
    })(req, res, next);
};

export default setupSwagger;