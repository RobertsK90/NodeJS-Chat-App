var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8080;
var server   = require('http').createServer(app).listen(port);
var io       = require('socket.io').listen(server);
var router   = express.Router();
var mongoose = require('mongoose');

var users = {};
var msg;

server.listen(port);

app.use("/assets", express.static(__dirname + '/assets'));
app.use(express.static(__dirname + '/public'));


router.get('/', function(req, res) {
    res.sendFile(__dirname + "/index.html");
});

app.use('/', router);

mongoose.connect('mongodb://127.0.0.1/chat');
var db = mongoose.connection;
var Schema = mongoose.Schema;

var messagesSchema = new Schema({
    nickname: String,
    message: String,

    date: {type: Date, default: Date.now}
});

var Message = mongoose.model('Message', messagesSchema);

db.on('error', console.error.bind(console, 'connection error: '));

db.once('open', function(callback){
    io.sockets.on('connection', function(socket){

        socket.on('new user', function(data, callback){
            if (data in users) {
                callback(false);
            } else {
                callback(true);
                socket.nickname = data;
                users[socket.nickname] = socket;
                socket.act = 'connected';

                var query = Message.find().sort('-date').limit(15);
                query.exec(function(err, docs) {

                    socket.emit('new message', docs);
                });

                updateNicknames();
            }

        });
        socket.on('send message', function(data, callback){
            var message = data.trim();
            if (message.substr(0,4) === '/pm ') {
                message = message.substr(4);
                var i = message.indexOf(' ');
                if (i !== -1) {
                    var name = message.substr(0, i);
                    message = message.substr(i+1);
                    if (name in users) {
                        if (name === socket.nickname) {
                            callback("You can't send PM to yourself!");
                        } else {
                            msg = new Message({
                                nickname: socket.nickname,
                                message: message
                            });

                            msg.save();

                            users[name].emit('private message', {
                                'message' : message,
                                'nickname' : 'PM from ' + socket.nickname
                            });


                        }


                    } else {
                        callback(encodeURI(name) + ' is not present in this chatroom');
                    }
                } else {
                    callback('You have to provide the contents of private message');
                }

            } else {

                msg = new Message({
                    nickname: socket.nickname,
                    message: message
                });

                msg.save();

                io.sockets.emit('new message', [{
                    'message' : message,
                    'nickname' : socket.nickname
                }]);


            }

        });

        function updateNicknames() {
            io.sockets.emit('usernames', {
                'nicknames' : Object.keys(users),
                'user' : socket.nickname,
                'act' : socket.act
            });
        }

        socket.on('disconnect', function(data){

            if(!socket.nickname) return;

            socket.act = 'disconnected';
            delete users[socket.nickname];
            updateNicknames();


        });
    });
});









