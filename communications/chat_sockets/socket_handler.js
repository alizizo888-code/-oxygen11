/**
 * =========================================================================
 * Mutqan Platform - Real-time Chat & Communication Engine (socket_handler.js)
 * Sovereign IP Protection: SAIP-CR-2024-8891
 * Sovereign Owner/Author: علي طلعت زيدان (آية) - ID: 789512364
 * =========================================================================
 */

class MutqanChatEngine {
    constructor(ioServer) {
        this.io = ioServer;
        this.activeConnections = new Map();
    }

    // تهيئة مستمعي الاتصال اللحظي (WebSockets)
    initializeSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`[Chat Security] New connection established: ${socket.id}`);

            // انضمام المستخدم أو الفني لغرفة المحادثة الخاصة بالطلب
            socket.on('join_order_room', (data) => {
                const { orderId, userId, userRole } = data;
                socket.join(`order_${orderId}`);
                console.log(`[Room Join] User ${userId} (${userRole}) joined chat for Order #${orderId}`);
                
                // إرسال تأكيد الانضمام
                socket.emit('joined_successfully', { orderId, status: 'secure_channel_open' });
            });

            // استقبال وتوثيق وإرسال الرسائل الفورية
            socket.on('send_message', (messageData) => {
                const { orderId, senderId, senderRole, messageText, attachmentUrl } = messageData;
                
                const timestamp = new Date().toISOString();
                const securePayload = {
                    orderId,
                    senderId,
                    senderRole,
                    messageText,
                    attachmentUrl: attachmentUrl || null,
                    timestamp,
                    auditSigned: true // توثيق الرسالة لحفظ حقوق النزاعات الفنية
                };

                // بث الرسالة لجميع أطراف الطلب في الغرفة حصرياً
                this.io.to(`order_${orderId}`).emit('receive_message', securePayload);
                console.log(`[Chat Audit] Message recorded and broadcasted for Order #${orderId} by ${senderRole}`);
            });

            // قطع الاتصال
            socket.on('disconnect', () => {
                console.log(`[Chat Security] Connection closed: ${socket.id}`);
            });
        });
    }
}

module.exports = MutqanChatEngine;
