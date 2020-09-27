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
var defaultConfig = {
    placeholderType: 'unknown',
    routeTypeName: 'Route',
};
function postProcess(_) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            return [2 /*return*/, function (context) { return function (root) {
                    var rawConfig = loadConfig(_.option, defaultConfig);
                    if (!rawConfig) {
                        return root;
                    }
                    var config = rawConfig;
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
                                node.body.statements = typescript_1.default.createNodeArray(tslib_1.__spread(node.body.statements, [
                                    typescript_1.default.createTypeAliasDeclaration(undefined, undefined, config.routeTypeName, undefined, typescript_1.default.createTypeReferenceNode('RequestHandler', [
                                        // path parameters
                                        getHandlerParamType(node.body, node.name.text, 'PathParameters', config),
                                        // response body
                                        getHandlerParamType(node.body, node.name.text, 'Responses', config),
                                        // request body
                                        getHandlerParamType(node.body, node.name.text, 'RequestBody', config),
                                        // query parameters
                                        getHandlerParamType(node.body, node.name.text, 'QueryParameters', config),
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
function getHandlerParamType(pathNode, pathName, param, config) {
    var placeholderType = config.placeholderType == 'any'
        ? typescript_1.default.SyntaxKind.AnyKeyword
        : typescript_1.default.SyntaxKind.UnknownKeyword;
    // see if there is a `RequestBody` type for this path
    // pathNode.statements.filter(s => ts.isTypeReferenceNode(s) && s.typeName.getFullText() == '')
    var paramNode = pathNode.statements.find(function (s) {
        if (typescript_1.default.isInterfaceDeclaration(s) ||
            typescript_1.default.isTypeAliasDeclaration(s) ||
            typescript_1.default.isModuleDeclaration(s)) {
            return s.name.text === param;
        }
        return undefined;
    });
    if (paramNode) {
        if (param === 'Responses') {
            var responsesBody = paramNode.body;
            if (responsesBody && typescript_1.default.isModuleBlock(responsesBody)) {
                return typescript_1.default.createUnionTypeNode(responsesBody.statements
                    .map(function (s) {
                    return typescript_1.default.isTypeAliasDeclaration(s) ||
                        typescript_1.default.isInterfaceDeclaration(s)
                        ? "Paths." + pathName + "." + param + "." + s.name.text
                        : '';
                })
                    .filter(function (n) { return !!n; })
                    .map(function (n) { return typescript_1.default.createTypeReferenceNode(n, undefined); }));
            }
            return typescript_1.default.createKeywordTypeNode(placeholderType);
        }
        else {
            return typescript_1.default.createTypeReferenceNode("Paths." + pathName + "." + param, undefined);
        }
    }
    else {
        return typescript_1.default.createKeywordTypeNode(placeholderType);
    }
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
            placeholderType: config['defaultConfig'] || defaultConfig.placeholderType,
            routeTypeName: config['routeTypeName'] || defaultConfig.routeTypeName,
        };
    }
}
exports.default = plugin;
