import { MathEngine } from './js/mathEngine.js';
import { Formatter } from './js/formatter.js';

const degEngine = new MathEngine({ angleMode: 'DEG' });
const radEngine = new MathEngine({ angleMode: 'RAD' });

const testCases = [
  [degEngine, '12.5 + 7.5', 20],
  [degEngine, '100 - 35.5', 64.5],
  [degEngine, '-15 + 5', -10],
  [degEngine, '12 * 8', 96],
  [degEngine, '12 × 8', 96],
  [degEngine, '144 / 12', 12],
  [degEngine, '144 ÷ 12', 12],
  [degEngine, '50%', 0.5],
  [degEngine, '25% * 200', 50],
  [degEngine, '(5 + 3) * (10 - 2)', 64],
  [degEngine, '2 + 3 * 4 ^ 2', 50],
  [degEngine, '2 ^ 10', 1024],
  [degEngine, '3 ^ 3', 27],
  [degEngine, 'sqrt(144)', 12],
  [degEngine, 'cbrt(125)', 5],
  [degEngine, 'cbrt(-8)', -2],
  [degEngine, '0!', 1],
  [degEngine, '1!', 1],
  [degEngine, '5!', 120],
  [degEngine, '10!', 3628800],
  [degEngine, 'log(1000)', 3],
  [degEngine, 'log(1)', 0],
  [degEngine, 'ln(e)', 1],
  [degEngine, 'exp(0)', 1],
  [degEngine, 'abs(-99.9)', 99.9],
  [degEngine, 'sin(0)', 0],
  [degEngine, 'sin(30)', 0.5],
  [degEngine, 'sin(90)', 1],
  [degEngine, 'sin(180)', 0],
  [degEngine, 'sin(270)', -1],
  [degEngine, 'cos(0)', 1],
  [degEngine, 'cos(60)', 0.5],
  [degEngine, 'cos(90)', 0],
  [degEngine, 'cos(180)', -1],
  [degEngine, 'tan(0)', 0],
  [degEngine, 'tan(45)', 1],
  [degEngine, 'asin(0.5)', 30],
  [degEngine, 'acos(0.5)', 60],
  [degEngine, 'atan(1)', 45],
  [radEngine, 'sin(pi / 2)', 1],
  [radEngine, 'cos(pi)', -1],
  [radEngine, 'tan(pi / 4)', 1],
  [degEngine, '2pi', 2 * Math.PI],
  [degEngine, '2e', 2 * Math.E],
  [degEngine, '3(4 + 5)', 27],
  [degEngine, '(2 + 1)(3 + 4)', 21],
  [degEngine, '4sqrt(9)', 12],
  [degEngine, '5sin(30)', 2.5],
  [degEngine, '3! * 2', 12],
  [degEngine, '1.5e3', 1500],
  [degEngine, '2.5e-2', 0.025],
  [degEngine, '10^(3)', 1000],
  [degEngine, '0.1 + 0.2', 0.3]
];

let passed = 0;
for (const [engine, expr, expected] of testCases) {
  try {
    const res = engine.evaluate(expr);
    const diff = Math.abs(res - expected);
    if (diff < 1e-7) {
      passed++;
    } else {
      console.error(`FAIL on "${expr}": got ${res}, expected ${expected}`);
    }
  } catch (e) {
    console.error(`ERROR on "${expr}": ${e.message}`);
  }
}
console.log(`✓ MathEngine test suite: ${passed} / ${testCases.length} tests PASSED!`);

const errorCases = [
  ['1 / 0', 'Cannot divide by zero'],
  ['sqrt(-4)', 'Cannot calculate square root of a negative number'],
  ['log(-1)', 'Logarithm undefined for numbers ≤ 0'],
  ['asin(2)', 'Domain error: sin⁻¹ input must be between -1 and 1'],
  ['tan(90)', 'Tangent undefined at 90°'],
  ['(-5)!', 'Factorial requires a non-negative integer'],
  ['(2.5)!', 'Factorial requires a non-negative integer'],
  ['171!', 'Factorial overflow']
];

let errorsCaught = 0;
for (const [expr, expectedSub] of errorCases) {
  try {
    degEngine.evaluate(expr);
    console.error(`Failed to throw error for: ${expr}`);
  } catch (err) {
    if (err.message.includes(expectedSub)) {
      errorsCaught++;
    } else {
      console.error(`Unexpected message for "${expr}": got "${err.message}"`);
    }
  }
}
console.log(`✓ Error handling suite: ${errorsCaught} / ${errorCases.length} tests PASSED!`);

console.log('✓ Formatter validation:');
console.log('  1234567.89 ->', Formatter.formatResult(1234567.89));
console.log('  0.1 + 0.2  ->', Formatter.formatResult(0.1 + 0.2));
console.log('  0.000000005 ->', Formatter.formatResult(0.000000005));
console.log('  5e15 ->', Formatter.formatResult(5e15));
