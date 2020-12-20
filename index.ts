import { Plugin, PluginContext } from 'dtsgenerator';
import ts from 'typescript';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('./package.json');

/**
 * This file is the main implementation for this plugin.
 * Please edit this implementation.
 */
const plugin: Plugin = {
    meta: {
        name: packageJson.name,
        version: packageJson.version,
        description: packageJson.description,
    },
    postProcess,
};

type NamedDeclaration = ts.TypeAliasDeclaration | ts.InterfaceDeclaration;
const isNamedDeclaration = (d: ts.Statement): d is NamedDeclaration =>
    ts.isTypeAliasDeclaration(d) || ts.isInterfaceDeclaration(d);

interface Config {
    placeholderType: 'any' | 'unknown';
    routeTypeName: string;
}

const defaultConfig: Config = {
    placeholderType: 'unknown',
    routeTypeName: 'Route',
};

async function postProcess(
    pluginContext: PluginContext
): Promise<ts.TransformerFactory<ts.SourceFile> | undefined> {
    return (context: ts.TransformationContext) => (
        root: ts.SourceFile
    ): ts.SourceFile => {
        const rawConfig = loadConfig(pluginContext.option, defaultConfig);
        if (!rawConfig) {
            return root;
        }
        const config = rawConfig as Config;
        const allMetadata = getOperationMetadata(pluginContext);

        // add ` import { RequestHanlder } from 'express' `
        root.statements = ts.createNodeArray([
            createImportStatement(),
            ...root.statements,
        ]);

        return ts.visitNode(root, rootVisit);

        /**
         * Main purpose of this visitor e just to find the `Paths` **ModuleDeclaration**
         */
        function rootVisit(node: ts.Node): ts.Node {
            if (ts.isModuleDeclaration(node)) {
                if (node.name.text === 'Paths') {
                    return ts.visitEachChild(node, visitPathsBlock, context);
                } else {
                    return node;
                }
            } else {
                return ts.visitEachChild(node, rootVisit, context);
            }
        }

        /**
         * Process all the **ModuleBlock** children of the `Paths` **ModuleDeclaration**.
         * Each of those **ModuleBlock**s represent a singe path.
         */
        function visitPathsBlock(node: ts.Node) {
            if (ts.isModuleBlock(node)) {
                return ts.visitEachChild(node, visitPathNode, context);
            } else {
                return node;
            }
        }

        /**
         * Process a single path node, by adding a type declaration for the **Express** route handler.
         *
         * This will look for types (path parameters, responses, request body and query parameters) that are
         * defined for the path, and use `any` for those types that can't be found.
         *
         * For example, for a path like:
         *
         * ```
         * namespace DeletePet {
         *      namespace Parameters {
         *          export type Id = number; // int64
         *      }
         *      export interface PathParameters {
         *          id: Parameters.Id;
         *      }
         *      namespace Responses {
         *          export type Default = Components.Schemas.Error;
         *      }
         *  }
         * ```
         *
         * would produce:
         *
         * ```
         * type RouteHandler = RequestHandler<Paths.DeletePet.PathParameters, Paths.DeletePet.Responses.Default, any, any>;
         * ```
         *
         */
        function visitPathNode(node: ts.Node): ts.Node {
            if (ts.isModuleDeclaration(node)) {
                if (node.body && ts.isModuleBlock(node.body)) {
                    const placeholderType =
                        config.placeholderType == 'any'
                            ? ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
                            : ts.createKeywordTypeNode(
                                  ts.SyntaxKind.UnknownKeyword
                              );
                    // helper for getting the TS type for a specific param type (path, query, request body, response body)
                    const paramGetter = getHandlerParamType(
                        node.body,
                        node.name.text,
                        placeholderType
                    );
                    // helper for create an interface property for a specific param type
                    const createInterfaceProp = (
                        propName: string,
                        typeNode: ts.TypeNode
                    ) =>
                        ts.createPropertySignature(
                            undefined,
                            propName,
                            typeNode === placeholderType
                                ? ts.createToken(ts.SyntaxKind.QuestionToken)
                                : undefined,
                            typeNode,
                            undefined
                        );
                    const createMetadataProp = (
                        metadata: OperationMetadata,
                        prop: keyof OperationMetadata
                    ) =>
                        ts.createPropertySignature(
                            undefined,
                            prop,
                            undefined,
                            ts.createLiteralTypeNode(
                                ts.createStringLiteral(metadata[prop])
                            ),
                            undefined
                        );

                    const pathParamsType = paramGetter('PathParameters');
                    const responsesType = paramGetter('Responses');
                    const successResponsesType = paramGetter(
                        'SuccessResponses'
                    );
                    const bodyType = paramGetter('RequestBody');
                    const queryParamsType = paramGetter('QueryParameters');
                    const headersParamsType = paramGetter('HeaderParameters');
                    const metadata = allMetadata[node.name.text];
                    const metadataProps = metadata
                        ? [
                              createMetadataProp(metadata, 'operationId'),
                              createMetadataProp(metadata, 'method'),
                              createMetadataProp(metadata, 'expressPath'),
                              createMetadataProp(metadata, 'openapiPath'),
                          ]
                        : [];

                    node.body.statements = ts.createNodeArray([
                        // keep all statements already under the path's namespace
                        ...node.body.statements,
                        // add an interface that completely describes the path (method, params including headers, etc.)
                        ts.createInterfaceDeclaration(
                            undefined,
                            undefined,
                            'Config',
                            undefined,
                            undefined,
                            [
                                ...metadataProps,
                                createInterfaceProp(
                                    'pathParams',
                                    pathParamsType
                                ),
                                createInterfaceProp('responses', responsesType),
                                createInterfaceProp(
                                    'successResponses',
                                    successResponsesType
                                ),
                                createInterfaceProp('requestBody', bodyType),
                                createInterfaceProp(
                                    'queryParams',
                                    queryParamsType
                                ),
                                createInterfaceProp(
                                    'headers',
                                    headersParamsType
                                ),
                            ]
                        ),
                        // add a type that can be used in an Express route
                        ts.createTypeAliasDeclaration(
                            undefined,
                            undefined,
                            config.routeTypeName,
                            undefined,
                            ts.createTypeReferenceNode('RequestHandler', [
                                pathParamsType,
                                responsesType,
                                bodyType,
                                queryParamsType,
                            ])
                        ),
                    ]);
                }
            }
            return node;
        }
    };
}

