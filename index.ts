import { PreProcessHandler, Plugin, PluginContext, Schema } from 'dtsgenerator';
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
    // Remove the `preProcess` or `postProcess` if that is not needed for this plugin.
    preProcess,
    postProcess,
};

/**
 * This `preProcess` is the hook for the input schema changing.
 */
async function preProcess(
    pluginContext: PluginContext
): Promise<PreProcessHandler | undefined> {
    return (contents: Schema[]): Schema[] => {
        console.log(
            `PreProcess: config=<${JSON.stringify(pluginContext.option)}>`
        );
        return contents;
    };
}

/**
 * This `postProcess` is the hook for the output AST changing.
 */
async function postProcess(
    pluginContext: PluginContext
): Promise<ts.TransformerFactory<ts.SourceFile> | undefined> {
    return (_: ts.TransformationContext) => (
        root: ts.SourceFile
    ): ts.SourceFile => {
        console.log(
            `PostProcess: config=<${JSON.stringify(pluginContext.option)}>`
        );
        return root;
    };
}

export default plugin;
