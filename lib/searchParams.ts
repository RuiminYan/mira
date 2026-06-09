import { createParser } from "nuqs/server";

/**
 * 复选框旗标 parser:URL 里以 `=1` 表示 true(沿用站内既有可分享链接契约)。
 * 缺省即视为 false,true 序列化为 `1`。用法:`parseAsFlag.withDefault(false)`。
 */
export const parseAsFlag = createParser({
  parse: (v) => v === "1",
  serialize: (v) => (v ? "1" : ""),
});
