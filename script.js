var arrBot = new Array(5);
var arrUser = new Array(5);
var row = 0,col = 0;
for(var i = 0;i < 5;i++) {
	arrUser[i] = new Array(5);
	arrBot[i] = new Array(5);
}
for(var i = 0;i < 5;i++) {
	for(var j = 0;j < 5;j++) {
		arrUser[i][j] = 0;
		arrBot[i][j] = 0;
	}
}

//Player's Turn Variable
var playerTurn;

//Winning Player's Variable
var userWon;
var botWon;

//Creating Left Array And Used Array
var leftArray = new Array(25);
var usedArray = new Array(0);

//Creating Input And Output Tables
var input = document.getElementById("input-table");
var output = document.getElementById("output-table");
outputInitializer(output);
inputTable(input, output, "input_");

// Creating Gaming And Bot's Table
var gamingTable = document.getElementById("gaming-table");
var botTable = document.getElementById("bot-table");

// Gaming Object Dictionary
var game = {"user-matrix": gamingTable, 
			"bot-matrix": botTable, 
			"left-numbers": leftArray, 
			"used-numbers": usedArray};
//Creating BINGO strings for user and bot
var cntUser;
var cntBot;

// *****Functions******

//Function To Check If Table Is Completely Filled
function confCheck(page1, page2) {
	if(row == 5 || col == 5)
		clearScreen(page1, page2);
	else
		alert("Please Fill Matrix Completely !");
}

//Function To Reset Input Table
function resetTable() {
	row = 0;
	col = 0;
	output.innerHTML = null;
	outputInitializer(output);
	input.innerHTML = null;
	inputTable(input, output, "input_");
}

//Function To Create Random Input Table
function createRandomInput() {
	output.innerHTML = null;
	createRandomTable(output, "outputcell");
	for(var i = 0;i < 5;i++)
		for(var j = 0;j < 5;j++)
			Disable(input.children[i].children[j].children[0]);
	row = 5;
	col = 5;	
}

//Initialising Output Table
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
	table.rows[0].cells[0].innerHTML = "*";
	table.rows[0].cells[0].setAttribute("style", "text-align: center; color: black");	
}

//Input Table Function
function inputTable(table, outputTable, cellId) {
	var cnt = 1;
	for(var i = 0;i < 5;i++) {	
		var tr = document.createElement("tr");
		for(var j = 0;j < 5;j++) {	
			var td = document.createElement("td");
			var button = document.createElement("button");
			button.id = cellId;	
			if(cnt % 10 == cnt) {
				button.innerHTML = "0";
				button.id  += "0";
			}
			button.innerHTML += cnt;
			button.className = "button button1";
			button.onclick = function() {
				Disable(this);
				AddArr(this, outputTable);
			}
			cnt++;
			td.appendChild(button);
			tr.appendChild(td);
		}
		table.appendChild(tr);
	}
}

//Output Table Based Input Table Function
function outputBasedInputTable(table, knownTable) {
	for(var i = 0;i < 5;i++) {	
		var tr = document.createElement("tr");
		for(var j = 0;j < 5;j++) {	
			var td = document.createElement("td");
			var button = document.createElement("button");
			button.innerHTML = knownTable.rows[i].cells[j].innerHTML;
			button.className = "button button1";
			button.id = [i, j];
			button.onclick = function() {
				if(playerTurn) {
					playerTurn = false;
					Disable(this);
					play(this.innerHTML);
					checkBingo(this.id[0], this.id[2], arrUser, cntUser, "u");
				}
			}
			td.appendChild(button);
			tr.appendChild(td);
		}
		table.appendChild(tr);
	}
}

//Function To Create Random Table
function createRandomTable(table, clName) {
	var a = new Array(25);
	for(var i = 0;i < 25;i++) {
		a[i] = i + 1;
	}
	createRandom(a);
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
		var tr = document.createElement("tr");
		for(var j = 0;j < 5;j++) {	
			var td = document.createElement("td");		
			td.innerHTML = a[cnt];
			td.id = cnt+1;
			td.className = clName;
			cnt++;
			tr.appendChild(td);
		}
		table.appendChild(tr);
	}
}

//Function To Create Random Array
function createRandom(a) {
	var tmp,cur,tp = a.length;
	while(--tp) {
		cur = Math.floor(Math.random()*(tp + 2));
		tmp = a[cur];
		a[cur] = a[tp];
		a[tp] = tmp;
	}
}

//Function To Disable A Button
function Disable(button) {
	button.disabled = true;
	button.className += " disabled_button";
}

//Function To Add Element To Output Table
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
	outputTable.rows[row].cells[col].innerHTML = " *";
	outputTable.rows[row].cells[col].setAttribute("style", "text-align: center; color: black");
}

