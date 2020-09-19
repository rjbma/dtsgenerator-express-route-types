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

async function postProcess(
    _: PluginContext
): Promise<ts.TransformerFactory<ts.SourceFile> | undefined> {
    return (context: ts.TransformationContext) => (
        root: ts.SourceFile
    ): ts.SourceFile => {
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
    };
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
            node.body.statements = ts.createNodeArray([
                ...node.body.statements,
                ts.createTypeAliasDeclaration(
                    undefined,
                    undefined,
                    'RouteHandler',
                    undefined,
                    ts.createTypeReferenceNode('RequestHandler', [
                        // path parameters
                        getHandlerParamType(
                            node.body,
                            node.name.text,
                            'PathParameters'
                        ),
                        // response body
                        getHandlerParamType(
                            node.body,
                            node.name.text,
                            'Responses'
                        ),
                        // request body
                        getHandlerParamType(
                            node.body,
                            node.name.text,
                            'RequestBody'
                        ),
                        // query parameters
                        getHandlerParamType(
                            node.body,
                            node.name.text,
                            'QueryParameters'
                        ),
                    ])
                ),
            ]);
        }
    }
    return node;
}

function getHandlerParamType(
    pathNode: ts.ModuleBlock,
    pathName: string,
    param: 'PathParameters' | 'Responses' | 'RequestBody' | 'QueryParameters'
) {
    // see if there is a `RequestBody` type for this path
    // pathNode.statements.filter(s => ts.isTypeReferenceNode(s) && s.typeName.getFullText() == '')
    const paramNode = pathNode.statements.find((s) => {
        if (
            ts.isInterfaceDeclaration(s) ||
            ts.isTypeAliasDeclaration(s) ||
            ts.isModuleDeclaration(s)
        ) {
            return s.name.text === param;
        }
        return undefined;
    });

    if (paramNode) {
        if (param === 'Responses') {
            const responsesBody = (paramNode as ts.ModuleDeclaration).body;
            if (responsesBody && ts.isModuleBlock(responsesBody)) {
                return ts.createUnionTypeNode(
                    responsesBody.statements.map((s) =>
                        ts.createTypeReferenceNode(
                            `Paths.${pathName}.${param}.${
                                ts.isTypeAliasDeclaration(s) ? s.name.text : ''
                            }`,
                            undefined
                        )
                    )
                );
            }
            return ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
        } else {
            return ts.createTypeReferenceNode(
                `Paths.${pathName}.${param}`,
                undefined
            );
        }
    } else {
        return ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
    }
}

export default plugin;
