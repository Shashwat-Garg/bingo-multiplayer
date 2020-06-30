// Tags used with objects in the code
const tags = {
    COUNT_USER: 'countUser',
    COUNT_BOT: 'countBot',
    ELEMENT: 'element',
    ADD_TO_ROOM: 'addToRoom'
};

// Row and column dynamic variables
var row = 0, col = 0;

// Player's turn variable
var playerTurn = false;

// Storing username
var userName = document.getElementById("user-name").value;
document.getElementById("user-name").value = "";

// To trigger submit button by pressing enter
var trigEnter = document.getElementById("user-name");
trigEnter.addEventListener("keyup", function(event) {
    if(event.keyCode == 13) {
        event.preventDefault();
        document.getElementById("submit-username").click();
    }
});

// ********** Creating Socket *****
var socket = io("wss://bingo-multiplayer.herokuapp.com", {forceNew: true, autoConnect: false});
// var socket = io("http://localhost:5000", {forceNew: true, autoConnect: false});

// ***** End of creating Socket *****

// Creating input and output tables
var input = document.getElementById("input-table");
var output = document.getElementById("output-table");
outputInitializer(output);
inputTable(output);

// Creating gaming gnd bot's table
var gamingTable = document.getElementById("gaming-table");

socket.on('connect_error', function() {
    alert('Server is down!\nClose this tab and please try after some time...');
    socket.disconnect();
    socket.removeAllListeners();
});
socket.on('connect', function() {
    var JSobj = {
        username: userName
    };
    if(urlQuery()) {
        JSobj[tags.ADD_TO_ROOM] = urlQuery();
        document.getElementById("play-with-bot").style.display = "none";
        document.getElementById("host-game").style.display = "none";
    }
    else {
        document.getElementById("join-game").style.display = "none";
    }
    socket.emit('userNameInput', JSobj, function(retObj) {
        if(retObj.success) {
            document.getElementById("page0").style.display = "none";
            document.getElementById("page1").style.display = "inline-block";
            if(document.getElementById("rememberMe").checked) {
                setCookie("username", userName, 7);
            }
            document.getElementById("player-name").style.display = "inline-block";
            document.getElementById("player-name").innerHTML = userName;
        }
        else {
            alert(retObj.error);
        }
    });
});

// If host disconnects, alert the client
socket.on('hostDisconnected', function() {
    alert('Host has disconnected! Redirecting to home page...');
    window.location.href = window.location.pathname;
});

// Listener to check if host can start the game
socket.on('countUsers', function(data) {
    document.getElementById('players-list').innerHTML = null;
    var list = document.getElementById('players-list');
    var entry = document.createElement('li');
    entry.appendChild(document.createTextNode(data.players[0] + ' (Host)'));
    list.appendChild(entry);
    for(var i = 1;i < data.count; i++) {
        var entry = document.createElement('li');
        entry.appendChild(document.createTextNode(data.players[i]));
        list.appendChild(entry);
    }
    if(data.count >= 2) {
        if(urlQuery()) {
            document.getElementById("game-status").innerHTML = 'Waiting for host to start game...';
        }
        else {
            document.getElementById("game-status").innerHTML = 'You can start the game now...';
        }
        document.getElementById("start-game").disabled = false;
    }
    else {
        if(urlQuery()) {
            document.getElementById("game-status").innerHTML = 'Waiting for host to start game...';
        }
        else {
            document.getElementById("game-status").innerHTML = 'Waiting for more players...';
        }
        document.getElementById("start-game").disabled = true;
    }
});

// Listener to get game status from server
socket.on('sendData', function(data) {
    if(data.success) {
        if(data.turn == userName) {
            playerTurn = true;
        }
        if(data[tags.ELEMENT]) {
            disableUserCell(data[tags.ELEMENT]);
            bingoTicks(data[tags.COUNT_USER]);
        }
    }
    else {
        alert(data.error);
    }
});

// Listener to declare game has ended
socket.on('gameHasEnded', function(data) {
    document.getElementById("replay").disabled = false;
    disableAll(gamingTable);
    console.log(data);
    if(data.draw) {
        document.getElementById("end-result").innerHTML = 'It was a draw!';
    }
    else if(data.winner == userName) {
        document.getElementById("end-result").innerHTML = 'You won!';
    }
    else {
        document.getElementById("end-result").innerHTML = data.winner + ' won :(';
    }
});

