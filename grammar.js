/**
 * @file Tree-sitter parser for Kick Assembler
 * @author Chrx
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const caseVariants = (word) => {
  let variants = [""];

  for (const char of word) {
    const lower = char.toLowerCase();
    const upper = char.toUpperCase();
    const chars = lower === upper ? [char] : [lower, upper];
    variants = variants.flatMap((variant) => chars.map((next) => variant + next));
  }

  return variants;
};

const caseInsensitive = (word) => choice(...caseVariants(word));

const opcodes = [
  "aac",
  "aax",
  "adc",
  "adcq",
  "ahx",
  "alr",
  "anc",
  "anc2",
  "and",
  "andq",
  "ane",
  "arr",
  "asl",
  "aslq",
  "aso",
  "asr",
  "asrq",
  "atx",
  "axa",
  "axs",
  "bcc",
  "bcs",
  "beq",
  "bit",
  "bitq",
  "bmi",
  "bne",
  "bpl",
  "bra",
  "brk",
  "bvc",
  "bvs",
  "clc",
  "cld",
  "cle",
  "cli",
  "clv",
  "cmp",
  "cpq",
  "cpx",
  "cpy",
  "cpz",
  "dcm",
  "dcp",
  "dec",
  "deq",
  "dew",
  "dex",
  "dey",
  "dez",
  "dop",
  "eom",
  "eor",
  "eorq",
  "hlt",
  "inc",
  "inq",
  "ins",
  "inw",
  "inx",
  "iny",
  "inz",
  "isb",
  "isc",
  "jam",
  "jmp",
  "jsr",
  "kil",
  "lae",
  "lar",
  "las",
  "lax",
  "lbcc",
  "lbcs",
  "lbeq",
  "lbmi",
  "lbne",
  "lbpl",
  "lbra",
  "lbsr",
  "lbvc",
  "lbvs",
  "lda",
  "ldq",
  "lds",
  "ldx",
  "ldy",
  "ldz",
  "lse",
  "lsr",
  "lsrq",
  "lxa",
  "map",
  "neg",
  "nop",
  "oal",
  "ora",
  "orq",
  "pha",
  "php",
  "phw",
  "phx",
  "phy",
  "phz",
  "pla",
  "plp",
  "plx",
  "ply",
  "plz",
  "rla",
  "rol",
  "rolq",
  "ror",
  "rorq",
  "row",
  "rra",
  "rti",
  "rtn",
  "rts",
  "sac",
  "sax",
  "sbc",
  "sbc2",
  "sbcq",
  "sbx",
  "sec",
  "sed",
  "see",
  "sei",
  "sha",
  "shs",
  "say",
  "shx",
  "shy",
  "sir",
  "skb",
  "slo",
  "skw",
  "sre",
  "sta",
  "stp",
  "stq",
  "stx",
  "sty",
  "stz",
  "sxa",
  "sya",
  "tab",
  "tas",
  "tax",
  "tay",
  "taz",
  "tba",
  "top",
  "trb",
  "tsb",
  "tsx",
  "tsy",
  "txa",
  "txs",
  "tys",
  "tya",
  "tza",
  "wai",
  "xaa",
  "xas",
  ...Array.from({ length: 8 }, (_, i) => `bbr${i}`),
  ...Array.from({ length: 8 }, (_, i) => `bbs${i}`),
  ...Array.from({ length: 8 }, (_, i) => `rmb${i}`),
  ...Array.from({ length: 8 }, (_, i) => `smb${i}`),
];

module.exports = grammar({
  name: "kickassembler",

  word: ($) => $.identifier,

  extras: ($) => [/[ \t\r\f]/, $.comment],

  rules: {
    program: ($) =>
      seq(
        repeat(choice(seq($._statement, $._terminator), $._terminator)),
        optional($._statement),
      ),

    _statement: ($) =>
      choice(
        $.label_block,
        $.block,
        seq(repeat1($.label_definition), optional($._line_statement)),
        $._line_statement,
      ),

    _line_statement: ($) =>
      choice(
        $.program_counter_statement,
        $.preprocessor_statement,
        $.directive_statement,
        $.instruction_statement,
        $.assignment_statement,
        $.macro_call_statement,
        $.expression_statement,
      ),

    _terminator: () => /\n/,

    block: ($) =>
      seq(
        "{",
        repeat(choice(seq($._statement, $._terminator), $._terminator)),
        optional($._statement),
        "}",
      ),

    comment: () =>
      token(
        choice(
          seq("//", /[^\n]*/),
          seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/"),
        ),
      ),

    label_block: ($) => seq(repeat1($.label_definition), $.block),

    label_definition: ($) => prec(2, seq(field("name", choice($.identifier, $.multi_label_name)), ":")),
    multi_label_name: () => token(choice("!", /![A-Za-z_][A-Za-z0-9_]*/)),
    multi_label_reference: () => token(choice(/![A-Za-z_][A-Za-z0-9_]*[+-]*/, /![+-]+/)),

    program_counter_statement: ($) =>
      prec.right(seq(alias($.program_counter_directive, $.directive), repeat($._expression_item))),

    program_counter_directive: () => "*",

    preprocessor_statement: ($) =>
      prec.right(seq(
        $.preprocessor_directive,
        repeat($._expression_item),
        optional($.block),
      )),

    directive_statement: ($) =>
      prec.right(seq($.directive, repeat($._expression_item), optional($.block), optional($.else_clause))),

    else_clause: ($) => seq($.else_keyword, optional($.block)),

    instruction_statement: ($) => prec.right(seq($.opcode, repeat($._expression_item))),

    assignment_statement: ($) =>
      prec.right(seq(field("left", $.identifier), choice("=", "+=", "-=", "*=", "/="), repeat($._expression_item))),

    macro_call_statement: ($) =>
      prec.right(2,
        seq(
          optional(alias($.macro_call_prefix, $.punctuation)),
          field("name", alias($.identifier, $.macro_name)),
          choice(
            seq("(", repeat($._expression_item), ")"),
            repeat1($._expression_item),
          ),
        ),
      ),

    macro_call_prefix: () => ":",

    expression_statement: ($) => prec.right(repeat1($._expression_item)),

    argument_label: ($) => prec(1, seq(field("name", $.identifier), ":", $._expression_item)),

    _expression_item: ($) =>
      choice(
        $.argument_label,
        $.string,
        $.char,
        $.number,
        $.immediate_unary_expression,
        $.immediate_identifier,
        $.boolean,
        $.null,
        $.colour_constant,
        $.opcode_constant,
        $.file_type_constant,
        $.addressing_mode_constant,
        $.cpu_constant,
        $.math_constant,
        $.builtin_function,
        $.type_identifier,
        $.register,
        $.control_keyword,
        $.multi_label_reference,
        $.identifier,
        $.operator,
        $.punctuation,
      ),

    string: ($) => seq('"', optional($.string_content), '"'),
    string_content: () => token.immediate(repeat1(choice(/[^"\\\n]/, /\\./))),

    char: ($) => seq("'", $.char_content, "'"),
    char_content: () => token.immediate(choice(/[^'\\\n]/, /\\./)),

    number: () =>
      token(
        choice(
          /#?\$[0-9a-fA-F]+/,
          /#?%[01]+/,
          /#?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/,
        ),
      ),

    immediate_unary_expression: ($) =>
      seq(alias($.immediate_unary_operator, $.operator), choice($.identifier, $.number)),

    immediate_unary_operator: () => token(choice("#<", "#>")),

    immediate_identifier: () => token(/#@?[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*/),

    boolean: () => token(prec(1, /true|false/i)),
    null: () => token(prec(1, /null/i)),

    identifier: () => token(/@?[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*/),

    directive: () =>
      token(
        prec(
          2,
          /\.(?:align|assert|asserterror|break|by|byte|const|cpu|define|disk|dw|dword|encoding|enum|error|errorif|eval|file|filemodify|filenamespace|fill|fillword|for|function|if|import|importonce|label|lohifill|macro|memblock|modify|namespace|pc|plugin|print|printnow|pseudocommand|pseudopc|return|segment|segmentdef|segmentout|struct|te|text|var|while|wo|word|zp)/i,
        ),
      ),

    preprocessor_directive: () =>
      token(prec(2, /#(?:define|elif|else|endif|if|import|importif|importonce|undef)/i)),

    opcode: () => choice(...opcodes.map(caseInsensitive)),

    register: () => choice(caseInsensitive("a"), caseInsensitive("x"), caseInsensitive("y")),

    else_keyword: () => token(prec(1, /else/i)),
    control_keyword: () => token(prec(1, /var/i)),

    builtin_function: () =>
      token(
        prec(
          1,
          /(?:abs|acos|asin|atan|atan2|cbrt|ceil|cos|cosh|createFile|exp|expm1|floor|getNamespace|hypot|IEEEremainder|LoadBinary|LoadPicture|LoadSid|log|log10|log1p|max|min|mod|MoveMatrix|Matrix|PerspectiveMatrix|pow|random|RotationMatrix|round|ScaleMatrix|signum|sin|sinh|sqrt|tan|tanh|toBinaryString|toDegrees|toHexString|toIntString|toOctalString|toRadians|Vector)/,
        ),
      ),

    type_identifier: () => token(prec(1, /(?:CmdArgument|Hashtable|List|list)/)),

    colour_constant: () =>
      token(
        prec(
          1,
          /#?(?:BLACK|WHITE|RED|CYAN|PURPLE|GREEN|BLUE|YELLOW|ORANGE|BROWN|LIGHT_RED|DARK_GRAY|GRAY|DARK_GREY|GREY|LIGHT_GREEN|LIGHT_BLUE|LIGHT_GRAY|LIGHT_GREY)/,
        ),
      ),

    opcode_constant: () =>
      token(
        prec(
          1,
          /#?(?:ADC|AND|ASL|BIT|CLC|CLD|CLI|CLV|CMP|CPX|CPY|DEC|DEX|DEY|EOR|INC|INX|INY|LDA|LDX|LDY|LSR|NOP|ORA|PHA|PHP|PLA|PLP|ROL|ROR|SBC|SEC|SED|SEI|STA|STX|STY|TAX|TXA|TAY|TYA|TSX|TXS|BCC|BCS|BEQ|BMI|BNE|BPL|BRK|BVC|BVS|JMP|JSR|RTI|RTS)(?:_(?:IMM|ZP|ZPX|ZPY|IZPX|IZPY|ABS|ABSX|ABSY|IND|REL))?/,
        ),
      ),

    file_type_constant: () =>
      token(prec(1, /BF_(?:C64FILE|BITMAP_SINGLECOLOR|KOALA|FLI|DOODLE)/)),

    addressing_mode_constant: () =>
      token(
        prec(
          1,
          /AT_(?:ABSOLUTE|ABSOLUTEX|ABSOLUTEY|IMMEDIATE|INDIRECT|IZEROPAGEX|IZEROPAGEY|NONE)/,
        ),
      ),

    cpu_constant: () => token(prec(1, /(?:_6502NoIllegals|_6502|dtv|_65c02|_65ce02|_45gs02)/)),
    math_constant: () => token(prec(1, /(?:PI|E)/)),

    operator: () =>
      token(choice("||", "==", "!=", "<=", ">=", "&&", "<<", ">>", "++", "--", "..", /[-+*/%<>=&|^~!?]/)),

    punctuation: () => token(choice("(", ")", "[", "]", ",", ";", ":")),
  },
});
