// Importing required modules
const http = require('http');
const io = require('socket.io');
const validator = new (require('jsonschema').Validator)();
const asyncLoop = require('async').forEach;

// Constants used in the script
const port = process.env.PORT || 5000;
const status = {
    WAITING_FOR_PLAYERS: 'waitingForPlayers',
    GAME_STARTED: 'gameStarted',
    GAME_ENDED: 'gameEnded',
    NOT_STARTED: 'notStarted'
};
const tags = {
    USERNAME: 'username',
    ADD_TO_ROOM: 'addToRoom',
    USER_TABLE: 'userTable',
    BOT_TABLE: 'botTable',
    ELEMENT: 'element',
    ARR_BOT: 'arrBot',
    ARR_USER: 'arrUser',
    COUNT_USER: 'countUser',
    COUNT_BOT: 'countBot',
    LEFT_ARRAY: 'leftArray',
    SOCKET_ID : 'id',
    GAME_STATUS: 'gameStatus',
    CURR_ROOM: 'currRoom',
    PLAYERS: 'players',
    PLAYER_TURN: 'playerTurn'
};

// Declaring required schemas
const intSchema = {
    type: 'integer',
    minimum: 1,
    maximum: 25
};
const userNameSchema = {
    type: 'string',
    minLength: 5,
    maxLength: 20,
    pattern: /^[A-Za-z0-9_]+$/
};

// Initializing required variables
var rooms = {};

// Start the server at port 3000
var server = http.createServer(function(req, res) {
    // Send HTML headers and message
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end("Wrong path, try going to http://shashwat-garg.github.io/bingo-multiplayer");
});

server.listen(port);

// Create a socket.IO instance, passing it our server
var socket = io.listen(server);

