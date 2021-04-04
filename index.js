"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var typescript_1 = tslib_1.__importDefault(require("typescript"));
// eslint-disable-next-line @typescript-eslint/no-var-requires
var packageJson = require('./package.json');
/**
 * This file is the main implementation for this plugin.
 * Please edit this implementation.
 */
var plugin = {
    meta: {
        name: packageJson.name,
        version: packageJson.version,
        description: packageJson.description,
    },
    postProcess: postProcess,
};
var isNamedDeclaration = function (d) {
    return typescript_1.default.isTypeAliasDeclaration(d) || typescript_1.default.isInterfaceDeclaration(d);
};
var defaultConfig = {
    placeholderType: 'unknown',
    routeTypeName: 'Route',
};
function postProcess(pluginContext) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            return [2 /*return*/, function (context) { return function (root) {
                    var rawConfig = loadConfig(pluginContext.option, defaultConfig);
                    if (!rawConfig) {
                        return root;
                    }
                    var config = rawConfig;
                    var allMetadata = getOperationMetadata(pluginContext);
                    // add ` import { RequestHanlder } from 'express' `
                    root.statements = typescript_1.default.createNodeArray(tslib_1.__spread([
                        createImportStatement()
                    ], root.statements));
                    return typescript_1.default.visitNode(root, rootVisit);
                    /**
                     * Main purpose of this visitor e just to find the `Paths` **ModuleDeclaration**
                     */
                    function rootVisit(node) {
                        if (typescript_1.default.isModuleDeclaration(node)) {
                            if (node.name.text === 'Paths') {
                                return typescript_1.default.visitEachChild(node, visitPathsBlock, context);
                            }
                            else {
                                return node;
                            }
                        }
                        else {
                            return typescript_1.default.visitEachChild(node, rootVisit, context);
                        }
                    }
                    /**
                     * Process all the **ModuleBlock** children of the `Paths` **ModuleDeclaration**.
                     * Each of those **ModuleBlock**s represent a singe path.
                     */
                    function visitPathsBlock(node) {
                        if (typescript_1.default.isModuleBlock(node)) {
                            return typescript_1.default.visitEachChild(node, visitPathNode, context);
                        }
                        else {
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
                    function visitPathNode(node) {
                        if (typescript_1.default.isModuleDeclaration(node)) {
                            if (node.body && typescript_1.default.isModuleBlock(node.body)) {
                                var placeholderType_1 = config.placeholderType == 'any'
                                    ? typescript_1.default.createKeywordTypeNode(typescript_1.default.SyntaxKind.AnyKeyword)
                                    : typescript_1.default.createKeywordTypeNode(typescript_1.default.SyntaxKind.UnknownKeyword);
                                // helper for getting the TS type for a specific param type (path, query, request body, response body)
                                var paramGetter = getHandlerParamType(node.body, node.name.text, placeholderType_1);
                                // helper for create an interface property for a specific param type
                                var createInterfaceProp = function (propName, typeNode) {
                                    return typescript_1.default.createPropertySignature(undefined, propName, typeNode === placeholderType_1
                                        ? typescript_1.default.createToken(typescript_1.default.SyntaxKind.QuestionToken)
                                        : undefined, typeNode, undefined);
                                };
                                var createMetadataProp = function (metadata, prop) {
                                    return typescript_1.default.createPropertySignature(undefined, prop, undefined, typescript_1.default.createLiteralTypeNode(typescript_1.default.createStringLiteral(metadata[prop])), undefined);
                                };
                                var pathParamsType = paramGetter('PathParameters');
                                var responsesType = paramGetter('Responses');
                                var successResponsesType = paramGetter('SuccessResponses');
                                var bodyType = paramGetter('RequestBody');
                                var queryParamsType = paramGetter('QueryParameters');
                                var headersParamsType = paramGetter('HeaderParameters');
                                var metadata = allMetadata[node.name.text];
                                var metadataProps = metadata
                                    ? [
                                        createMetadataProp(metadata, 'operationId'),
                                        createMetadataProp(metadata, 'method'),
                                        createMetadataProp(metadata, 'expressPath'),
                                        createMetadataProp(metadata, 'openapiPath'),
                                    ]
                                    : [];
                                node.body.statements = typescript_1.default.createNodeArray(tslib_1.__spread(node.body.statements, [
                                    // add an interface that completely describes the path (method, params including headers, etc.)
                                    typescript_1.default.createInterfaceDeclaration(undefined, undefined, 'Config', undefined, undefined, tslib_1.__spread(metadataProps, [
                                        createInterfaceProp('pathParams', pathParamsType),
                                        createInterfaceProp('responses', responsesType),
                                        createInterfaceProp('successResponses', successResponsesType),
                                        createInterfaceProp('requestBody', bodyType),
                                        createInterfaceProp('queryParams', queryParamsType),
                                        createInterfaceProp('headers', headersParamsType),
                                    ])),
                                    // add a type that can be used in an Express route
                                    typescript_1.default.createTypeAliasDeclaration(undefined, undefined, config.routeTypeName, undefined, typescript_1.default.createTypeReferenceNode('RequestHandler', [
                                        pathParamsType,
                                        responsesType,
                                        bodyType,
                                        queryParamsType,
                                    ])),
                                ]));
                            }
                        }
                        return node;
                    }
                }; }];
        });
    });
}
var getHandlerParamType = function (pathNode, pathName, placeholderType) { return function (param) {
    // find the route type that corresponds to the given `param`
    // note that when we want the route's `SuccessResponses`, that's really a subset of `Responses`!
    var paramName = param === 'SuccessResponses' ? 'Responses' : param;
    var paramNode = pathNode.statements.find(function (s) {
        if (typescript_1.default.isInterfaceDeclaration(s) ||
            typescript_1.default.isTypeAliasDeclaration(s) ||
            typescript_1.default.isModuleDeclaration(s)) {
            return s.name.text === paramName;
        }
        return undefined;
    });
    if (paramNode) {
        var prefix = "Paths." + pathName + "." + paramName;
        if (param === 'Responses') {
            // build a union type with all possible responses (both success and errors)
            var types = getArrayOfNamedTypes(paramNode);
            return types.length
                ? createUnionTypeNode(prefix, types)
                : placeholderType;
        }
        else if (param === 'SuccessResponses') {
            // build a union type with all possible success responses (most likely there's only one)
            var isSuccessResponse = function (declaration) {
                return /^\$2\d\d$/.test(declaration.name.text);
            };
            var types = getArrayOfNamedTypes(paramNode).filter(isSuccessResponse);
            return types.length
                ? createUnionTypeNode(prefix, types)
                : placeholderType;
        }
        else {
            return typescript_1.default.createTypeReferenceNode(prefix, undefined);
        }
    }
    else {
        // the given param isn't defined for the route, simply revert to the placeholder type
        return placeholderType;
    }
}; };
/**
 * Gets an array with all the type declarations contained in the given statement
 */
