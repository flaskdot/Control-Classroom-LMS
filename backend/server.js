const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// إعداد سوكيت آي أو للرقابة اللحظية
const io = new Server(server, {
    cors: { origin: "*" }
});

io.on('connection', (socket) => {
    console.log('مراقب جديد متصل');

    // استقبال تنبيه "محاولة غش" من الطالب
    socket.on('cheat_attempt', (data) => {
        console.log(`تنبيه من ${data.studentName}: ${data.reason}`);
        // إعادة إرسال التنبيه للمعلم فوراً
        io.emit('notify_teacher', data);
    });
});

app.get('/', (req, res) => {
    res.send('سيرفر الرقابة يعمل بكفاءة!');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