// Add a connect listener
socket.on('connect', function(client) {
    console.log('Socket connected ' + client[tags.SOCKET_ID]);

    // Disconnect stray sockets, i.e. sockets without a userName
    function disconnectStray() {
        if(!(tags.USERNAME in client)) {
            console.log("Disconnecting stray socket");
            if(client[tags.SOCKET_ID] in socket.sockets.connected) {
                client.disconnect(true);
            }
        }
    }
    setTimeout(disconnectStray, 3 * 1000); // disconnect after 3 seconds of connection

    // Success! Now listen to messages to be recieved
    client.on('userNameInput', function(data, callback) {
        var schema = {
            type: 'object',
            properties: {
                username: userNameSchema,
                addToRoom: userNameSchema
            },
            required: [tags.USERNAME],
            additionalProperties: false
        };
        if((!data) || (validator.validate(data, schema).errors.length > 0)) {
            var errorObj = {
                success: false,
                error: 'Invalid username!'
            };
            callback(errorObj);
        }
        else if(data[tags.USERNAME] in rooms) {
            var errorObj = {
                success: false,
                error: 'Username already exists!'
            };
            callback(errorObj);
        }
        else if(data[tags.USERNAME] == data[tags.ADD_TO_ROOM]) {
            var errorObj = {
                success: false,
                error: 'Room already exists!'
            };
            callback(errorObj);
        }
        else {
            var arr = new Array(5);
            var arr2 = new Array(5);
            var arr3 = new Array(5);
            var cnt = 0;
            var leftArray = new Array(25);
            for(var i = 0;i < 5;i++) {
                arr[i] = new Array(5);
                arr2[i] = new Array(5);
                arr3[i] = new Array(5);
                for(var j = 0;j < 5;j++) {
                    arr[i][j] = 0;
                    arr2[i][j] = 0;
                    arr3[i][j] = 0;
                    leftArray[cnt] = cnt + 1;
                    cnt++;
                }
            }
            if(data[tags.ADD_TO_ROOM] && rooms[data[tags.ADD_TO_ROOM]]) {
                if(rooms[data[tags.ADD_TO_ROOM]][tags.GAME_STATUS] == status.NOT_STARTED) {
                    var errorObj = {
                        success: false,
                        error: 'Game not hosted yet!'
                    };
                    callback(errorObj);
                }
                else if(rooms[data[tags.ADD_TO_ROOM]][tags.GAME_STATUS] == status.GAME_ENDED){
                    var errorObj = {
                        success: false,
                        error: 'Game has ended!'
                    };
                    callback(errorObj);
                }
                else if(rooms[data[tags.ADD_TO_ROOM]][tags.GAME_STATUS] == status.WAITING_FOR_PLAYERS) {
                    if(rooms[data[tags.ADD_TO_ROOM]][tags.PLAYERS].length == 2) {
                        var errorObj = {
                            success: false,
                            error: 'Maximum 2 players allowed in one room!'
                        };
                        callback(errorObj);
                    }
                    else {
                        client[tags.USERNAME] = data[tags.USERNAME];
                        rooms[data[tags.USERNAME]] = {
                            id: client[tags.SOCKET_ID]
                        };
                        rooms[data[tags.ADD_TO_ROOM]][data[tags.USERNAME]] = {
                            arrUser: arr3,
                            userTable: [],
                            countUser: [0]
                        };
                        var successObj = {
                            success: true,
                            error: ""
                        };
                        callback(successObj);
                    }
                }
                else {
                    var errorObj = {
                        success: false,
                        error: 'Host has already started the game!'
                    };
                    callback(errorObj);
                }
            }
            else {
                rooms[data[tags.USERNAME]] = {
                    leftArray: leftArray,
                    gameStatus: status.NOT_STARTED,
                    id: client[tags.SOCKET_ID]
                };
                client.join(data[tags.USERNAME]);
                rooms[data[tags.USERNAME]][data[tags.USERNAME]] = {
                    arrBot: arr,
                    arrUser: arr2,
                    userTable: [],
                    botTable: [],
                    countUser: [0],
                    countBot: [0]
                };
                // console.log(rooms);
                var successObj = {
                    success: true,
                    error: ""
                };
                client[tags.USERNAME] = data[tags.USERNAME];
                client[tags.CURR_ROOM] = data[tags.USERNAME];
                callback(successObj);
            }
        }
    });
    client.on('addThisUserToRoom', function(data, callback) {
        var schema = {
            type: 'object',
            properties: {
                username: userNameSchema,
                addToRoom: userNameSchema
            },
            required: [tags.USERNAME,tags.ADD_TO_ROOM],
            additionalProperties: false
        };
        if((!data) || (validator.validate(data, schema).errors.length > 0)) {
            var errorObj = {
                success: false,
                error: 'Invalid username!'
            };
            callback(errorObj);
        }
        else if((!(tags.USERNAME in client)) || (client[tags.USERNAME] != data[tags.USERNAME])) {
            var errorObj = {
                success: false,
                error: 'Please refresh the web page!'
            };
            callback(errorObj);
            console.log("Attempt to breach! Disconnecting socket " + client[tags.SOCKET_ID]);
            if(client[tags.SOCKET_ID] in socket.sockets.connected) {
                client.disconnect(true);
            }
        }
        else if((data[tags.ADD_TO_ROOM]) && (data[tags.ADD_TO_ROOM] in rooms)) {
            rooms[data[tags.ADD_TO_ROOM]][tags.PLAYERS].push(data[tags.USERNAME]);
            client.join(data[tags.ADD_TO_ROOM]);
            client[tags.CURR_ROOM] = data[tags.ADD_TO_ROOM];
            // console.log(rooms);
            // console.log(rooms[data[tags.ADD_TO_ROOM]][data[tags.USERNAME]]);
            var successObj = {
                success: true,
                error: ''
            };
            callback(successObj);
            var obj = {
                count: rooms[data[tags.ADD_TO_ROOM]][tags.PLAYERS].length,
                players: rooms[data[tags.ADD_TO_ROOM]][tags.PLAYERS]
            };
            socket.in(data[tags.ADD_TO_ROOM]).emit('countUsers', obj);
        }
        else {
            var errorObj = {
                success: false,
                error: 'Username already exists!'
            };
            callback(errorObj);
        }
    });

    client.on('matrixElementInput', function(obj) {
        var schema = {
            type: 'object',
            properties: {
                addToRoom: userNameSchema,
                element: intSchema
            },
            required: [tags.USERNAME,tags.ELEMENT],
            additionalProperties: false
        };
        if((!obj) || (validator.validate(obj, schema).errors.length > 0)) {
            console.log("Attempt to breach! Disconnecting socket " + client[tags.SOCKET_ID]);
            if(client[tags.SOCKET_ID] in socket.sockets.connected) {
                client.disconnect(true);
            }
        }
        else if((!(tags.USERNAME in client)) || (client[tags.USERNAME] != obj[tags.USERNAME])) {
            console.log("Attempt to breach! Disconnecting socket " + client[tags.SOCKET_ID]);
            if(client[tags.SOCKET_ID] in socket.sockets.connected) {
                client.disconnect(true);
            }
        }
        else if((obj[tags.ADD_TO_ROOM]) && (obj[tags.ADD_TO_ROOM] in rooms)) {
            rooms[obj[tags.ADD_TO_ROOM]][obj[tags.USERNAME]][tags.USER_TABLE].push(obj[tags.ELEMENT]);
        }
        else {
            rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.USER_TABLE].push(obj[tags.ELEMENT]);
            // console.log(rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.USER_TABLE]);
        }
    });

    client.on('resetMatrix', function(obj) {
        var schema = {
            type: 'object',
            properties: {
                username: userNameSchema,
                addToRoom: userNameSchema
            },
            required: [tags.USERNAME],
            additionalProperties: false
        }
        if((!obj) || (validator.validate(obj, schema).errors.length > 0)) {
            console.log("Attempt to breach! Disconnecting socket " + client[tags.SOCKET_ID]);
            if(client[tags.SOCKET_ID] in socket.sockets.connected) {
                client.disconnect(true);
            }
        }
        else if((!(tags.USERNAME in client)) || (client[tags.USERNAME] != obj[tags.USERNAME])) {
            console.log("Attempt to breach! Disconnecting socket " + client[tags.SOCKET_ID]);
            if(client[tags.SOCKET_ID] in socket.sockets.connected) {
                client.disconnect(true);
            }
        }
        else if((obj[tags.ADD_TO_ROOM]) && (obj[tags.ADD_TO_ROOM] in rooms)) {
            rooms[obj[tags.ADD_TO_ROOM]][obj[tags.USERNAME]][tags.USER_TABLE] = [];
        }
        else if(obj[tags.USERNAME] in rooms) {
            rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.USER_TABLE] = [];
            // console.log(rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.USER_TABLE]);
        }
    });

    client.on('requestRandomMatrix', function(obj, callback) {
        var schema = {
            type: 'object',
            properties: {
                username: userNameSchema,
                addToRoom: userNameSchema
            },
            required: [tags.USERNAME],
            additionalProperties: false
        }
        if((!obj) || (validator.validate(obj, schema).errors.length > 0)) {
            console.log("Attempt to breach! Disconnecting socket " + client[tags.SOCKET_ID]);
            if(client[tags.SOCKET_ID] in socket.sockets.connected) {
                client.disconnect(true);
            }
        }
        else if((!(tags.USERNAME in client)) || (client[tags.USERNAME] != obj[tags.USERNAME])) {
            var errorObj = {
                success: false,
                error: 'Please refresh the web page!'
            };
            callback(errorObj);
            console.log("Attempt to breach! Disconnecting socket " + client[tags.SOCKET_ID]);
            if(client[tags.SOCKET_ID] in socket.sockets.connected) {
                client.disconnect(true);
            }
        }
        else if((obj[tags.ADD_TO_ROOM]) && (obj[tags.ADD_TO_ROOM] in rooms)) {
            var a = new Array(25);
            for(var i = 0;i < 25; i++) {
                a[i] = i + 1;
            }
            createRandom(a);
            var randomMatrixObj = {
                success: true,
                error: '',
                matrix: a
            };
            rooms[obj[tags.ADD_TO_ROOM]][obj[tags.USERNAME]][tags.USER_TABLE] = a;
            // console.log(rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.USER_TABLE]);
            callback(randomMatrixObj);
        }
        else if(obj[tags.USERNAME] in rooms) {
            var a = new Array(25);
            for(var i = 0;i < 25; i++) {
                a[i] = i + 1;
            }
            createRandom(a);
            var randomMatrixObj = {
                success: true,
                error: '',
                matrix: a
            };
            rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.USER_TABLE] = a;
            // console.log(rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.USER_TABLE]);
            callback(randomMatrixObj);
        }
        else {
            var errorObj = {
                success: false,
                error: 'Username doesn\'t exist!'
            };
            callback(errorObj);
        }
    });

    client.on('convertUserTableTo2D', function(obj, callback) {
        var schema = {
            type: 'object',
            properties: {
                username: userNameSchema,
                addToRoom: userNameSchema
            },
            required: [tags.USERNAME],
            additionalProperties: false
        }
        if((!obj) || (validator.validate(obj, schema).errors.length > 0)) {
            console.log("Attempt to breach! Disconnecting socket " + client[tags.SOCKET_ID]);
            if(client[tags.SOCKET_ID] in socket.sockets.connected) {
                client.disconnect(true);
            }
        }
        else if((!(tags.USERNAME in client)) || (client[tags.USERNAME] != obj[tags.USERNAME])) {
            var errorObj = {
                success: false,
                error: 'Please refresh the web page!'
            };
            callback(errorObj);
            console.log("Attempt to breach! Disconnecting socket " + client[tags.SOCKET_ID]);
            if(client[tags.SOCKET_ID] in socket.sockets.connected) {
                client.disconnect(true);
            }
        }
        else if((obj[tags.ADD_TO_ROOM]) && (obj[tags.ADD_TO_ROOM] in rooms)) {
            var cnt = 0;
            var temp = rooms[obj[tags.ADD_TO_ROOM]][obj[tags.USERNAME]][tags.USER_TABLE];
            rooms[obj[tags.ADD_TO_ROOM]][obj[tags.USERNAME]][tags.USER_TABLE] = new Array(5);
            for(var i = 0;i < 5; i++) {
                rooms[obj[tags.ADD_TO_ROOM]][obj[tags.USERNAME]][tags.USER_TABLE][i] = new Array(5);
                for(var j = 0;j < 5; j++) {
                    rooms[obj[tags.ADD_TO_ROOM]][obj[tags.USERNAME]][tags.USER_TABLE][i][j] = temp[cnt];
                    cnt++;
                }
            }
            var successObj = {
                success: true,
                error: ''
            };
            callback(successObj);
        }
        else if(obj[tags.USERNAME] in rooms) {
            var cnt = 0;
            var temp = rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.USER_TABLE];
            rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.USER_TABLE] = new Array(5);
            for(var i = 0;i < 5; i++) {
                rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.USER_TABLE][i] = new Array(5);
                for(var j = 0;j < 5; j++) {
                    rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.USER_TABLE][i][j] = temp[cnt];
                    cnt++;
                }
            }
            var successObj = {
                success: true,
                error: ''
            };
            callback(successObj);
        }
        else {
            var errorObj = {
                success: false,
                error: 'Username doesn\'t exist!'
            };
            callback(errorObj);
        }

    });

    client.on('createBotMatrix', function(obj, callback) {
        var schema = {
            type: 'object',
            properties: {
                username: userNameSchema
            },
            required: [tags.USERNAME],
            additionalProperties: false
        };
        if((!obj) || (validator.validate(obj, schema).errors.length > 0)) {
            console.log("Attempt to breach! Disconnecting socket " + client[tags.SOCKET_ID]);
            if(client[tags.SOCKET_ID] in socket.sockets.connected) {
                client.disconnect(true);
            }
        }
        else if((!(tags.USERNAME in client)) || (client[tags.USERNAME] != obj[tags.USERNAME])) {
            var errorObj = {
                success: false,
                error: 'Please refresh the web page!'
            };
            callback(errorObj);
            console.log("Attempt to breach! Disconnecting socket " + client[tags.SOCKET_ID]);
            if(client[tags.SOCKET_ID] in socket.sockets.connected) {
                client.disconnect(true);
            }
        }
        else if(obj[tags.USERNAME] in rooms) {
            rooms[obj[tags.USERNAME]][tags.GAME_STATUS] = status.GAME_STARTED;
            // console.log(rooms);
            var a = new Array(25);
            for(var i = 0;i < 25; i++) {
                a[i] = i + 1;
            }
            createRandom(a);
            var a2D = new Array(5);
            var cnt = 0;
            for(var i = 0;i < 5; i++) {
                a2D[i] = new Array(5);
                for(var j = 0;j < 5; j++) {
                    a2D[i][j] = a[cnt];
                    cnt++;
                }
            }
            rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.BOT_TABLE] = a2D;
            // console.log(rooms);
            // console.log(rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.BOT_TABLE]);
            // console.log(rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.USER_TABLE]);
            var successObj = {
                success: true,
                error: ''
            };
            callback(successObj);
        }
        else {
            var errorObj = {
                success: false,
                error: 'Username doesn\'t exist!'
            };
            callback(errorObj);
        }
    });

    client.on('hostStartedGame', function(data) {
        var schema = {
            type: 'object',
            properties: {
                username: userNameSchema
            },
            required: [tags.USERNAME],
            additionalProperties: false
        };
        if((!data) || (validator.validate(data, schema).errors.length > 0)) {
            console.log("Attempt to breach! Disconnecting socket " + client[tags.SOCKET_ID]);
            if(client[tags.SOCKET_ID] in socket.sockets.connected) {
                client.disconnect(true);
            }
        }
        else if((!(tags.USERNAME in client)) || (client[tags.USERNAME] != data[tags.USERNAME])) {
            console.log("Attempt to breach! Disconnecting socket " + client[tags.SOCKET_ID]);
            if(client[tags.SOCKET_ID] in socket.sockets.connected) {
                client.disconnect(true);
            }
        }
        else {
            rooms[data[tags.USERNAME]][tags.GAME_STATUS] = status.GAME_STARTED;
            rooms[data[tags.USERNAME]][tags.PLAYER_TURN] = 0;
            socket.in(client[tags.USERNAME]).emit('gameHasStarted');
            // console.log(rooms);
        }
    });
    client.on('modifyHost', function(data) {
        var schema = {
            type: 'object',
            properties: {
                username: userNameSchema
            },
            required: [tags.USERNAME],
            additionalProperties: false
        };
        if((!data) || (validator.validate(data, schema).errors.length > 0)) {
            console.log("Attempt to breach! Disconnecting socket " + client[tags.SOCKET_ID]);
            if(client[tags.SOCKET_ID] in socket.sockets.connected) {
                client.disconnect(true);
            }
        }
        else if((!(tags.USERNAME in client)) || (client[tags.USERNAME] != data[tags.USERNAME])) {
            console.log("Attempt to breach! Disconnecting socket " + client[tags.SOCKET_ID]);
            if(client[tags.SOCKET_ID] in socket.sockets.connected) {
                client.disconnect(true);
            }
        }
        else {
            delete rooms[data[tags.USERNAME]][data[tags.USERNAME]][tags.ARR_BOT];
            delete rooms[data[tags.USERNAME]][data[tags.USERNAME]][tags.BOT_TABLE];
            delete rooms[data[tags.USERNAME]][data[tags.USERNAME]][tags.COUNT_BOT];
            rooms[data[tags.USERNAME]][tags.GAME_STATUS] = status.WAITING_FOR_PLAYERS;
            rooms[data[tags.USERNAME]][tags.PLAYERS] = [data[tags.USERNAME]];
            var obj = {
                count: rooms[data[tags.USERNAME]][tags.PLAYERS].length,
                players: rooms[data[tags.USERNAME]][tags.PLAYERS]
            };
            socket.in(data[tags.USERNAME]).emit('countUsers', obj);
            // console.log(rooms);
        }
    });
    client.on('userSelectedElement', function(obj) {
        var schema = {
            type: 'object',
            properties: {
                username: userNameSchema,
                addToRoom: userNameSchema,
                element: intSchema
            },
            required: [tags.USERNAME,tags.ELEMENT],
            additionalProperties: false
        };
        if((!obj) || (validator.validate(obj, schema).errors.length > 0)) {
            console.log("Attempt to breach! Disconnecting socket " + client[tags.SOCKET_ID]);
            if(client[tags.SOCKET_ID] in socket.sockets.connected) {
                client.disconnect(true);
            }
        }
        else if((!(tags.USERNAME in client)) || (client[tags.USERNAME] != obj[tags.USERNAME])) {
            console.log("Attempt to breach! Disconnecting socket " + client[tags.SOCKET_ID]);
            if(client[tags.SOCKET_ID] in socket.sockets.connected) {
                client.disconnect(true);
            }
        }
        else if((obj[tags.ADD_TO_ROOM]) && (obj[tags.ADD_TO_ROOM] in rooms)) {
            if(rooms[obj[tags.ADD_TO_ROOM]][tags.LEFT_ARRAY].indexOf(obj[tags.ELEMENT]) < 0) {
                var errorObj = {
                    success: false,
                    error: 'Value cannot be selected!'
                };
                client.emit('sendData', errorObj);
            }
            else {
                // console.log('player selected an element');
                modLeftArr(obj[tags.ADD_TO_ROOM], obj[tags.ELEMENT]);
                rooms[obj[tags.ADD_TO_ROOM]][tags.PLAYER_TURN]++;
                asyncLoop(rooms[obj[tags.ADD_TO_ROOM]][tags.PLAYERS], function(key, next) {
                    modUserArr(obj[tags.ADD_TO_ROOM], key, tags.ARR_USER, tags.USER_TABLE, obj[tags.ELEMENT]);
                    rooms[obj[tags.ADD_TO_ROOM]][key][tags.COUNT_USER][0] = checkBingo(rooms[obj[tags.ADD_TO_ROOM]][key][tags.ARR_USER]);
                    var retObj = {
                        success: true,
                        error: '',
                        turn: rooms[obj[tags.ADD_TO_ROOM]][tags.PLAYERS]
                        [(rooms[obj[tags.ADD_TO_ROOM]][tags.PLAYER_TURN]) % Object.keys(rooms[obj[tags.ADD_TO_ROOM]][tags.PLAYERS]).length]
                    };
                    var temp = rooms[obj[tags.ADD_TO_ROOM]][key];
                    var winnerObj = {
                        winner: '',
                        draw: false
                    };
                    if(temp[tags.COUNT_USER][0] == 5) {
                        if(rooms[obj[tags.ADD_TO_ROOM]][tags.GAME_STATUS] == status.GAME_ENDED) {
                            winnerObj.draw = true;
                        }
                        else {
                            rooms[obj[tags.ADD_TO_ROOM]][tags.GAME_STATUS] = status.GAME_ENDED;
                            winnerObj.winner = key;
                        }
                        socket.in(obj[tags.ADD_TO_ROOM]).emit('gameHasEnded', winnerObj);
                    }
                    retObj[tags.COUNT_USER] = temp[tags.COUNT_USER][0];
                    retObj[tags.ELEMENT] = obj[tags.ELEMENT];
                    socket.to(rooms[key][tags.SOCKET_ID]).emit('sendData', retObj);
                    // console.log(rooms);
                    next();
                }, function(err) {
                    if(err) throw err;
                });
            }
        }
        else if(rooms[obj[tags.USERNAME]][tags.LEFT_ARRAY].indexOf(obj[tags.ELEMENT]) < 0) {
            // console.log(rooms[obj[tags.USERNAME]][tags.LEFT_ARRAY]);
            // console.log(obj[tags.ELEMENT]);
            var errorObj = {
                success: false,
                error: 'Value cannot be selected!'
            };
            client.emit('sendData', errorObj);
        }
        else if(rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.COUNT_BOT]) {
            modUserArr(obj[tags.USERNAME], obj[tags.USERNAME], tags.ARR_USER, tags.USER_TABLE, obj[tags.ELEMENT]);
            modUserArr(obj[tags.USERNAME], obj[tags.USERNAME], tags.ARR_BOT, tags.BOT_TABLE, obj[tags.ELEMENT]);
            modLeftArr(obj[tags.USERNAME], obj[tags.ELEMENT]);
            rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.COUNT_USER][0] = checkBingo(rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.ARR_USER]);
            rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.COUNT_BOT][0] = checkBingo(rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.ARR_BOT]);
            // console.log('Before timeout',rooms[obj[tags.USERNAME]][obj[tags.USERNAME]]);
            var winnerObj = {
                winner: '',
                draw: false
            };
            var retObj = {
                success: true,
                turn: obj[tags.USERNAME],
                error: ''
            };
            var temp = rooms[obj[tags.USERNAME]][obj[tags.USERNAME]];
            if((temp[tags.COUNT_USER][0] == 5) && (temp[tags.COUNT_BOT][0] == 5)) {
                winnerObj.draw = true;
            }
            else if(temp[tags.COUNT_USER][0] == 5) {
                winnerObj.winner = obj[tags.USERNAME];
            }
            else if(temp[tags.COUNT_BOT][0] == 5) {
                winnerObj.winner = 'Bot';
            }
            if((temp[tags.COUNT_USER][0] == 5) || (temp[tags.COUNT_BOT][0] == 5)) {
                rooms[obj[tags.USERNAME]][tags.GAME_STATUS] = status.GAME_ENDED;
                socket.in(obj[tags.USERNAME]).emit('gameHasEnded', winnerObj);
                // console.log(temp);
            }
            setTimeout(function () {
                var target = botMove(rooms[obj[tags.USERNAME]]);
                modUserArr(obj[tags.USERNAME], obj[tags.USERNAME], tags.ARR_USER, tags.USER_TABLE, parseInt(target, 10));
                modUserArr(obj[tags.USERNAME], obj[tags.USERNAME], tags.ARR_BOT, tags.BOT_TABLE, parseInt(target, 10));
                modLeftArr(obj[tags.USERNAME], parseInt(target, 10));
                rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.COUNT_USER][0] = checkBingo(rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.ARR_USER]);
                rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.COUNT_BOT][0] = checkBingo(rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.ARR_BOT]);
                // console.log('After timeout',rooms[obj[tags.USERNAME]][obj[tags.USERNAME]]);
                temp = rooms[obj[tags.USERNAME]][obj[tags.USERNAME]];
                if((temp[tags.COUNT_USER][0] == 5) && (temp[tags.COUNT_BOT][0] == 5)) {
                    winnerObj.draw = true;
                }
                else if(temp[tags.COUNT_USER][0] == 5) {
                    winnerObj.winner = obj[tags.USERNAME];
                }
                else if(temp[tags.COUNT_BOT][0] == 5) {
                    winnerObj.winner = 'Bot';
                }
                if((temp[tags.COUNT_USER][0] == 5) || (temp[tags.COUNT_BOT][0] == 5)) {
                    if(rooms[obj[tags.USERNAME]][tags.GAME_STATUS] != status.GAME_ENDED) {
                        rooms[obj[tags.USERNAME]][tags.GAME_STATUS] = status.GAME_ENDED;
                        socket.in(obj[tags.USERNAME]).emit('gameHasEnded', winnerObj);
                    }
                }
                retObj[tags.COUNT_USER] = rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.COUNT_USER][0];
                retObj[tags.ELEMENT] = target;
                socket.in(client[tags.USERNAME]).emit('sendData', retObj);
                // console.log(temp);
            }, 700);
        }
        else if(obj[tags.USERNAME] in rooms) {
            // console.log('host selected element');
            modLeftArr(obj[tags.USERNAME], obj[tags.ELEMENT]);
            rooms[obj[tags.USERNAME]][tags.PLAYER_TURN]++;
            // console.log(rooms);
            asyncLoop(rooms[obj[tags.USERNAME]][tags.PLAYERS], function(key, next) {
                modUserArr(obj[tags.USERNAME], key, tags.ARR_USER, tags.USER_TABLE, obj[tags.ELEMENT]);
                rooms[obj[tags.USERNAME]][key][tags.COUNT_USER][0] = checkBingo(rooms[obj[tags.USERNAME]][key][tags.ARR_USER]);
                var retObj = {
                    success: true,
                    error: '',
                    turn: rooms[obj[tags.USERNAME]][tags.PLAYERS]
                    [(rooms[obj[tags.USERNAME]][tags.PLAYER_TURN]) % Object.keys(rooms[obj[tags.USERNAME]][tags.PLAYERS]).length]
                };
                var temp = rooms[obj[tags.USERNAME]][key];
                var winnerObj = {
                    winner: '',
                    draw: false
                };
                if(temp[tags.COUNT_USER][0] == 5) {
                    if(rooms[obj[tags.USERNAME]][tags.GAME_STATUS] == status.GAME_ENDED) {
                        winnerObj.draw = true;
                    }
                    else {
                        rooms[obj[tags.USERNAME]][tags.GAME_STATUS] = status.GAME_ENDED;
                        winnerObj.winner = key;
                    }
                    socket.in(obj[tags.USERNAME]).emit('gameHasEnded', winnerObj);
                }
                retObj[tags.COUNT_USER] = temp[tags.COUNT_USER][0];
                retObj[tags.ELEMENT] = obj[tags.ELEMENT];
                socket.to(rooms[key][tags.SOCKET_ID]).emit('sendData', retObj);
                // console.log(rooms);
                next();
            }, function(err) {
                if(err) throw err;
            });
        }
        else {
            var errorObj = {
                success: false,
                error: 'Username doesn\'t exist!'
            };
            client.emit('sendData', errorObj);
        }
    });
    client.on('disconnect', function() {
        if(tags.USERNAME in client) {
            if(client[tags.USERNAME] == client[tags.CURR_ROOM]) {
                client.to(client[tags.USERNAME]).emit('hostDisconnected');
                asyncLoop(rooms[client[tags.USERNAME]][tags.PLAYERS], function(key, next) {
                    delete rooms[key];
                    next();
                }, function(err) {
                    if(err) throw err;
                    delete rooms[client[tags.USERNAME]];
                });
            }
            else if(rooms[client[tags.CURR_ROOM]]) {
                delete rooms[client[tags.USERNAME]];
                delete rooms[client[tags.CURR_ROOM]][client[tags.USERNAME]];
                var index = rooms[client[tags.CURR_ROOM]][tags.PLAYERS].indexOf(client[tags.USERNAME]);
                if (index !== -1) rooms[client[tags.CURR_ROOM]][tags.PLAYERS].splice(index, 1);
                var obj = {
                    count: rooms[client[tags.CURR_ROOM]][tags.PLAYERS].length,
                    players: rooms[client[tags.CURR_ROOM]][tags.PLAYERS]
                };
                socket.in(client[tags.CURR_ROOM]).emit('countUsers', obj);
            }
            else if(client[tags.USERNAME] in rooms) {
                delete rooms[client[tags.USERNAME]];
            }
        }
        console.log('Socket disconnected ' + client[tags.SOCKET_ID]);
    });
});


