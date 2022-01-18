"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var typescript_1 = (0, tslib_1.__importDefault)(require("typescript"));
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
    preProcess: preProcess,
    postProcess: postProcess,
};
var isNamedDeclaration = function (d) {
    return typescript_1.default.isTypeAliasDeclaration(d) || typescript_1.default.isInterfaceDeclaration(d);
};
var defaultConfig = {
    placeholderType: 'unknown',
    routeTypeName: false,
};
/**
 * Simple pre-processor to make sure that every endpoint has an `operationId`.
 * This is important because the `operationId` is used by the main plugin processor.
 * @param _pluginContext
 */
function preProcess(_pluginContext) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
        return (0, tslib_1.__generator)(this, function (_a) {
            return [2 /*return*/, function (contents) {
                    return contents.map(function (schema) {
                        var c = schema.content;
                        Object.keys(c.paths).forEach(function (path) {
                            Object.keys(c.paths[path]).forEach(function (method) {
                                var operationId = c.paths[path][method].operationId;
                                if (!operationId) {
                                    // if operationId isn't specified in the spec
                                    // calculate one from the endpoint's method and path
                                    operationId = "".concat(method).concat(capitalize(path.replace(/\W+/g, '')));
                                    c.paths[path][method].operationId = operationId;
                                }
                            });
                        });
                        return schema;
                    });
                }];
        });
    });
}
function postProcess(pluginContext) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
        return (0, tslib_1.__generator)(this, function (_a) {
            return [2 /*return*/, function (context) {
                    return function (root) {
                        var factory = context.factory;
                        var rawConfig = loadConfig(pluginContext.option, defaultConfig);
                        if (!rawConfig) {
                            return root;
                        }
                        var config = rawConfig;
                        var allMetadata = getOperationMetadata(pluginContext);
                        if (config.routeTypeName) {
                            // add ` import { RequestHanlder } from 'express' `
                            Object.assign(root, {
                                statements: factory.createNodeArray((0, tslib_1.__spreadArray)([
                                    createImportStatement(factory)
                                ], (0, tslib_1.__read)(root.statements), false)),
                            });
                        }
                        return typescript_1.default.visitNode(root, rootVisit);
                        /**
                         * Main purpose of this visitor e just to find the `Paths` **ModuleDeclaration**
                         */
                        function rootVisit(node) {
                            if (typescript_1.default.isModuleDeclaration(node)) {
                                return typescript_1.default.visitEachChild(node, visitPathsBlock, context);
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
                                        ? factory.createKeywordTypeNode(typescript_1.default.SyntaxKind.AnyKeyword)
                                        : factory.createKeywordTypeNode(typescript_1.default.SyntaxKind.UnknownKeyword);
                                    // helper for getting the TS type for a specific param type (path, query, request body, response body)
                                    var paramGetter = getHandlerParamType(node.body, node.name.text, placeholderType_1, factory);
                                    // helper for create an interface property for a specific param type
                                    var createInterfaceProp = function (propName, typeNode) {
                                        return factory.createPropertySignature(undefined, propName, typeNode === placeholderType_1
                                            ? factory.createToken(typescript_1.default.SyntaxKind.QuestionToken)
                                            : undefined, typeNode);
                                    };
                                    var createMetadataProp = function (metadata, prop) {
                                        return factory.createPropertySignature(undefined, prop, undefined, factory.createLiteralTypeNode(factory.createStringLiteral(metadata[prop])));
                                    };
                                    var pathParamsType = paramGetter('PathParameters');
                                    var responsesType = paramGetter('Responses');
                                    var successResponsesType = paramGetter('SuccessResponses');
                                    var bodyType = paramGetter('RequestBody');
                                    var queryParamsType = paramGetter('QueryParameters');
                                    var headersParamsType = paramGetter('HeaderParameters');
                                    // get the metadata (operationId, path, etc.) for the endpoint
                                    var metadata = allMetadata[node.name.text.toLowerCase()];
                                    if (metadata) {
                                        var metadataProps = [
                                            createMetadataProp(metadata, 'operationId'),
                                            createMetadataProp(metadata, 'method'),
                                            createMetadataProp(metadata, 'expressPath'),
                                            createMetadataProp(metadata, 'openapiPath'),
                                        ];
                                        var statements = (0, tslib_1.__spreadArray)((0, tslib_1.__spreadArray)([], (0, tslib_1.__read)(node.body.statements), false), [
                                            // add an interface that completely describes the path (method, params including headers, etc.)
                                            factory.createInterfaceDeclaration(undefined, undefined, 'Config', undefined, undefined, (0, tslib_1.__spreadArray)((0, tslib_1.__spreadArray)([], (0, tslib_1.__read)(metadataProps), false), [
                                                createInterfaceProp('pathParams', pathParamsType),
                                                createInterfaceProp('responses', responsesType),
                                                createInterfaceProp('successResponses', successResponsesType),
                                                createInterfaceProp('requestBody', bodyType),
                                                createInterfaceProp('queryParams', queryParamsType),
                                                createInterfaceProp('headers', headersParamsType),
                                            ], false)),
                                        ], false);
                                        if (config.routeTypeName) {
                                            // add a type that can be used in an Express route
                                            statements.push(factory.createTypeAliasDeclaration(undefined, undefined, config.routeTypeName, undefined, factory.createTypeReferenceNode('RequestHandler', [
                                                pathParamsType,
                                                responsesType,
                                                bodyType,
                                                queryParamsType,
                                            ])));
                                        }
                                        Object.assign(node.body, {
                                            statements: factory.createNodeArray(statements),
                                        });
                                    }
                                }
                            }
                            return node;
                        }
                    };
                }];
        });
    });
}
var getHandlerParamType = function (pathNode, pathName, placeholderType, factory) {
    return function (param) {
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
            var prefix = "".concat(pathName, ".").concat(paramName);
            if (param === 'Responses') {
                // build a union type with all possible responses (both success and errors)
                var types = getArrayOfNamedTypes(paramNode);
                return types.length
                    ? createUnionTypeNode(prefix, types, factory)
                    : placeholderType;
            }
            else if (param === 'SuccessResponses') {
                // build a union type with all possible success responses (most likely there's only one)
                var isSuccessResponse = function (declaration) {
                    return /^\$2\d\d$/.test(declaration.name.text);
                };
                var types = getArrayOfNamedTypes(paramNode).filter(isSuccessResponse);
                return types.length
                    ? createUnionTypeNode(prefix, types, factory)
                    : placeholderType;
            }
            else {
                return factory.createTypeReferenceNode(prefix, undefined);
            }
        }
        else {
            // the given param isn't defined for the route, simply revert to the placeholder type
            return placeholderType;
        }
    };
};
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
function createUnionTypeNode(prefix, statements, factory) {
    return factory.createUnionTypeNode(statements
        .map(function (s) { return "".concat(prefix, ".").concat(s.name.text); })
        .filter(function (n) { return !!n; })
        .map(function (n) { return factory.createTypeReferenceNode(n, undefined); }));
}
function createImportStatement(factory) {
    var namedImport = factory.createNamedImports([
        factory.createImportSpecifier(false, undefined, factory.createIdentifier('RequestHandler')),
    ]);
    var importExpress = factory.createImportDeclaration(undefined, undefined, factory.createImportClause(false, undefined, namedImport), factory.createStringLiteral('express'));
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
    // the implementation of this whole function is really ugly
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
                if (operationId) {
                    var key = operationId.toLowerCase();
                    result[key] = {
                        operationId: operationId,
                        openapiPath: path,
                        expressPath: path.replace(pathParamRegex, ':$1'),
                        method: method,
                    };
                }
                else {
                    console.log("Couldn't extract operationId for ".concat(method, " ").concat(path));
                }
            });
        });
    }
    return result;
}
var capitalize = function (s) { return s.charAt(0).toUpperCase() + s.substring(1); };
exports.default = plugin;
