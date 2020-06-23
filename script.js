// Tags used with objects in the code
const tags = {
	COUNT_USER: 'countUser',
	COUNT_BOT: 'countBot',
	ELEMENT: 'element'
};

// Row and column dynamic variables
var row = 0, col = 0;

// ********** Creating Socket *****
var socket = io.connect("http://bingo-multiplayer.herokuapp.com");

// Player's turn variable
var playerTurn;

// Storing username
var userName = document.getElementById("user-name").value;
document.getElementById("user-name").value = "";

// Creating input and output tables
var input = document.getElementById("input-table");
var output = document.getElementById("output-table");
outputInitializer(output);
inputTable(input, output, "input_");

// Creating gaming gnd bot's table
var gamingTable = document.getElementById("gaming-table");

// *****Functions******

// Function to check if username is correctly entered
function confUser() {
	userName = document.getElementById("user-name").value;
	var JSobj = {
		username: userName
	};
	socket.emit('userNameInput', JSobj, function(retObj) {
		if(retObj.success) {
			document.getElementById("page0").setAttribute("style","display: none;");
			document.getElementById("page1").style.display = "inline-block";
		}
		else {
			alert(retObj.error);
		}
	});
}
// Function to check if matrix is filled completely
function confMatrix() {
	if((row != 5) && (col != 5))
		alert("Please fill matrix completely !");
	else {
		clearScreen();
	}
}

// Function to reset input table
function resetTable() {
	row = 0;
	col = 0;
	output.innerHTML = null;
	outputInitializer(output);
	input.innerHTML = null;
	inputTable(input, output, "input_");
	var JSobj = {
		username: userName
	};
	socket.emit('resetMatrix', JSobj);
}

// Function to create random input table
function createRandomInput() {
	createRandomTable(output, "outputcell");
	disableAll(input);
	row = 5;
	col = 5;
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
			td.setAttribute("style", "color: white;");
			tr.appendChild(td);
			cnt++;
		}
		table.appendChild(tr);
	}	
	table.rows[0].cells[0].innerHTML = "(*)";
	table.rows[0].cells[0].setAttribute("style", "color: black");	
}

// Input table function
function inputTable(table, outputTable, cellId) {
	var cnt = 1;
	for(var i = 0;i < 5;i++) {	
		var tr = document.createElement("tr");
		for(var j = 0;j < 5;j++) {	
			var td = document.createElement("td");
			td.id = cellId;
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
				socket.emit('matrixElementInput', JSobj);
				Disable(this);
				AddArr(this, outputTable);
			}
			tr.appendChild(td);
			cnt++;
		}
		table.appendChild(tr);
	}
}

// Output table based input table function
function outputBasedInputTable(table, knownTable) {
	for(var i = 0;i < 5;i++) {	
		var tr = document.createElement("tr");
		for(var j = 0;j < 5;j++) {	
			var td = document.createElement("td");
			td.innerHTML = knownTable.rows[i].cells[j].innerHTML;
			td.className = "button button1";
			td.id = [i, j];
			td.onclick = function() {
				if(playerTurn) {
					playerTurn = false;
					Disable(this);
					var obj = {
						username: userName,
						element: parseInt(this.innerHTML, 10)
					};
					socket.emit('userSelection', obj, function(data) {
						if(data.success) {
							playerTurn = true;
							disableUserCell(data[tags.ELEMENT]);
							bingoTicks(data[tags.COUNT_USER]);
							if((data[tags.COUNT_USER] == 5) || (data[tags.COUNT_BOT] == 5)) {
								disableAll(table);
								document.getElementById("replay").disabled = false;
							}
							if((data[tags.COUNT_USER] == 5 ) && (data[tags.COUNT_BOT] == 5)) {
								document.getElementById("end-result").innerHTML = "It Was A Draw !!!";
							}
							else if(data[tags.COUNT_USER] == 5) {
								document.getElementById("end-result").innerHTML = "You Won !!!";
							}
							else if(data[tags.COUNT_BOT] == 5) {
								document.getElementById("end-result").innerHTML = "Bot Won :(";
							}
						}
						else {
							alert(data.error);
						}
					});
				}
			}
			tr.appendChild(td);
		}
		table.appendChild(tr);
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
					td.setAttribute("style", "color: black;");
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
	outputTable.rows[row].cells[col].setAttribute("style","color: black");
	if(col == 4) {
		col = 0;
		row++;
	}
	else
		col++;
	if(row == 5 || col == 5)
		return;
	outputTable.rows[row].cells[col].innerHTML = "(*)";
	outputTable.rows[row].cells[col].setAttribute("style", "text-align: center; color: black");
}

// Function to proceed to next page
function clearScreen() {
	document.getElementById("page1").setAttribute("style","display: none;");
	document.getElementById("page2").setAttribute("style","display: inline-block");
	row = 0;
	col = 0;
	playerTurn = true;
	var obj = {
		username: userName
	};
	socket.emit('createBotMatrix', obj, function(data) {
		if(data.success) {
			outputBasedInputTable(gamingTable, output);
		}
		else {
			alert(data.error);
		}
	});
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

function replay() {
	window.location.reload();
}
//	*****End Of Functions*****