const getHandlerParamType = (
    pathNode: ts.ModuleBlock,
    pathName: string,
    placeholderType: ts.KeywordTypeNode
) => (
    param:
        | 'PathParameters'
        | 'Responses'
        | 'RequestBody'
        | 'QueryParameters'
        | 'HeaderParameters'
        | 'SuccessResponses'
) => {
    // find the route type that corresponds to the given `param`
    // note that when we want the route's `SuccessResponses`, that's really a subset of `Responses`!
    const paramName = param === 'SuccessResponses' ? 'Responses' : param;
    const paramNode = pathNode.statements.find((s) => {
        if (
            ts.isInterfaceDeclaration(s) ||
            ts.isTypeAliasDeclaration(s) ||
            ts.isModuleDeclaration(s)
        ) {
            return s.name.text === paramName;
        }
        return undefined;
    });

    if (paramNode) {
        const prefix = `Paths.${pathName}.${paramName}`;
        if (param === 'Responses') {
            // build a union type with all possible responses (both success and errors)
            const types = getArrayOfNamedTypes(paramNode);
            return types.length
                ? createUnionTypeNode(prefix, types)
                : placeholderType;
        } else if (param === 'SuccessResponses') {
            // build a union type with all possible success responses (most likely there's only one)
            const isSuccessResponse = (declaration: NamedDeclaration) =>
                /^\$2\d\d$/.test(declaration.name.text);
            const types = getArrayOfNamedTypes(paramNode).filter(
                isSuccessResponse
            );
            return types.length
                ? createUnionTypeNode(prefix, types)
                : placeholderType;
        } else {
            return ts.createTypeReferenceNode(prefix, undefined);
        }
    } else {
        // the given param isn't defined for the route, simply revert to the placeholder type
        return placeholderType;
    }
};

/**
 * Gets an array with all the type declarations contained in the given statement
 */
function getArrayOfNamedTypes(statement: ts.Statement): NamedDeclaration[] {
    if (ts.isModuleDeclaration(statement)) {
        const responsesBody = statement.body;
        if (responsesBody && ts.isModuleBlock(responsesBody)) {
            return responsesBody.statements.filter(isNamedDeclaration);
        }
    }
    return [];
}

/**
 * Create a new TS union type from an array of types. For example, turn
 *     [A, B, C]
 * into
 *     A | B | C
 */
function createUnionTypeNode(prefix: string, statements: NamedDeclaration[]) {
    return ts.createUnionTypeNode(
        statements
            .map((s) => `${prefix}.${s.name.text}`)
            .filter((n) => !!n)
            .map((n) => ts.createTypeReferenceNode(n, undefined))
    );
}

function createImportStatement() {
    const namedImport = ts.createNamedImports([
        ts.createImportSpecifier(
            undefined,
            ts.createIdentifier('RequestHandler')
        ),
    ]);
    const importExpress = ts.createImportDeclaration(
        undefined,
        undefined,
        ts.createImportClause(undefined, namedImport),
        ts.createStringLiteral('express')
    );
    return importExpress;
}

function loadConfig(
    config: boolean | Record<string, unknown>,
    defaultConfig: Config
) {
    if (!config) {
        // plugin is not enabled
        return false;
    } else if (config == true) {
        return defaultConfig;
    } else {
        return {
            placeholderType:
                config['defaultConfig'] || defaultConfig.placeholderType,
            routeTypeName:
                config['routeTypeName'] || defaultConfig.routeTypeName,
        } as Config;
    }
}

interface OperationMetadata {
    // the operationId as defined in the OpenAPI spec
    operationId: string;
    // path in OpenAPI format (ie, /users/{userId})
    openapiPath: string;
    // path in Express.js format (ie, /users/:userId)
    expressPath: string;
    // method, lower case (get, post, etc.)
    method: string;
}
/**
 * Get the path and method for each operation in the OpenAPI spec.
 */
function getOperationMetadata(pluginContext: PluginContext) {
    // the implementation of this this whole function is really ugly
    // there surely is some better way to implement the whole thing!
    const result: Record<string, OperationMetadata> = {};
    if (pluginContext.inputSchemas) {
        let paths: any = {};
        let done = false;
        do {
            const iter = pluginContext.inputSchemas.next();
            paths = iter.value[1].rootSchema?.content?.paths || {};
            done = !!iter.done;
        } while (done);

        Object.keys(paths).forEach((path) =>
            Object.keys(paths[path]).forEach((method) => {
                const pathParamRegex = /{([^}]+)}/g;
                const operationId = paths[path][method].operationId;
                result[capitalize(operationId)] = {
                    operationId,
                    openapiPath: path,
                    expressPath: path.replace(pathParamRegex, ':$1'),
                    method,
                };
            })
        );
    }
    return result;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.substring(1);

export default plugin;
