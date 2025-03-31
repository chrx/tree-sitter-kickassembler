/**
 * @file Tree sitter parser for Kick Assembler
 * @author Chrx
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "kickassembler",

  extras: ($) => [$.comment, /\s/],

  // conflicts: ($) => [
  //   [$.operand_8, $.operand_16],
  //   // [$.operand_8, $.operand_16, $.define_ctrl_cmd],
  // ],

  rules: {
    program: ($) => repeat(choice($.statement)),
    comment: ($) => token(seq("//", /.*/)),
    string: ($) => choice(/"[^"]*"/, /'[^']*'/),
    block: ($) => seq("{", repeat($.statement), "}"),
    statement: ($) => choice($.block, $.label, $.inst, $.command),

    acc_register: ($) => /a/i,
    x_register: ($) => /x/i,
    y_register: ($) => /y/i,

    inst: ($) =>
      seq(
        choice(
          $.opcode,
          $.data,
          $.math,
          $.file,
          $.threed,
          $.storage,
          $.object,
          $.function,
          $.preprocessor,
        ),
        /.*/,
        choice("\n", ";"),
      ),

    label: ($) => /\s*(!)|(!?([A-Za-z_][A-Za-z0-9_]*)+)\:/,
    symbol: ($) => /[A-Za-z_@!][A-Za-z0-9_\.]*/,

    command: ($) =>
      choice(
        $.byte,
        $.word,
        $.text,
        $.import,
        $.memblock,
        $.namespace,
        $.macro,
        $.storage,
      ),

    byte: ($) =>
      seq(
        /\.byte/,
        choice($.operand_8, seq(repeat(seq($.operand_8, ",")), $.operand_8)),
      ),
    word: ($) =>
      seq(/\.word/i, choice($.operand_16, repeat(seq($.operand_16, ",")))),

    text: ($) => seq(/\.text/i, $.string),

    import: ($) => seq(choice(/#import/, /#importonce/), optional($.string)),
    memblock: ($) => seq(/\.memblock/, $.string),
    namespace: ($) => seq(/\.namespace/, $.symbol),
    macro_name: ($) =>
      seq(/[A-Za-z_@!][A-Za-z0-9_\.]*/, "(", repeat($.symbol), ")"),
    macro: ($) => seq(/\.macro/, $.macro_name),

    storage: ($) => seq(choice(/\.var/, /\.label/, /\.const/), $.symbol, "="),

    //.label animation_type_single = 1<<4

    /**
     * Operand with an 8-bit value.
     */
    operand_8: ($) =>
      choice(
        $.bin_8,
        $.dec_8,
        $.hex_8,
        // $.symbol,
        $.colour,
        $.opcode_imm,
        $.file_type,
      ),

    /**
     * 8-bit binary length number.
     */
    bin_8: ($) => seq("%", /0*[01]{1,8}/),

    /**
     * 8-bit decimal length number.
     */
    dec_8: ($) => /0*(25[0-5]|2[0-4][0-9]|[01]?[0-9]{1,2})/,

    /**
     * 8-bit hexadecimal length number.
     */
    hex_8: ($) =>
      choice(
        seq(choice("$", "h"), /0*[0-9a-fA-F]{1,2}/),
        /0*[0-9a-fA-F]{1,2}h/,
      ),

    colour: ($) =>
      /BLACK|WHITE|RED|CYAN|PURPLE|GREEN|BLUE|YELLOW|ORANGE|BROWN|LIGHT_RED|DARK_GRAY|GRAY|DARK_GREY|GREY|LIGHT_GREEN|LIGHT_BLUE|LIGHT_GRAY|LIGHT_GREY/,

    opcode_imm: ($) =>
      /LDA_IMM|LDA_ZP|LDA_ZPX|LDX_ZPY|LDA_IZPX|LDA_IZPY|LDA_ABS|LDA_ABSX|LDA_ABSY|JMP_IND|BNE_REL|RTS/,

    file_type: ($) => /BF_C64FILE|BF_BITMAP_SINGLECOLOR|BF_KOALA|BF_FLI/,

    /**
     * Operand with a 16-bit length value.
     */
    operand_16: ($) =>
      choice(
        $.bin_16,
        $.dec_16,
        $.hex_16,
        // $.symbol,
        $.colour,
        $.opcode_imm,
        $.file_type,
      ),

    /**
     * 16-bit length binary number.
     */
    bin_16: ($) => seq("%", /0*[01]{9,16}/),

    /**
     * 16-bit length decimal number.
     */
    dec_16: ($) =>
      /0*(6553[0-5]|655[0-2]\d|65[0-4]\d{2}|6[0-4]\d{3}|[1-5]?\d{1,4})/,

    /**
     * 16-bit length hexadecimal number.
     */
    hex_16: ($) => seq(choice("$", "h"), /0*[0-9a-fA-F]{3,4}/),

    imm_prefix: ($) => "#",

    opcode: ($) => choice($._opcode, $._illegal, $._control),

    _opcode: ($) =>
      /adc|and|asl|bit|clc|cld|cli|clv|cmp|cpx|cpy|dec|dex|dey|eor|inc|inx|iny|lda|ldx|ldy|lsr|nop|ora|pha|php|pla|plp|rol|ror|sbc|sec|sed|sei|sta|stx|sty|tax|txa|tay|tya|tsx|txs/i,

    _illegal: ($) =>
      /aac|aax|alr|anc|ane|arr|aso|asr|atx|axa|axs|dcm|dcp|dop|hlt|ins|isb|isc|jam|kil|lae|lar|las|lax|lse|lxa|oal|rla|rra|sax|sbx|skb|sha|shs|say|shx|shy|slo|skw|sre|sxa|sya|tas|top|xaa|xas/i,

    _control: ($) => /bcc|bcs|beq|bmi|bne|bpl|brk|bvc|bvs|jmp|jsr|rti|rts/i,

    data: ($) => /\.(word|byte|text|dword)/i,

    math: ($) =>
      /abs|acos|asin|atan|atan2|cbrt|ceil|cos|cosh|exp|expm1|floor|hypot|IEEEremainder|log|log10|log1p|max|min|pow|mod|random|round|signum|sin|sinh|sqrt|tan|tanh|toDegrees|toRadians/,

    file: ($) => /LoadBinary|LoadPicture|LoadSid|createFile/,

    threed: ($) =>
      /Matrix|RotationMatrix|ScaleMatrix|MoveMatrix|PerspectiveMatrix|Vector/,

    object: ($) => /\.(struct|enum)/i,

    function: ($) =>
      /\.(eval|fill|print|printnow|align|assert|asserterror|error)/,

    preprocessor: ($) => /\.(pc|pseudopc|return|eval)/i,
  },
});
