# Quantum Scientific Calculator Web App

A modern, responsive, high-precision **Scientific Calculator Web App** built with HTML5, CSS3, and modern modular JavaScript (ES Modules).

![Calculator Interface](assets/favicon.svg)

---

## 🌟 Key Features

### 1. Modern Glassmorphic Dark UI
- **Obsidian Dark Theme**: Pure dark background (`#07080d`) with ambient glowing light orbs, elevated glassmorphism card surfaces, and subtle backdrop blurs.
- **Color-Coded Keypad**:
  - **Numeric Keys**: Slate dark gray (`#191c2b`) with crisp white typography.
  - **Basic Operators**: Royal violet (`#1c1836`) with glowing purple accents (`#a78bfa`).
  - **Scientific Functions**: Midnight navy (`#111420`) with electric cyan highlights (`#38bdf8`).
  - **Equals Button**: Vibrant gradient (Indigo to Cyber Violet) with dynamic drop-shadow glow.
  - **Clear & Delete**: Dedicated rose and amber warning tints for instant recognition.
- **Multi-Line Display**:
  - Top status bar with active angle indicator (`DEG`/`RAD`), memory indicator (`M`), and quick-copy action.
  - Live syntax-highlighted expression row (numbers, functions, constants, parentheses colorized).
  - Real-time live evaluation preview (faint italicized preview of the answer before pressing `=`).
  - High-contrast animated result display with auto-resizing.
- **Audio Feedback**: Built-in toggleable tactile micro-sound synthesizer using the HTML5 Web Audio API.

### 2. Basic Operations
- Addition (`+`), Subtraction (`−`), Multiplication (`×`), Division (`÷`)
- Percentage (`%`), Decimal (`.`), Positive/Negative toggle (`+/−`)
- Parentheses `( )` with automatic balance matching
- Clear All (`AC`), Delete Last Character (`DEL`), Calculate (`=`)

### 3. Scientific Mathematical Capabilities
- **Trigonometry**: `sin`, `cos`, `tan`
- **Inverse Trigonometry**: `sin⁻¹` (asin), `cos⁻¹` (acos), `tan⁻¹` (atan)
- **Angle Modes**: Seamless toggle between Degrees (`DEG`) and Radians (`RAD`)
- **2nd Function Toggle**: Switch between primary and inverse/alternate powers:
  - `sin` ↔ `sin⁻¹`, `cos` ↔ `cos⁻¹`, `tan` ↔ `tan⁻¹`
  - `x²` ↔ `x³`, `√` ↔ `∛`
  - `log` ↔ `10ˣ`, `ln` ↔ `eˣ`
- **Exponentials & Powers**:
  - Power `xʸ` (`^`, right-associative)
  - Square (`x²`), Cube (`x³`)
  - Exponential function `eˣ`
  - Base-10 power `10ˣ`
- **Roots**: Square root (`√`), Cube root (`∛`)
- **Logarithms**: Common logarithm (`log` base 10), Natural logarithm (`ln` base $e$)
- **Number Theory & Arithmetic**:
  - Factorial `n!` (supports integers $0 \le n \le 170$)
  - Reciprocal `1/x`
  - Absolute value `|x|`
  - Scientific notation `EXP` ($*10^{\text{exp}}$)
- **Mathematical Constants**: $\pi$ (`3.14159265...`), $e$ (`2.71828182...`)
- **Memory Functions**: `MC` (Clear), `MR` (Recall), `M+` (Add), `M-` (Subtract), `MS` (Store)

### 4. Custom Mathematical Engine (Zero `eval()`)
- **Security & Reliability**: Strictly **does NOT use JavaScript `eval()`** or `new Function()`.
- **Shunting-Yard & AST Evaluator**:
  - Complete mathematical tokenizer and reverse-polish notation (RPN) stack evaluator.
  - Full operator precedence (`^` > `*`, `/` > `+`, `-`).
  - Right-associative exponentiation (`2 ^ 3 ^ 2 = 512`).
  - **Implicit Multiplication**: Handles mathematical conventions naturally:
    - $2\pi \to 2 \times \pi$
    - $3(4 + 5) \to 3 \times (4 + 5) = 27$
    - $5\sin(30) \to 5 \times 0.5 = 2.5$
    - $4\sqrt{9} \to 4 \times 3 = 12$
