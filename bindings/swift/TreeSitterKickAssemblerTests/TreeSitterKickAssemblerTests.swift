import XCTest
import SwiftTreeSitter
import TreeSitterKickassembler

final class TreeSitterKickassemblerTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_kickassembler())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Kick Assembler grammar")
    }
}
