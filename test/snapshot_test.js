"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var fs_1 = tslib_1.__importDefault(require("fs"));
var path_1 = tslib_1.__importDefault(require("path"));
var typescript_1 = tslib_1.__importDefault(require("typescript"));
var __1 = tslib_1.__importDefault(require(".."));
var assert = require("assert");
var splitStringByNewLine = function (input) {
    var splitted = input.split(/\r?\n/);
    return splitted ? splitted : [];
};
describe('PreProcess Snapshot testing', function () {
    var fixturesDir = path_1.default.join(__dirname, 'pre_snapshots');
    var inputFileName = 'input.json';
    var configFileName = 'config.json';
    var expectedFileName = 'expected.json';
    fs_1.default.readdirSync(fixturesDir, { withFileTypes: true })
        .filter(function (dirent) { return dirent.isDirectory(); })
        .map(function (dirent) {
        var caseName = dirent.name;
        var normalizedTestName = caseName.replace(/-/g, ' ');
        it("Test ".concat(normalizedTestName), function () {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var fixtureDir, inputFilePath, configFilePath, expectedFilePath, inputContent, input, option, context, p, handler, result, actual, expected;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            fixtureDir = path_1.default.join(fixturesDir, caseName);
                            inputFilePath = path_1.default.join(fixtureDir, inputFileName);
                            configFilePath = path_1.default.join(fixtureDir, configFileName);
                            expectedFilePath = path_1.default.join(fixtureDir, expectedFileName);
                            inputContent = fs_1.default.readFileSync(inputFilePath, {
                                encoding: 'utf-8',
                            });
                            input = JSON.parse(inputContent);
                            option = fs_1.default.existsSync(configFilePath)
                                ? require(configFilePath)
                                : {};
                            context = { option: option };
                            p = __1.default.preProcess;
                            if (p == null) {
                                assert.fail('pre process plugin is not configured.');
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, p(context)];
                        case 1:
                            handler = _a.sent();
                            if (handler == null) {
                                assert.fail('factory is not returned.');
                                return [2 /*return*/];
                            }
                            result = handler(input);
                            actual = JSON.stringify(result, null, 2);
                            // When we do `UPDATE_SNAPSHOT=1 npm test`, update snapshot data.
                            if (process.env.UPDATE_SNAPSHOT) {
                                fs_1.default.writeFileSync(expectedFilePath, actual);
                                this.skip();
                                return [2 /*return*/];
                            }
                            expected = fs_1.default.readFileSync(expectedFilePath, {
                                encoding: 'utf-8',
                            });
                            assert.deepEqual(splitStringByNewLine(actual), splitStringByNewLine(expected), "\n".concat(fixtureDir, "\n").concat(actual, "\n"));
                            return [2 /*return*/];
                    }
                });
            });
        });
    });
});
describe('PostProcess Snapshot testing', function () {
    var fixturesDir = path_1.default.join(__dirname, 'post_snapshots');
    var inputFileName = 'input.d.ts';
    var configFileName = 'config.json';
    var expectedFileName = 'expected.d.ts';
    fs_1.default.readdirSync(fixturesDir, { withFileTypes: true })
        .filter(function (dirent) { return dirent.isDirectory(); })
        .map(function (dirent) {
        var caseName = dirent.name;
        var normalizedTestName = caseName.replace(/-/g, ' ');
        it("Test ".concat(normalizedTestName), function () {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var fixtureDir, inputFilePath, configFilePath, expectedFilePath, inputContent, input, option, context, p, factory, result, printer, actual, expected;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            fixtureDir = path_1.default.join(fixturesDir, caseName);
                            inputFilePath = path_1.default.join(fixtureDir, inputFileName);
                            configFilePath = path_1.default.join(fixtureDir, configFileName);
                            expectedFilePath = path_1.default.join(fixtureDir, expectedFileName);
                            inputContent = fs_1.default.readFileSync(inputFilePath, {
                                encoding: 'utf-8',
                            });
                            input = typescript_1.default.createSourceFile('', inputContent, typescript_1.default.ScriptTarget.Latest);
                            option = fs_1.default.existsSync(configFilePath)
                                ? require(configFilePath)
                                : {};
                            context = { option: option };
                            p = __1.default.postProcess;
                            if (p == null) {
                                assert.fail('post process plugin is not configured.');
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, p(context)];
                        case 1:
                            factory = _a.sent();
                            if (factory == null) {
                                assert.fail('factory is not returned.');
                                return [2 /*return*/];
                            }
                            result = typescript_1.default.transform(input, [factory]);
                            result.dispose();
                            printer = typescript_1.default.createPrinter();
                            actual = printer.printFile(input);
                            // uncomment to build a file with the test's result
                            // const outputFilePath = path.join(fixtureDir, 'output.d.ts');
                            // fs.writeFileSync(outputFilePath, actual);
                            // When we do `UPDATE_SNAPSHOT=1 npm test`, update snapshot data.
                            if (process.env.UPDATE_SNAPSHOT) {
                                fs_1.default.writeFileSync(expectedFilePath, actual);
                                this.skip();
                                return [2 /*return*/];
                            }
                            expected = fs_1.default.readFileSync(expectedFilePath, {
                                encoding: 'utf-8',
                            });
                            assert.deepEqual(splitStringByNewLine(actual), splitStringByNewLine(expected), "\n".concat(fixtureDir, "\n").concat(actual, "\n"));
                            return [2 /*return*/];
                    }
                });
            });
        });
    });
});