//Clearing Current Page And Showing Next Page
function clearScreen(page1,page2) {
	document.getElementById(page1).setAttribute("style","display: none;");
	document.getElementById(page2).setAttribute("style","display: inline-block");
	row = 0;
	col = 0;
	playerTurn = true;
	for(var i = 1;i <= 25;i++) {
		leftArray[i-1] = i;
	}
	cntBot = [0];
	cntUser = [0];
	userWon = false;
	botWon = false;
	createRandomTable(botTable, "table2");
	outputBasedInputTable(gamingTable, output);
}

//Function To Play With Bot
function play(value) {
	if(leftArray.length == 0)
		return;
	for(var i = 0;i < 25;i++) {
			if(leftArray[i] == parseInt(value, 10)) {
				usedArray.push(parseInt(value, 10));
				leftArray.splice(i, 1);
		}
	}
	for(var i = 0;i < 5;i++) {
		for(var j = 0;j < 5;j++) {
			if(botTable.rows[i].cells[j].innerHTML == value) {
				botTable.rows[i].cells[j].setAttribute("style", "color: white;");
				checkBingo(i, j, arrBot, cntBot, "b");
			}
		}
	}
	setTimeout(function (){
		play2(value);
		playerTurn = true;}, 700);
}

//Function To Track Bot's Move
function play2(value) {
	var randIndex = Math.floor(Math.random()*(leftArray.length));
	var ele = leftArray[randIndex];
	usedArray.push(leftArray[randIndex]);
	leftArray.splice(randIndex, 1);
	var target = "";
	if(ele % 10 == ele)
		target += "0";
	target = target + ele;
	for(var i = 0;i < 5;i++) {
		for(var j = 0;j < 5;j++) {
			if(gamingTable.children[i].children[j].children[0].innerHTML == target) {
				Disable(gamingTable.children[i].children[j].children[0]);
				checkBingo(i, j, arrUser, cntUser, "u");
			}
			if(botTable.rows[i].cells[j].innerHTML == target) {
				botTable.rows[i].cells[j].setAttribute("style", "color: white;");
				checkBingo(i, j, arrBot, cntBot, "b");
			}
		}
	}
}

//Function To Print End Result

// Function To Check BINGO Status
function checkBingo(r, c, arr, cnt, ch) {
	if(cnt[0] == 5) {
		for(var i = 0;i < 5;i++) {
			for(var j = 0;j < 5;j++) {
				botTable.rows[i].cells[j].setAttribute("style", "color: white;");
				Disable(gamingTable.children[i].children[j].children[0]);
			}
		}
		if(ch == "u") {
			userWon = true;
			if(botWon == true) {
				document.getElementById("end-result").innerHTML = "It Was A Draw !!!";
				return;
			}
			document.getElementById("end-result").innerHTML = "You Won !!!";
		}
		else {
			botWon = true;
			if(userWon == true) {
				document.getElementById("end-result").innerHTML = "It Was A Draw !!!";
				return;
			}
			document.getElementById("end-result").innerHTML = "Bot Won :(";
		}
		return;
	}
	r = parseInt(r, 10);
	c = parseInt(c, 10);
	arr[r][c] = 1;
	var frow = 1,fcol = 1;
	for(var i = 0;i < 5;i++) {
		if(arr[r][i] == 0) {
			frow = 0;
			break;
		}
	}
	for(var i = 0;i < 5;i++) {
		if(arr[i][c] == 0) {
			fcol = 0;
			break;
		}
	}
	if(frow == 1) {
		cnt[0]++;
		document.getElementById(ch+cnt[0]).setAttribute("style","text-decoration: line-through");
	}
	if(fcol == 1 && cnt[0] < 5) {
		cnt[0]++;
		document.getElementById(ch+cnt[0]).setAttribute("style","text-decoration: line-through");
	}
	if(r == c) {
		var fdiagLeft = 1;
		for(var i = 0;i < 5;i++) {
			if(arr[i][i] == 0) {
				fdiagLeft = 0;
				break;
			}
		}
		if(fdiagLeft == 1 && cnt[0] < 5) {
			cnt[0]++;
			document.getElementById(ch+cnt[0]).setAttribute("style","text-decoration: line-through");
		}
	}
	if((r + c) == 4) {
		var fdiagRight = 1;
		for(var i = 0;i < 5;i++) {
			if(arr[i][4 - i] == 0) {
				fdiagRight = 0;
				break;
			}
		}
		if(fdiagRight == 1 && cnt[0] < 5){
			cnt[0]++;
			document.getElementById(ch+cnt[0]).setAttribute("style","text-decoration: line-through");
		}
	}
}
//	*****End Of Functions*****