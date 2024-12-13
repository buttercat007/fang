const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000 || 3001;

app.use(bodyParser.json());
app.use(express.static('public')); // เสิร์ฟไฟล์ในโฟลเดอร์ public

app.post('/execute', (req, res) => {
    const { code, input } = req.body;

    const codeFilePath = path.join(__dirname, 'code.c');
    const execFilePath = path.join(__dirname, 'a.out');

    // Write the C code to a file
    fs.writeFileSync(codeFilePath, code);

    // Compile and run the code using Docker
    exec(`docker run --rm -v ${path.resolve(__dirname)}:/app gcc:latest sh -c "gcc /app/code.c -o /app/a.out && echo '${input}' | /app/a.out"`, (error, stdout, stderr) => {
        if (error) {
            res.json({ error: stderr });
            return;
        }

        // ผลลัพธ์ที่คาดหวัง (expected output) 
        const expectedOutput = generateExpectedOutput(input);
        
        // ตรวจสอบผลลัพธ์
        if (stdout.trim() === expectedOutput.trim()) {
            res.json({ output: stdout, message: "Pass" });
        } else {
            res.json({ output: stdout, message: "Fail", expected: expectedOutput });
        }
    });
});

// ฟังก์ชันเพื่อสร้างผลลัพธ์ที่คาดหวัง
function generateExpectedOutput(levels) {
    let output = '';
    const n = parseInt(levels, 10);
    for (let i = 1; i <= n; i++) {
        output += ' '.repeat(n - i); // ช่องว่าง
        output += '*'.repeat(2 * i - 1); // ดาว
        output += '\n'; // บรรทัดใหม่
    }
    return output;
}

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
