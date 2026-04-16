const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // للسماح باستقبال بيانات JSON (مثل نصوص الواجبات)

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// قاعدة بيانات وهمية مؤقتة (في الواقع نستخدم MongoDB)
let classes = {
    "MATH101": { teacher: "Admin", students: [], logs: [] }
};

io.on('connection', (socket) => {
    console.log('متصل جديد: ' + socket.id);

    // 1. نظام الانضمام عبر الرمز
    socket.on('join_class', (data) => {
        if (classes[data.classCode]) {
            socket.join(data.classCode);
            console.log(`الطالب ${data.studentName} انضم للصف ${data.classCode}`);
        }
    });

    // 2. رقابة الفيديو والـ PDF (تتبع الإكمال)
    socket.on('tracking_update', (data) => {
        console.log(`تقرير نشاط: الطالب ${data.studentName} وصل إلى ${data.progress}% في ${data.contentName}`);
        // إرسال التحديث للمعلم في نفس الصف فقط
        io.to(data.classCode).emit('teacher_log', data);
    });

    // 3. رقابة الامتحانات (الغش، الشاشة، الكاميرا)
    socket.on('cheat_attempt', (data) => {
        console.log(`🚨 محاولة غش: ${data.studentName} في صف ${data.classCode}. السبب: ${data.reason}`);
        io.to(data.classCode).emit('notify_teacher', {
            type: 'CRITICAL',
            student: data.studentName,
            reason: data.reason,
            time: new Date().toLocaleTimeString()
        });
    });

    // 4. بث الشاشة (WebRTC Signaling) 
    // ملاحظة: هذا الجزء يمرر إشارات البث بين الطالب والمدرس
    socket.on('screen_signal', (data) => {
        io.to(data.classCode).emit('view_screen', data);
    });
});

// 5. نظام كشف تشابه الواجبات (API Endpoint)
app.post('/check-similarity', (req, res) => {
    const { currentText, previousAssignments } = req.body;
    // هنا نستخدم مكتبة مثل string-similarity
    // سنرسل رد افتراضي الآن
    res.json({ similarityPercentage: "15%", status: "Safe" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`سيرفر الرقابة الذكي يعمل على المنفذ ${PORT}`));