// Listener to declare game has started
socket.on('gameHasStarted', function() {
    document.getElementById("page2").style.display = "none";
    document.getElementById("page3").style.display = "inline-block";
    outputBasedInputTable(output);
});

// *****Functions******

// Function to get query from url
function urlQuery() {
    var params = new URLSearchParams(window.location.search);
    return params.get('room');
}

// Function to start user's game with other user(s)
function playGame() {
    var obj = {
        username: userName
    };
    playerTurn = true;
    socket.emit('hostStartedGame', obj);
}

// Output table based input table function
function outputBasedInputTable(knownTable) {
    for(var i = 0;i < 5; i++) {
        var tr = document.createElement("tr");
        for(var j = 0;j < 5; j++) {
            var td = document.createElement("td");
            td.innerHTML = knownTable.rows[i].cells[j].innerHTML;
            td.className = "button button1";
            td.onclick = function() {
                if(playerTurn) {
                    playerTurn = false;
                    Disable(this);
                    var obj = {
                        username: userName,
                        element: parseInt(this.innerHTML, 10)
                    };
                    if(urlQuery()) {
                        obj[tags.ADD_TO_ROOM] = urlQuery();
                    }
                    socket.emit('userSelectedElement', obj);
                }
            }
            tr.appendChild(td);
        }
        gamingTable.appendChild(tr);
    }
}

// Function to direct user to game lobby
function gameLobby() {
    document.getElementById("page2").style.display = "inline-block";
    if(urlQuery()) {
        document.getElementById("start-game").style.display = "none";
        var JSobj = {
            username: userName,
            addToRoom: urlQuery()
        };
        socket.emit('addThisUserToRoom', JSobj, function(retObj) {
            if(! retObj.success) {
                alert(retObj.error);
            }
        });
    }
    else {
        var obj = {
            username: userName
        };
        socket.emit('modifyHost', obj);
    }
}

// Function to make user play with bot
function playWithBot() {
    document.getElementById("page3").style.display = "inline-block";
    var obj = {
        username: userName
    };
    playerTurn = true;
    socket.emit('createBotMatrix', obj, function(data) {
        if(data.success) {
            socket.emit('hostStartedGame', obj);
        }
        else {
            alert(data.error);
        }
    });
}

// Function to copy text to clipboard
function copyText() {
    var cText = document.createElement("input");
    if(urlQuery()) {
        cText.value = window.location;
    }
    else {
        cText.value = window.location + "?room=" + userName;
    }
    document.body.appendChild(cText);
    cText.select();
    cText.setSelectionRange(0, 99999);
    document.execCommand("copy");
    document.body.removeChild(cText);
    document.getElementById('copied-text').innerHTML = 'URL copied !';
    setTimeout(function() {
        document.getElementById('copied-text').innerHTML = null;
    }, 3000);
}

function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  var expires = "expires=" + d.toGMTString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for(var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "NA";
}

function checkCookie() {
  var user = getCookie("username");
  console.log(user);
  if (user != "NA") {
    document.getElementById("user-name").value = user;
    document.getElementById("submit-username").click();
  }
}

// Function to check if username is correctly entered
function confUser() {
    userName = document.getElementById("user-name").value;
    var userNameREGX = /^[A-Za-z0-9_]+$/;
    if((!userNameREGX.test(userName)) || (userName.length < 5) || (userName.length > 20)) {
        alert("Invalid username!");
        document.getElementById("user-name").setCustomValidity("Invalid username!");
    }
    else {
        document.getElementById("user-name").setCustomValidity("");
        socket.connect();
    }
}

// Function to check if matrix is filled completely
function confMatrix(callThisFunction) {
    if((row != 5) && (col != 5))
        alert("Please fill matrix completely !");
    else {
        document.getElementById("page1").style.display = "none";
        var JSobj = {
            username: userName
        }
        if(urlQuery()) {
            JSobj[tags.ADD_TO_ROOM] = urlQuery();
        }
        socket.emit('convertUserTableTo2D', JSobj, function(data) {
            if(data.success) {
                row = 0;
                col = 0;
                callThisFunction.call();
            }
            else {
                alert(data.error);
            }
        });
    }
}

// Function to reset input table
function resetTable() {
    row = 0;
    col = 0;
    output.innerHTML = null;
    outputInitializer(output);
    input.innerHTML = null;
    inputTable(output);
    var JSobj = {
        username: userName
    };
    if(urlQuery()) {
        JSobj[tags.ADD_TO_ROOM] = urlQuery();
    }
    socket.emit('resetMatrix', JSobj);
}

