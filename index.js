const _PORT = 3000;
const app = require("http").createServer();
const io = require("socket.io").listen(app);
app.listen(_PORT);

const axios = require('axios');

const _urlApi = "http://localhost:5000/api/";

// key send
const _KEY = {
    ON: '1',
    SEND_MESSAGE: '2'
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
        let token = data.from.token;
        let from_id = data.from.id;
        let formData = {
            fromUserId: from_id,
            toUserId: Number(data.to_id),
            content: data.content,
        };
        console.log(formData);
        axios.post(_urlApi + "Messages/send-message", formData, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        .then(res => {
            console.log(res.data);
            // send message to socket user
            let user_receive = USERS.filter(user => user.id == data.to_id)[0];

            if(user_receive) {
                let mess = {
                    from_id: from_id,
                    to_id: data.to_id,
                    content: data.content,
                    from: {
                        avatar: data.from.avatar,
                        name: data.from.fullName
                    }
                };

                // console.log(user_receive);
                io.to(user_receive.socket_id).emit(_KEY.SEND_MESSAGE, mess);
            }
        })
        .catch(err => console.error(err.response.status + ": " + err.response.statusText));
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