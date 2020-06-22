// Importing requried modules
const http = require('http');
const io = require('socket.io');
const validator = new (require('jsonschema').Validator)();
const port = 3000;

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

// Initialising room
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
    console.log('Socket connected '+client.id);

    // Success! Now listen to messages to be recieved
    client.on('userNameInput', function(data, callback) {
        var schema = {
            type: 'object',
            properties: {
                username: userNameSchema
            },
            required: ['username'],
            additionalProperties: false
        };
        if((!data) || (validator.validate(data, schema).errors.length > 0)) {
            var errorObj = {
                success: false,
                error: 'Invalid username!'
            };
            callback(errorObj);
        }
        else if(data.username in rooms) {
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
                    leftArray[cnt] = cnt+1;
                    cnt++;
                }
            }
            rooms[data.username] = {
                leftarray: leftArray,
            };
            rooms[data.username][data.username] = {
                arrbot: arr,
                arruser: arr2,
                usertable: [],
                bottable: [],
                cntuser: [0],
                cntbot: [0]
            };
            console.log(data);
            var successObj = {
                success: true,
                error: ""
            };
            client.username = data.username;
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
            required: ['username','element'],
            additionalProperties: false
        };
        if((!obj) || (validator.validate(obj, schema).errors.length > 0)) {
            console.log("Attempt to breach! Disconnecting socket "+client.id);
            if(client.id in socket.sockets.connected) {
                client.disconnect(true);
            }
        }
        else {
            rooms[obj.username][obj.username]['usertable'].push(obj.element);
            console.log(rooms[obj.username][obj.username]['usertable']);
        }
    });
    client.on('resetMatrix', function(obj) {
        var schema = {
            type: 'object',
            properties: {
                username: userNameSchema
            },
            required: ['username'],
            additionalProperties: false
        }
        if((!obj) || (validator.validate(obj, schema).errors.length > 0)) {
            console.log("Attempt to breach! Disconnecting socket "+client.id);
            if(client.id in socket.sockets.connected) {
                client.disconnect(true);
            }
        }
        else {
            rooms[obj.username][obj.username]['usertable'] = [];
            console.log(rooms[obj.username][obj.username]['usertable']);
        }
    });
    client.on('requestRandomMatrix', function(obj, callback) {
        var schema = {
            type: 'object',
            properties: {
                username: userNameSchema
            },
            required: ['username'],
            additionalProperties: false
        }
        if((!obj) || (validator.validate(obj, schema).errors.length > 0)) {
            console.log("Attempt to breach! Disconnecting socket "+client.id);
            if(client.id in socket.sockets.connected) {
                client.disconnect(true);
            }
        }
        else if(obj.username in rooms) {
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
            rooms[obj.username][obj.username]['usertable'] = a;
            console.log(rooms[obj.username][obj.username]['usertable']);
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
            required: ['username'],
            additionalProperties: false
        };
        if((!obj) || (validator.validate(obj, schema).errors.length > 0)) {
            console.log("Attempt to breach! Disconnecting socket "+client.id);
            if(client.id in socket.sockets.connected) {
                client.disconnect(true);
            }
        }
        else if(obj.username in rooms) {
            var a = new Array(25);
            for(var i = 0;i < 25; i++) {
                a[i] = i + 1;
            }
            createRandom(a);
            var a2D = new Array(5);
            var cnt = 0;
            var temp = rooms[obj.username][obj.username].usertable;
            rooms[obj.username][obj.username].usertable = new Array(5);
            for(var i = 0;i < 5; i++) {
                a2D[i] = new Array(5);
                rooms[obj.username][obj.username].usertable[i] = new Array(5);
                for(var j = 0;j < 5; j++) {
                    a2D[i][j] = a[cnt];
                    rooms[obj.username][obj.username].usertable[i][j] = temp[cnt];
                    cnt++;
                }
            }
            rooms[obj.username][obj.username].bottable = a2D;
            console.log(rooms[obj.username][obj.username].bottable);
            console.log(rooms[obj.username][obj.username].usertable);
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
            required: ['username','element'],
            additionalProperties: false
        };
        if((!obj) || (validator.validate(obj, schema).errors.length > 0)) {
            console.log("Attempt to breach! Disconnecting socket "+client.id);
            if(client.id in socket.sockets.connected) {
                client.disconnect(true);
            }
        }
        else if(obj.username in rooms) {
            modArr(rooms[obj.username], obj, obj.element);
            rooms[obj.username][obj.username].cntuser[0] = checkBingo(rooms[obj.username][obj.username].arruser);
            rooms[obj.username][obj.username].cntbot[0] = checkBingo(rooms[obj.username][obj.username].arrbot);
            console.log('Before timeout',rooms[obj.username][obj.username]);
            var retObj = {
                success: true,
                countuser: rooms[obj.username][obj.username].cntuser[0],
                countbot: rooms[obj.username][obj.username].cntbot[0],
                element: 'NA',
                error: ''
            };
            if((retObj.countuser == 5) || (retObj.countbot == 5)) {
                callback(retObj);
            }
            setTimeout(function () {
                var target = botMove(rooms[obj.username]);
                modArr(rooms[obj.username], obj, parseInt(target, 10));
                rooms[obj.username][obj.username].cntuser[0] = checkBingo(rooms[obj.username][obj.username].arruser);
                rooms[obj.username][obj.username].cntbot[0] = checkBingo(rooms[obj.username][obj.username].arrbot);
                console.log('After timeout',rooms[obj.username][obj.username]);
                retObj = {
                    success: true,
                    countuser: rooms[obj.username][obj.username].cntuser[0],
                    countbot: rooms[obj.username][obj.username].cntbot[0],
                    element: target,
                    error: ''
                };
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
        delete rooms[client.username];
        console.log('Socket disconnected '+client.id);
    });
});

console.log('Server running at http://localhost:' + port + '/');

// ****** Functions *****

// Function to update user's and bot's arrays
function modArr(room, obj, target) {
    for(var i = 0;i < room.leftarray.length; i++) {
            if(room.leftarray[i] == target) {
                room.leftarray.splice(i, 1);
                break;
        }
    }
    for(var i = 0;i < 5;i++) {
        for(var j = 0;j < 5;j++) {
            if(room[obj.username].usertable[i][j] == target) {
                room[obj.username].arruser[i][j] = 1;
            }
            if(room[obj.username].bottable[i][j] == target) {
                room[obj.username].arrbot[i][j] = 1;
            }
        }
    }
}
// Function for bot's move
function botMove(roomObj) {
    var randIndex = Math.floor(Math.random()*(roomObj.leftarray.length));
    var ele = roomObj.leftarray[randIndex];
    roomObj.leftarray.splice(randIndex, 1);
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
        cur = Math.floor(Math.random()*(tp + 1));
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
