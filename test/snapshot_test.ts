import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import { PluginContext } from 'dtsgenerator';
import plugin from '..';

import assert = require('assert');

const splitStringByNewLine = (input: string): string[] => {
    const splitted = input.split(/\r?\n/);
    return splitted ? splitted : [];
} 

describe('PreProcess Snapshot testing', () => {
    const fixturesDir = path.join(__dirname, 'pre_snapshots');
    const inputFileName = 'input.json';
    const configFileName = 'config.json';
    const expectedFileName = 'expected.json';

    fs.readdirSync(fixturesDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => {
            const caseName = dirent.name;
            const normalizedTestName = caseName.replace(/-/g, ' ');

            it(`Test ${normalizedTestName}`, async function () {
                const fixtureDir = path.join(fixturesDir, caseName);
                const inputFilePath = path.join(fixtureDir, inputFileName);
                const configFilePath = path.join(fixtureDir, configFileName);
                const expectedFilePath = path.join(
                    fixtureDir,
                    expectedFileName
                );

                const inputContent = fs.readFileSync(inputFilePath, {
                    encoding: 'utf-8',
                });
                const input = JSON.parse(inputContent);
                const option = fs.existsSync(configFilePath)
                    ? require(configFilePath)
                    : {};

                const context = { option } as PluginContext;
                const p = plugin.preProcess;
                if (p == null) {
                    assert.fail('pre process plugin is not configured.');
                    return;
                }
                const handler = await p(context);
                if (handler == null) {
                    assert.fail('factory is not returned.');
                    return;
                }

                const result = handler(input);
                const actual = JSON.stringify(result, null, 2);

                // When we do `UPDATE_SNAPSHOT=1 npm test`, update snapshot data.
                if (process.env.UPDATE_SNAPSHOT) {
                    fs.writeFileSync(expectedFilePath, actual);
                    this.skip();
                    return;
                }
                const expected = fs.readFileSync(expectedFilePath, {
                    encoding: 'utf-8',
                });
                assert.deepEqual(
                    splitStringByNewLine(actual),
                    splitStringByNewLine(expected),
                    `
${fixtureDir}
${actual}
`
                );
            });
        });
});

describe('PostProcess Snapshot testing', () => {
    const fixturesDir = path.join(__dirname, 'post_snapshots');
    const inputFileName = 'input.d.ts';
    const configFileName = 'config.json';
    const expectedFileName = 'expected.d.ts';

    fs.readdirSync(fixturesDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => {
            const caseName = dirent.name;
            const normalizedTestName = caseName.replace(/-/g, ' ');

            it(`Test ${normalizedTestName}`, async function () {
                const fixtureDir = path.join(fixturesDir, caseName);
                const inputFilePath = path.join(fixtureDir, inputFileName);
                const configFilePath = path.join(fixtureDir, configFileName);
                const expectedFilePath = path.join(
                    fixtureDir,
                    expectedFileName
                );

                const inputContent = fs.readFileSync(inputFilePath, {
                    encoding: 'utf-8',
                });
                const input = ts.createSourceFile(
                    '',
                    inputContent,
                    ts.ScriptTarget.Latest
                );
                const option = fs.existsSync(configFilePath)
                    ? require(configFilePath)
                    : {};

                const context = { option } as PluginContext;
                const p = plugin.postProcess;
                if (p == null) {
                    assert.fail('post process plugin is not configured.');
                    return;
                }
                const factory = await p(context);
                if (factory == null) {
                    assert.fail('factory is not returned.');
                    return;
                }

                const result = ts.transform(input, [factory]);
                result.dispose();
                const printer = ts.createPrinter();
                const actual = printer.printFile(input);

                // When we do `UPDATE_SNAPSHOT=1 npm test`, update snapshot data.
                if (process.env.UPDATE_SNAPSHOT) {
                    fs.writeFileSync(expectedFilePath, actual);
                    this.skip();
                    return;
                }
                const expected = fs.readFileSync(expectedFilePath, {
                    encoding: 'utf-8',
                });
                assert.deepEqual(
                   splitStringByNewLine(actual),
                   splitStringByNewLine(expected),
                    `
${fixtureDir}
${actual}
`
                );
            });
        });
});
