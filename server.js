const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let orders = [];

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/tech', (req, res) => res.sendFile(path.join(__dirname, 'public', 'technician.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

app.get('/api/orders', (req, res) => res.json(orders));

io.on('connection', (socket) => {
    socket.emit('init_orders', orders);

    socket.on('client_create_order', (orderData) => {
        orders.unshift(orderData);
        io.emit('order_created', orderData);
        io.emit('update_dashboard', orders);
    });

    socket.on('tech_update_task', (updatePayload) => {
        let order = orders.find(o => o.id === updatePayload.orderId);
        if (order) {
            order.status = updatePayload.status;
            if (updatePayload.laborFee !== undefined) order.laborFee = updatePayload.laborFee;
            if (updatePayload.partsFee !== undefined) order.partsFee = updatePayload.partsFee;
            if (updatePayload.totalPrice !== undefined) order.price = updatePayload.totalPrice;
            
            io.emit('order_updated', order);
            io.emit('update_dashboard', orders);
        }
    });

    socket.on('send_chat_message', (chatData) => {
        let order = orders.find(o => o.id === chatData.orderId);
        if (order) {
            order.messages = order.messages || [];
            order.messages.push(chatData);
            io.emit('new_chat_message', chatData);
        }
    });

    socket.on('admin_close_order', (orderId) => {
        let order = orders.find(o => o.id === orderId);
        if (order) {
            order.status = "معتمد / مغلق نهائياً";
            io.emit('order_updated', order);
            io.emit('update_dashboard', orders);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
});
