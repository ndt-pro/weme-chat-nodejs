const _PORT = 3000;
const app = require("http").createServer();
const io = require("socket.io").listen(app);
app.listen(_PORT);

const axios = require('axios');

const _urlApi = "http://localhost:5000/api/";

// key send
const _KEY = {
    ON: '1',
    SEND_MESSAGE: '2',
    SEE_MESSAGE: '3',
};

var USERS = [];

io.on("connection", (socket) => {
    // on connected
    socket.on(_KEY.ON, (data) => {
        USERS = USERS.filter(user => user.id != data.id);
        data.socket_id = socket.id;
        USERS.push(data);
        console.log("push: " + data.fullName);
        io.emit(_KEY.ON, USERS);
    });

    socket.on(_KEY.SEND_MESSAGE, (data) => {
        let token = data.fromUser.token;

        let formData = {
            toUserId: Number(data.toId),
            content: data.content,
            media: data.media,
        };

        // console.log(formData);

        axios.post(_urlApi + "Messages/send-message", formData, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        .then(res => {
            // console.log(res.data);

            // send message to socket user
            let user_receive = USERS.filter(user => user.id == data.toId)[0];

            if(user_receive) {
                io.to(user_receive.socket_id).emit(_KEY.SEND_MESSAGE, res.data);
            }
        })
        .catch(err => console.error(err.response.status + ": " + err.response.statusText));
    });

    socket.on(_KEY.SEE_MESSAGE, (data) => {
        let user_receive = USERS.filter(user => user.id == data.toUserId)[0];

        if(user_receive) {
            io.to(user_receive.socket_id).emit(_KEY.SEE_MESSAGE, data.fromUserId);
        }
    });
    
    socket.on("disconnect", () => {
        // an disconnected
        USERS.map(user => {
            if(user.socket_id == socket.id) {
                console.log("remove: " + user.fullName);
            }
        });

        USERS = USERS.filter(user => user.socket_id != socket.id);
        socket.broadcast.emit(_KEY.ON, USERS);
    });
});