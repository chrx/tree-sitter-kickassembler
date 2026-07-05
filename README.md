# tree-sitter-kickassembler

A [tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar for [Kick Assembler](https://www.theweb.dk/KickAssembler).

The grammar is intended to support editor integrations, including the companion Zed extension at <https://github.com/chrx/zed-kickassembler>.

## Status

This parser covers the common Kick Assembler version 5.25 syntax used in C64 projects:

- 6502-family opcodes, registers, labels, local/anonymous labels, and program counter statements
- Kick Assembler directives such as `.const`, `.var`, `.macro`, `.function`, `.if`, `.namespace`, `.segment`, `.fill`, and import directives
- Macro calls with whitespace-separated arguments and parenthesized argument lists
- Brace-backed labels such as `irq_handler: { ... }`, which are useful for editor outline and text-object features
- Strings, character literals, line comments, and block comments

It is not a full assembler implementation. It does not resolve symbols, expand
macros, evaluate expressions, or validate whether code assembles.

## Development

Install the official tree-sitter CLI: <https://tree-sitter.github.io/tree-sitter/creating-parsers/1-getting-started.html>

Regenerate parser sources after changing `grammar.js`:

```sh
tree-sitter generate --js-runtime native
```

Run the tests:

```sh
tree-sitter test
```

Update fixtures after parse tree changes:

```sh
tree-sitter test --update
```

Parse the smoke sample:

```sh
tree-sitter parse examples/smoke.asm
```

Build the C library artifacts:

```sh
make
```

Build a WASM grammar artifact when needed by an editor integration:

```sh
tree-sitter build --wasm
```

That command requires 'emcc', Docker, or Podman to be available on 'PATH'.

## Repository Layout

- 'grammar.js' - grammar source
- 'src/parser.c', 'src/grammar.json', 'src/node-types.json' - generated parser files
- 'test/corpus/' - parser corpus tests
- 'examples/' - sample Kick Assembler source used for smoke testing
- 'bindings/' - generated language bindings

## Zed Extension Workflow

The Zed extension pins this parser by commit SHA in its `extension.toml`.
After parser changes are committed and pushed, update the `rev` in the
extension repository to the new parser commit.

## License

MIT
