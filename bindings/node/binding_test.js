const assert = require("node:assert");
const { test } = require("node:test");

const Parser = require("tree-sitter");

test("can load grammar", () => {
  const parser = new Parser();
  const grammar = require(".");
  grammar.nodeSubclasses = [];

  assert.doesNotThrow(() => parser.setLanguage(grammar));
});
