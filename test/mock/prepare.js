const fs = require("fs");
const path = require("path");

const {parseReference} = require("../../src/refParser");
const {rawRef1, rawRef2, rawRef3, rawRef4} = require("./refStrings");


fs.writeFileSync(path.resolve(__dirname, 'ref1.result.json'), JSON.stringify(parseReference(rawRef1), null, 2));

fs.writeFileSync(path.resolve(__dirname, 'ref2.result.json'), JSON.stringify(parseReference(rawRef2), null, 2));

fs.writeFileSync(path.resolve(__dirname, 'ref3.result.json'), JSON.stringify(parseReference(rawRef3), null, 2));

fs.writeFileSync(path.resolve(__dirname, 'ref4.result.json'), JSON.stringify(parseReference(rawRef4), null, 2));