// Initialising output table
function outputInitializer(table) {
    var cnt = 1;
    for(var i = 0;i < 5;i++) {
        var tr = document.createElement("tr");
        for(var j = 0;j < 5;j++) {
            var td = document.createElement("td");
            td.innerHTML = "00";
            td.id = cnt;
            td.className = "outputcell";
            td.style.color = "white";
            tr.appendChild(td);
            cnt++;
        }
        table.appendChild(tr);
    }   
    table.rows[0].cells[0].innerHTML = "(*)";
    table.rows[0].cells[0].style.color = "black";
}

// Input table function
function inputTable(outputTable) {
    var cnt = 1;
    for(var i = 0;i < 5;i++) {  
        var tr = document.createElement("tr");
        for(var j = 0;j < 5;j++) {  
            var td = document.createElement("td");
            td.id = "input_";
            if(cnt % 10 == cnt) {
                td.innerHTML = "0";
                td.id += "0";
            }
            td.innerHTML += cnt;
            td.className = "button button1";
            td.id += cnt;
            td.onclick = function() {
                var JSobj = {
                    username: userName,
                    element:  parseInt(this.innerHTML, 10)
                };
                if(urlQuery()) {
                    JSobj[tags.ADD_TO_ROOM] = urlQuery();
                }
                socket.emit('matrixElementInput', JSobj);
                Disable(this);
                AddArr(this, outputTable);
            }
            tr.appendChild(td);
            cnt++;
        }
        input.appendChild(tr);
    }
}


// Function to show the current bingo ticks
function bingoTicks(cnt) {
    for(var i = 1;i <= cnt; i++) {
        var obj = document.getElementById('u'+i);
        if(obj.src.substring(obj.src.length - 8,obj.src.length) == "-CUT.png") {
            continue;
        }
        document.getElementById('u'+i).src  = obj.src.substring(0,obj.src.length - 4)+"-CUT.png";
    }
}

// Function to disable all buttons (called when game ends or when user selects random arrays)
function disableAll(table) {
    for(var i = 0;i < 5;i++) {
        for(var j = 0;j < 5;j++) {
            Disable(table.children[i].children[j]);
        }
    }
}

// Function to create random table
function createRandomTable(table, clName) {
    var JSobj = {
        username: userName
    };
    if(urlQuery()) {
        JSobj[tags.ADD_TO_ROOM] = urlQuery();
    }
    socket.emit('requestRandomMatrix', JSobj, function(data) {
        if(data.success) {
            var a = Array.from(data.matrix);
            for(var i = 0;i < 25;i++) {
                if(a[i] % 10 == a[i]) {
                    a[i] = "0" + a[i];
                }
                else {
                    a[i] = a[i] + "";
                }
            }
            var cnt = 0;
            for(var i = 0;i < 5;i++) {
                for(var j = 0;j < 5;j++) {
                    var td = table.rows[i].cells[j];
                    td.innerHTML = a[cnt];
                    td.id = cnt+1;
                    td.className = clName;
                    td.style.color = "black";
                    cnt++;
                }
            }
        }
        else {
            alert(data.error);
        }
    });
}

//Function to disable a button
function Disable(button) {
    button.onclick = null;
    button.className += " disabled_button";
}

// Function to add element to output able
function AddArr(button, outputTable) {
    outputTable.rows[row].cells[col].innerHTML = button.innerHTML;
    outputTable.rows[row].cells[col].style.color = "black";
    if(col == 4) {
        col = 0;
        row++;
    }
    else
        col++;
    if(row == 5 || col == 5)
        return;
    outputTable.rows[row].cells[col].innerHTML = "(*)";
    outputTable.rows[row].cells[col].style["text-align"] = "center";
    outputTable.rows[row].cells[col].style.color = "black";
}

// Function to disable user's table cell
function disableUserCell(target) {
    for(var i = 0;i < 5;i++) {
        for(var j = 0;j < 5;j++) {
            if(gamingTable.children[i].children[j].innerHTML == target) {
                Disable(gamingTable.children[i].children[j]);
                break;
            }
        }
    }
}

// Function to create random input table
function createRandomInput() {
    createRandomTable(output, "outputcell");
    disableAll(input);
    row = 5;
    col = 5;
}

socket.on('disconnect', function() {
    alert('Please refresh the page!');
    socket.removeAllListeners();
});

function replay() {
    // window.location.reload(true);
    window.location.href = window.location.pathname;
}
//  *****End Of Functions*****