// ****** Functions ******

// Function to update left arrays
function modLeftArr(roomName, target) {
    for(var i = 0;i < rooms[roomName][tags.LEFT_ARRAY].length; i++) {
            if(rooms[roomName][tags.LEFT_ARRAY][i] == target) {
                rooms[roomName][tags.LEFT_ARRAY].splice(i, 1);
                return;
        }
    }
}

// Function to update user arrays
function modUserArr(roomName, key, targetTable, refTable, target) {
    for(var i = 0;i < 5;i++) {
        for(var j = 0;j < 5;j++) {
            if(rooms[roomName][key][refTable][i][j] == target) {
                rooms[roomName][key][targetTable][i][j] = 1;
                return;
            }
        }
    }

}
// Function for bot's move
function botMove(roomObj) {
    var randIndex = Math.floor(Math.random() * (roomObj[tags.LEFT_ARRAY].length));
    var ele = roomObj[tags.LEFT_ARRAY][randIndex];
    roomObj[tags.LEFT_ARRAY].splice(randIndex, 1);
    var target = "";
    if(ele % 10 == ele)
        target += "0";
    target = target + ele;
    return target;
}

//Function to create random array
function createRandom(a) {
    var tmp,cur,tp = a.length;
    while(--tp) {
        cur = Math.floor(Math.random() * (tp + 1));
        tmp = a[cur];
        a[cur] = a[tp];
        a[tp] = tmp;
    }
}

// Function to check BINGO status
function checkBingo(arr) {
    var res = 0;
    for(var i = 0;i < 5;i++) {
        var f = 1;
        for(var j = 0;j < 5; j++) {
            if(arr[i][j] == 0) {
                f = 0;
                break;
            }
        }
        res += f;
    }
    for(var i = 0;i < 5;i++) {
        var f = 1;
        for(var j = 0;j < 5; j++) {
            if(arr[j][i] == 0) {
                f = 0;
                break;
            }
        }
        res += f;
    }
    var f = 1;
    for(var i = 0;i < 5;i++) {
        if(arr[i][i] == 0) {
            f = 0;
            break;
        }
    }
    res += f;
    f = 1;
    for(var i = 0;i < 5;i++) {
        if(arr[i][4 - i] == 0) {
            f = 0;
            break;
        }
    }
    res += f;
    res = min(res, 5);
    return res;
}

function min(num1, num2) {
    if(num1 > num2) {
        return num2;
    }
    return num1;
}
