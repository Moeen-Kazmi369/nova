const { detectWakeWord } = require('./backend/utils/wakeWord');

const tests = [
  { input: "NOVA 1000, what is the weather?",            expectedTriggered: true,  expectedQuestion: "what is the weather?" },
  { input: "nova one thousand what do you think?",       expectedTriggered: true,  expectedQuestion: "what do you think?" },
  { input: "hey nova 1000 tell me about X",              expectedTriggered: true,  expectedQuestion: "tell me about x" },
  { input: "nova one thousand",                          expectedTriggered: true,  expectedQuestion: "" },
  { input: "NOVA 1000.",                                 expectedTriggered: true,  expectedQuestion: "" },
  { input: "nova",                                       expectedTriggered: false, expectedQuestion: "" },
  { input: "nova x quantum",                             expectedTriggered: false, expectedQuestion: "" },
  { input: "nova thousand",                              expectedTriggered: false, expectedQuestion: "" },
  { input: "1000",                                       expectedTriggered: false, expectedQuestion: "" },
  { input: "nova one",                                   expectedTriggered: false, expectedQuestion: "" },
  { input: "",                                           expectedTriggered: false, expectedQuestion: "" },
  { input: "I told nova 1000 earlier that...",           expectedTriggered: true,  expectedQuestion: "earlier that..." },
];

let passed = 0;
let failed = 0;

console.log("=== NOVA 1000 Wake Word Detection — 12-Case Unit Test Suite ===\n");

tests.forEach(({ input, expectedTriggered, expectedQuestion }, i) => {
  const result = detectWakeWord(input);
  const triggeredOk = result.triggered === expectedTriggered;
  // Question comparison is case-insensitive (regex lowercases)
  const questionOk = result.question.toLowerCase() === expectedQuestion.toLowerCase();
  const pass = triggeredOk && questionOk;

  if (pass) {
    console.log(`✅ Test ${i + 1} PASSED: "${input}"`);
    passed++;
  } else {
    console.log(`❌ Test ${i + 1} FAILED: "${input}"`);
    if (!triggeredOk) console.log(`   triggered → expected: ${expectedTriggered}, got: ${result.triggered}`);
    if (!questionOk)  console.log(`   question  → expected: "${expectedQuestion}", got: "${result.question}"`);
    failed++;
  }
});

console.log(`\n=== Results: ${passed}/${tests.length} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