function getArrayOfNamedTypes(statement) {
    if (typescript_1.default.isModuleDeclaration(statement)) {
        var responsesBody = statement.body;
        if (responsesBody && typescript_1.default.isModuleBlock(responsesBody)) {
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
function createUnionTypeNode(prefix, statements) {
    return typescript_1.default.createUnionTypeNode(statements
        .map(function (s) { return prefix + "." + s.name.text; })
        .filter(function (n) { return !!n; })
        .map(function (n) { return typescript_1.default.createTypeReferenceNode(n, undefined); }));
}
function createImportStatement() {
    var namedImport = typescript_1.default.createNamedImports([
        typescript_1.default.createImportSpecifier(undefined, typescript_1.default.createIdentifier('RequestHandler')),
    ]);
    var importExpress = typescript_1.default.createImportDeclaration(undefined, undefined, typescript_1.default.createImportClause(undefined, namedImport), typescript_1.default.createStringLiteral('express'));
    return importExpress;
}
function loadConfig(config, defaultConfig) {
    if (!config) {
        // plugin is not enabled
        return false;
    }
    else if (config == true) {
        return defaultConfig;
    }
    else {
        return {
            placeholderType: config['placeholderType'] || defaultConfig.placeholderType,
            routeTypeName: config['routeTypeName'] || defaultConfig.routeTypeName,
        };
    }
}
/**
 * Get the path and method for each operation in the OpenAPI spec.
 */
function getOperationMetadata(pluginContext) {
    var _a, _b;
    // the implementation of this this whole function is really ugly
    // there surely is some better way to implement the whole thing!
    var result = {};
    if (pluginContext.inputSchemas) {
        var paths_1 = {};
        var done = false;
        do {
            var iter = pluginContext.inputSchemas.next();
            paths_1 = ((_b = (_a = iter.value[1].rootSchema) === null || _a === void 0 ? void 0 : _a.content) === null || _b === void 0 ? void 0 : _b.paths) || {};
            done = !!iter.done;
        } while (done);
        Object.keys(paths_1).forEach(function (path) {
            return Object.keys(paths_1[path]).forEach(function (method) {
                var pathParamRegex = /{([^}]+)}/g;
                var operationId = paths_1[path][method].operationId;
                result[capitalize(operationId)] = {
                    operationId: operationId,
                    openapiPath: path,
                    expressPath: path.replace(pathParamRegex, ':$1'),
                    method: method,
                };
            });
        });
    }
    return result;
}
var capitalize = function (s) { return s.charAt(0).toUpperCase() + s.substring(1); };
exports.default = plugin;
