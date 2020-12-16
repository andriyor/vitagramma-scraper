const fs = require("fs");
const path = require("path");

const {parseReference} = require("../src/refParser");
const {rawRef1, rawRef2, rawRef3, rawRef4} = require("./mock/refStrings");

test('test 1', () => {
  expect(parseReference(rawRef1)).toStrictEqual(JSON.parse(fs.readFileSync(path.resolve(__dirname, "mock/ref1.result.json"))));
});

test('test 2', () => {
  expect(parseReference(rawRef2)).toStrictEqual(JSON.parse(fs.readFileSync(path.resolve(__dirname, "mock/ref2.result.json"))));
});

test('test 3', () => {
  expect(parseReference(rawRef3)).toStrictEqual(JSON.parse(fs.readFileSync(path.resolve(__dirname, "mock/ref3.result.json"))));
});

test('test 4', () => {
  expect(parseReference(rawRef4)).toStrictEqual(JSON.parse(fs.readFileSync(path.resolve(__dirname, "mock/ref4.result.json"))));
});