- **Exact Angle Trigonometry**: Eliminates standard IEEE 754 floating-point drift (e.g. $\sin(180^\circ) = 0$, $\cos(90^\circ) = 0$, $\tan(45^\circ) = 1$, $\tan(90^\circ)$ returns undefined error).
- **Floating-Point Precision Fixes**: Evaluates $0.1 + 0.2 = 0.3$ cleanly without trailing binary float artifacts.
- **Domain & Error Handling**: Gracefully catches and displays clear error messages for:
  - Division by zero (`"Cannot divide by zero"`)
  - Negative square roots (`"Cannot calculate square root of a negative number"`)
  - Invalid logarithms (`"Logarithm undefined for numbers ≤ 0"`)
  - Invalid trigonometric domains (`"Domain error: sin⁻¹ input must be between -1 and 1"`)
  - Factorial domain violations (`"Factorial requires a non-negative integer"`)

### 5. Calculation History & Persistence
- Dedicated calculation history panel (adjacent sidebar on desktop, slide-out drawer on mobile).
- Persisted across browser sessions using `localStorage`.
- **Click to Reuse**:
  - Click any history expression to reload it into the calculator.
  - Click any result to insert it directly into the active calculation.
- Delete individual entries or clear all history with one click.

### 6. Full Keyboard Shortcuts
Press `?` inside the app anytime to open the interactive shortcuts cheat sheet:

| Key | Action | Key | Action |
| :--- | :--- | :--- | :--- |
| `0`–`9`, `.` | Digits & Decimal | `+`, `-`, `*`, `/` | Basic Operators |
| `Enter` or `=` | Calculate | `Backspace` | Delete last character (DEL) |
| `Delete` or `Esc` | Clear all (AC) | `^` | Power ($x^y$) |
| `!` | Factorial ($n!$) | `r` | Square root ($\sqrt{x}$) |
| `s` / `Shift+S` | $\sin$ / $\sin^{-1}$ | `c` / `Shift+C` | $\cos$ / $\cos^{-1}$ |
| `t` / `Shift+T` | $\tan$ / $\tan^{-1}$ | `l` / `n` | $\log_{10}$ / $\ln$ |
| `p` / `e` | Constants $\pi$ / $e$ | `d` | Toggle DEG / RAD |
| `Tab` or `` ` `` | Toggle 2nd Functions | `h` | Toggle History Panel |
| `Ctrl+C` | Copy Result | `?` | Keyboard Shortcuts Help |

---

## 📁 Project Structure

```
d:/cal/
├── index.html            # Main semantic HTML structure & markup
├── test.mjs              # Automated unit and integration test runner
├── README.md             # Project documentation & run guide
├── css/
│   ├── main.css          # Design system tokens, fonts, ambient glows & toasts
│   ├── calculator.css    # Calculator chassis, header, screen & memory toolbar
│   ├── keypad.css        # Responsive grid, rounded buttons, hover glows & ripples
│   ├── history.css       # History sidebar/drawer with interactive cards
│   └── modal.css         # Keyboard shortcuts modal dialog
├── js/
│   ├── app.js            # Main application controller & state machine
│   ├── mathEngine.js     # Lexer, Shunting-Yard RPN compiler & AST evaluator
│   ├── formatter.js      # Precision formatting, scientific notation & copy helper
│   ├── history.js        # History manager & localStorage sync
│   ├── keyboard.js       # Global keyboard routing & shortcut handling
│   └── sound.js          # Web Audio API tactile micro-sound synthesizer
└── assets/
    └── favicon.svg       # Custom vector SVG app icon
```

---

## 🚀 How to Run the App

### Option 1: Using Python (Recommended)
From the project directory `d:/cal`, run:
```bash
python -m http.server 3000
```
Then open your browser and navigate to:
```
http://localhost:3000
```

### Option 2: Using Node.js
From the project directory `d:/cal`, run:
```bash
npx serve .
# or
node -e "const http=require('http'),fs=require('fs'),path=require('path');http.createServer((req,res)=>{const p=path.join('.',req.url==='/'?'index.html':req.url);fs.readFile(p,(e,d)=>{if(e){res.writeHead(404);res.end('Not Found');}else{res.writeHead(200);res.end(d);}})}).listen(3000,()=>console.log('Running on http://localhost:3000'));"
```

### Option 3: Direct File Access
Simply double-click `index.html` in Windows Explorer or open it in Google Chrome, Microsoft Edge, or Mozilla Firefox.

---

## 🧪 Running Automated Tests

Run the built-in test suite covering 53+ mathematical operations, operator precedence, trigonometric angle modes, and 8+ domain error constraints:

```bash
node test.mjs
```

Expected output:
```
✓ MathEngine test suite: 53 / 53 tests PASSED!
✓ Error handling suite: 8 / 8 tests PASSED!
✓ Formatter validation:
  1234567.89 -> 1,234,567.89
  0.1 + 0.2  -> 0.3
  0.000000005 -> 5 × 10⁻⁹
  5e15 -> 5 × 10¹⁵
```
