// Kick Assembler tree-sitter smoke sample
#importonce
#import "constants.asm"

.const DELAY = 7
.var border = BLACK

*=$1000 "Program"
start:
    :BasicUpstart2(start)
    sei
    ldx #10
    ldy #<table
    !loop:
    lda table,x
    sta tmpX:#$d020
    mov16 #intro_irq.an_rti : kernal_nmi_vector
    set_next_raster(i_end,end_frame_irq)
    dex
    bne !loop-
    rts

.macro BasicUpstart(entry) {
    .word entry
}

.function sine(i) {
    .return 127.5 + 127.5 * sin(toRadians(i * 360 / 256))
}

table:
    .byte $01, %00110011, 42, LIGHT_BLUE
    .byte '\n'
    .fill 16, sine(i)

.if (DELAY > 0) {
    .print "delay enabled"
    .print "delay\nenabled with \"quotes\""
} else {
    .errorif DELAY < 0 "negative delay"
}

.namespace Buffers {
    screen: {
        .fill 40, 0
    }

    colour: .fill 40, 0
}

/* block comment */
