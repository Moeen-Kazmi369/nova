const { performWebSearch } = require("./utils/webSearch");

async function test() {
  console.log("Testing search...");
  const result = await performWebSearch("price of BTC");
  console.log("Result:", result);
}

test();
