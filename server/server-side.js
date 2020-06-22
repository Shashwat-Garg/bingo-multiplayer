// Importing required modules
const http = require('http');
const io = require('socket.io');
const validator = new (require('jsonschema').Validator)();

// Constants used in the script
const port = 3000;
const tags = {
    USERNAME: 'username',
    USER_TABLE: 'userTable',
    BOT_TABLE: 'botTable',
    ELEMENT: 'element',
    ARR_BOT: 'arrBot',
    ARR_USER: 'arrUser',
    COUNT_USER: 'countUser',
    COUNT_BOT: 'countBot',
    LEFT_ARRAY: 'leftArray',
    SOCKET_ID : 'id'
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
    pattern: /^[A-Za-z0-9_.]+$/
};

// Initialising rooms
var rooms = {};

// Start the server at port 3000
var server = http.createServer(function(req, res) {
    // Send HTML headers and message
    res.write(200, {'Content-Type': 'text/html'});
    res.end('<h1>Hello World!</h1>');
});

server.listen(port);

// Create a socket.IO instance, passing it our server
var socket = io.listen(server);

// Add a connect listener
socket.on('connect', function(client) {
    console.log('Socket connected ' + client[tags.SOCKET_ID]);

    // Success! Now listen to messages to be recieved
    client.on('userNameInput', function(data, callback) {
        var schema = {
            type: 'object',
            properties: {
                username: userNameSchema
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
        else {
            var arr = new Array(5);
            var arr2 = new Array(5);
            var cnt = 0;
            var leftArray = new Array(25);
            for(var i = 0;i < 5;i++) {
                arr[i] = new Array(5);
                arr2[i] = new Array(5);
                for(var j = 0;j < 5;j++) {
                    arr[i][j] = 0;
                    arr2[i][j] = 0;
                    leftArray[cnt] = cnt + 1;
                    cnt++;
                }
            }
            rooms[data[tags.USERNAME]] = {
                leftArray: leftArray,
            };
            rooms[data[tags.USERNAME]][data[tags.USERNAME]] = {
                arrBot: arr,
                arrUser: arr2,
                userTable: [],
                botTable: [],
                countUser: [0],
                countBot: [0]
            };
            // console.log(data);
            var successObj = {
                success: true,
                error: ""
            };
            client[tags.USERNAME] = data[tags.USERNAME];
            callback(successObj);
        }
    });
    client.on('matrixElementInput', function(obj) {
        var schema = {
            type: 'object',
            properties: {
                username: userNameSchema,
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
        else {
            rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.USER_TABLE].push(obj[tags.ELEMENT]);
            // console.log(rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.USER_TABLE]);
        }
    });
    client.on('resetMatrix', function(obj) {
        var schema = {
            type: 'object',
            properties: {
                username: userNameSchema
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
        else {
            rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.USER_TABLE] = [];
            // console.log(rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.USER_TABLE]);
        }
    });
    client.on('requestRandomMatrix', function(obj, callback) {
        var schema = {
            type: 'object',
            properties: {
                username: userNameSchema
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
        else if(obj[tags.USERNAME] in rooms) {
            var a = new Array(25);
            for(var i = 0;i < 25; i++) {
                a[i] = i + 1;
            }
            createRandom(a);
            var a2D = new Array(5);
            var cnt = 0;
            var temp = rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.USER_TABLE];
            rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.USER_TABLE] = new Array(5);
            for(var i = 0;i < 5; i++) {
                a2D[i] = new Array(5);
                rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.USER_TABLE][i] = new Array(5);
                for(var j = 0;j < 5; j++) {
                    a2D[i][j] = a[cnt];
                    rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.USER_TABLE][i][j] = temp[cnt];
                    cnt++;
                }
            }
            rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.BOT_TABLE] = a2D;
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
    })
    client.on('userSelection', function(obj, callback) {
        var schema = {
            type: 'object',
            properties: {
                username: userNameSchema,
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
        else if(obj[tags.USERNAME] in rooms) {
            modArr(rooms[obj[tags.USERNAME]], obj, obj[tags.ELEMENT]);
            rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.COUNT_USER][0] = checkBingo(rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.ARR_USER]);
            rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.COUNT_BOT][0] = checkBingo(rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.ARR_BOT]);
            // console.log('Before timeout',rooms[obj[tags.USERNAME]][obj[tags.USERNAME]]);
            var retObj = {
                success: true,
                countUser: rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.COUNT_USER][0],
                countBot: rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.COUNT_BOT][0],
                element: 'NA',
                error: ''
            };
            if((retObj[tags.COUNT_USER] == 5) || (retObj[tags.COUNT_BOT] == 5)) {
                callback(retObj);
            }
            setTimeout(function () {
                var target = botMove(rooms[obj[tags.USERNAME]]);
                modArr(rooms[obj[tags.USERNAME]], obj, parseInt(target, 10));
                rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.COUNT_USER][0] = checkBingo(rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.ARR_USER]);
                rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.COUNT_BOT][0] = checkBingo(rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.ARR_BOT]);
                // console.log('After timeout',rooms[obj[tags.USERNAME]][obj[tags.USERNAME]]);
                retObj[tags.COUNT_USER] = rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.COUNT_USER][0];
                retObj[tags.COUNT_BOT] = rooms[obj[tags.USERNAME]][obj[tags.USERNAME]][tags.COUNT_BOT][0];
                retObj[tags.ELEMENT] = target;
                callback(retObj);
            }, 700);
        }
        else {
            var errorObj = {
                success: false,
                error: 'Username doesn\'t exist!'
            };
            callback(errorObj);
        }
    });
    client.on('disconnect', function() {
        delete rooms[client[tags.USERNAME]];
        console.log('Socket disconnected ' + client[tags.SOCKET_ID]);
    });
});


// ****** Functions ******

// Function to update user's and bot's arrays
function modArr(room, obj, target) {
    for(var i = 0;i < room[tags.LEFT_ARRAY].length; i++) {
            if(room[tags.LEFT_ARRAY][i] == target) {
                room[tags.LEFT_ARRAY].splice(i, 1);
                break;
        }
    }
    for(var i = 0;i < 5;i++) {
        for(var j = 0;j < 5;j++) {
            if(room[obj[tags.USERNAME]][tags.USER_TABLE][i][j] == target) {
                room[obj[tags.USERNAME]][tags.ARR_USER][i][j] = 1;
            }
            if(room[obj[tags.USERNAME]][tags.BOT_TABLE][i][j] == target) {
                room[obj[tags.USERNAME]][tags.ARR_BOT][i][j] = 1;
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
    return res;
}
