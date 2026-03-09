import { describe, it, expect } from "vitest";
import {
  countArguments,
  startsWithArray,
  isSimpleString,
} from "../../src/tree/argument-scanner.js";

describe("ArgumentScanner", () => {
  describe("countArguments", () => {
    it("counts basic comma-separated arguments", () => {
      expect(countArguments("$a, $b, $c")).toBe(3);
      expect(countArguments("$a")).toBe(1);
      expect(countArguments("")).toBe(0);
      expect(countArguments("   ")).toBe(0);
    });

    it("respects nested brackets", () => {
      const input1 =
        '["one, two", $var1, $var2], $hello, 12345.23, bar, baz, (1,2,3,4,), "foo, bar, baz"';
      expect(countArguments(input1)).toBe(7);

      const input2 =
        '[["one, two", $var1, $var2], $hello, 12345.23, bar, baz, (1,2,3,4,), "foo, bar, baz"]';
      expect(countArguments(input2)).toBe(1);
    });

    it("respects nested parentheses", () => {
      const input1 =
        '(["one, two", $var1, $var2], $hello, 12345.23, bar, baz, (1,2,3,4,), "foo, bar, baz")';
      expect(countArguments(input1)).toBe(1);

      expect(countArguments("func($a, $b), other($c, $d)")).toBe(2);
    });

    it("handles deeply nested structures", () => {
      const input1 =
        '[[[[[["one, two", $var1, $var2], $hello, 12345.23]]]]], [bar, baz, (1,2,3,4,), "foo, bar, baz"]';
      expect(countArguments(input1)).toBe(2);

      const input2 =
        '[[[[[["one, two", $var1, $var2], $hello, 12345.23]]]]], [bar, baz, (1,2,3,4,), "foo, bar, baz"], (true == false) ? $this : $that';
      expect(countArguments(input2)).toBe(3);
    });

    it("handles strings with commas", () => {
      expect(countArguments('"hello, world", $var')).toBe(2);
      expect(countArguments("'hello, world', $var")).toBe(2);
      expect(countArguments('"a, b, c"')).toBe(1);
    });

    it("handles escaped quotes in strings", () => {
      expect(countArguments('"hello \\"world\\", test", $var')).toBe(2);
      expect(countArguments("'hello \\'world\\', test', $var")).toBe(2);
    });

    it("handles heredoc with commas inside", () => {
      const input = "<<<EOT\nHello, world, test\nEOT;, $other";
      expect(countArguments(input)).toBe(2);
    });

    it("handles nowdoc with commas inside", () => {
      const input = "<<<'TXT'\nHello, world, test\nTXT;, $other";
      expect(countArguments(input)).toBe(2);
    });

    it("handles mixed braces", () => {
      expect(countArguments("[$a, $b], {$c, $d}, ($e, $f)")).toBe(3);
    });

    it("handles UTF-8 multi-byte characters in strings", () => {
      expect(countArguments('"こんにちは", $var')).toBe(2);
      expect(countArguments('"你好世界", "测试"')).toBe(2);
      expect(countArguments('"Hello 🌍", "World 🎉"')).toBe(2);
      expect(countArguments('"Привет мир", "مرحبا", "שלום"')).toBe(3);
    });

    it("handles UTF-8 in array keys", () => {
      expect(countArguments("['キー' => 'バリュー', 'другой' => 'значение']")).toBe(1);
    });

    it("handles 4-byte UTF-8 sequences (emojis)", () => {
      expect(countArguments('"🎉🎊🎈", "🌟⭐✨", "🔥💧🌍"')).toBe(3);
    });

    it("handles very long argument strings", () => {
      const items = Array.from({ length: 1000 }, (_, i) => `$var${i + 1}`);
      expect(countArguments(items.join(", "))).toBe(1000);
    });

    it("handles deeply nested structures (100 levels)", () => {
      const input = "[".repeat(100) + "$value" + "]".repeat(100);
      expect(countArguments(input)).toBe(1);
    });

    it("handles many heredocs", () => {
      const input =
        "<<<A\ncontent1\nA;, <<<B\ncontent2\nB;, <<<C\ncontent3\nC;, <<<D\ncontent4\nD;, <<<E\ncontent5\nE;";
      expect(countArguments(input)).toBe(5);
    });

    it("handles alternating quote types", () => {
      expect(countArguments(`"a, b", 'c, d', "e, f", 'g, h', "i, j"`)).toBe(5);
    });

    it("handles empty strings in sequence", () => {
      expect(countArguments('"", "", "", ""')).toBe(4);
    });

    it("handles complex real-world examples", () => {
      const input1 =
        "$condition ? array_map(fn($x) => $x * 2, [1, 2, 3]) : collect([4, 5, 6])->filter(fn($y) => $y > 4), $default";
      expect(countArguments(input1)).toBe(2);

      const input2 = "['callback' => fn($a, $b) => $a + $b, 'data' => [1, 2, 3]], $options";
      expect(countArguments(input2)).toBe(2);
    });

    it("handles unclosed strings gracefully", () => {
      expect(countArguments('"unclosed, $var')).toBeGreaterThanOrEqual(1);
    });

    it("handles unclosed brackets gracefully", () => {
      expect(countArguments("[$a, $b, $c")).toBeGreaterThanOrEqual(1);
    });

    it("handles numeric strings", () => {
      expect(countArguments("123, 456, 789")).toBe(3);
      expect(countArguments("12.34, 56.78")).toBe(2);
    });

    it("handles boolean and null literals", () => {
      expect(countArguments("true, false, null")).toBe(3);
    });

    it("handles arrow functions", () => {
      expect(countArguments("fn($x) => $x * 2, fn($y) => $y + 1")).toBe(2);
      expect(countArguments("fn($a, $b) => [$a, $b]")).toBe(1);
    });

    it("handles spread operator", () => {
      expect(countArguments("...$array, $single")).toBe(2);
    });
  });

  describe("startsWithArray", () => {
    it("detects array notation", () => {
      expect(startsWithArray("[1, 2, 3]")).toBe(true);
      expect(startsWithArray("  [1, 2, 3]")).toBe(true);
      expect(startsWithArray("\t\n[1, 2, 3]")).toBe(true);
    });

    it("returns false for non-array", () => {
      expect(startsWithArray("'key'")).toBe(false);
      expect(startsWithArray('"key"')).toBe(false);
      expect(startsWithArray("$variable")).toBe(false);
      expect(startsWithArray("123")).toBe(false);
      expect(startsWithArray("")).toBe(false);
    });
  });

  describe("isSimpleString", () => {
    it("detects simple single-quoted strings", () => {
      expect(isSimpleString("'hello'")).toBe(true);
      expect(isSimpleString("'messages.welcome'")).toBe(true);
      expect(isSimpleString("  'hello'  ")).toBe(true);
    });

    it("detects simple double-quoted strings", () => {
      expect(isSimpleString('"hello"')).toBe(true);
      expect(isSimpleString('"messages.welcome"')).toBe(true);
      expect(isSimpleString('  "hello"  ')).toBe(true);
    });

    it("handles strings with escaped quotes", () => {
      expect(isSimpleString("'hello\\'s world'")).toBe(true);
      expect(isSimpleString('"hello \\"world\\""')).toBe(true);
    });

    it("returns false for complex expressions", () => {
      expect(isSimpleString("'hello', 'world'")).toBe(false);
      expect(isSimpleString("['key']")).toBe(false);
      expect(isSimpleString("$variable")).toBe(false);
      expect(isSimpleString("'hello' . 'world'")).toBe(false);
      expect(isSimpleString("")).toBe(false);
    });

    it("works with UTF-8", () => {
      expect(isSimpleString('"日本語"')).toBe(true);
      expect(isSimpleString("'العربية'")).toBe(true);
      expect(isSimpleString('"🎯 Target"')).toBe(true);
      expect(isSimpleString('"🎉🎊🎈"')).toBe(true);
    });

    it("handles only whitespace inside quotes", () => {
      expect(isSimpleString('"   "')).toBe(true);
    });

    it("handles single character strings", () => {
      expect(isSimpleString('"x"')).toBe(true);
    });
  });
});
