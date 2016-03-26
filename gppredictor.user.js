// ==UserScript==
// @name         Estimated points for gppredictor
// @namespace    https://github.com/NitrogenUA/gppredictor-addon
// @version      1.0
// @description  Attempts to estimate league points every user will get based of their predictions.
// @author       Nitrogen
// @match        http://gppredictor.com/league/show/id/*/code/*
// @run-at       document-end
// @grant        none
// @updateURL    https://raw.githubusercontent.com/NitrogenUA/gppredictor-addon/master/gppredictor.user.js
// ==/UserScript==
/* jshint -W097 */
'use strict';

var currentDate = new Date(), time, debug = false, pointsCalculatedFlag;
//Removing top banner
$("#leaderboard").empty(); //Comment this line if you'd like the banner to stay.
//$("#leaderboardwrapper").remove(); //Use this instead to remove top block altogether.

//Determine the latest round completed.
var raceId;
$('#roundcarousel #round-date').each(function (index) {
  if (new Date(this.textContent) < currentDate) {
    raceId = index + 1;
  }
});
if (debug) {
  console.log("Latest round completed: " + raceId);
  time = new Date() - currentDate;
  console.log("Split after latest round is determined: " + time / 1000);
}

var leagueUrl = location.href.split('/'), leagueId = leagueUrl.indexOf('id') + 1;
leagueId = leagueUrl[leagueId];
var tempContainer = document.createElement('div');
//Check the page of the latest round completed to see if the points are already calculated or not.
$(tempContainer).load('/ajax/league-table' + " #myperformance-locked", {raceId: raceId, leagueId: leagueId}, function () {
  if ($("#myperformance-locked", tempContainer).length === 0) {
    pointsCalculatedFlag = true;
    if (debug)
      console.log("Points already calculated!");
    //If debug mode is active calculate the points anyway, otherwise halt further execution.
    if (!debug)
      return;
    GetRaceResults(raceId);
  }
  else
    GetRaceResults(raceId);
});

function GetRaceResults(roundNumber) {
  //Load race results.
  var raceResults = new Array();
  $.getJSON("https://raw.githubusercontent.com/NitrogenUA/gppredictor-addon/master/raceResults.json", function (data) {
    $.each(data.raceResults[roundNumber - 1], function (key, val) {
      raceResults[key] = val;
    });
    if (debug) {
      console.log("Race results: ");
      console.log(raceResults);
      time = new Date() - currentDate;
      console.log("Split after race results obtained: " + time / 1000);
    }
    MainRoutine(raceResults);
  }).fail(function () {
    //If race results aren't published yet or the results provided are not a JSON - halt further execution.
    return;
  });
}

function MainRoutine(raceResults) {
  var asyncCounter = 0;
  var leaguePredictions = new Array();
  //Get profile links for all league members
  var profileLinks = $("div#tabs-1 table.leaderboard > tbody > tr > td > a");
  profileLinks.each(function (index) {
    GetLeaguePrediction($(this).attr('href'), index);
  });

  function GetLeaguePrediction(url, i) {
    var tempContainer = document.createElement('div');
    tempContainer.id = "temp-container" + i;
    tempContainer.className = "hidden";
    document.body.appendChild(tempContainer);
    var context = $("#temp-container" + i);
    context.load(url + " #myperformance-cont", function () {
      var predictions = new Array();
      //Get profile predictions, positions 1 through 3.
      $("> #myperformance-cont div.minicontainer > div.minipodium", context).each(function () {
        //retrieving positions numbers
        var positionIndices = new Array();
        $("> div[class*=minipos_]", this).each(function () {
          positionIndices.push(this.textContent);
        });
        //arranging drivers according to predicted positions
        $("> div[class*=mini_] > div.drivertext > span:first-of-type", this).each(function (index) {
          predictions[positionIndices[index]] = this.textContent;
        });
      });
      //Get profile predictions, positions 4 through 10.
      $("> #myperformance-cont div.minicontainer > div.listcontainer > div[class*=minilist]", context).each(function () {
        //get predicted driver position
        var position = $("> div.placing-number", this)[0].textContent;
        //retrieve driver lastname
        var driverName = $("div.drivertext > span:first-of-type", this)[0].textContent;
        predictions[position] = driverName;
      });
      //Get prediction extras - pole sitter, fastest lap poster and the driver who gained the most positions.
      $("#myperformance-other div.other-hold", context).each(function () {
        if ($("h2", this)[0].textContent === "POLEPOSITION")
          predictions['polePosition'] = $("div.nametag", this)[0].textContent.split(" ")[1].toUpperCase();
        if ($("h2", this)[0].textContent === "FASTESTLAP")
          predictions['fastestLap'] = $("div.nametag", this)[0].textContent.split(" ")[1].toUpperCase();
        if ($("h2", this)[0].textContent === "POSITIONSGAINED")
          predictions['positionsGained'] = $("div.nametag", this)[0].textContent.split(" ")[1].toUpperCase();
      });
      leaguePredictions[url] = predictions;
      asyncCounter++;
      if (debug) {
        time = new Date() - currentDate;
        console.log("Split after profile #" + i + " predictions received and parsed: " + time / 1000);
      }
    });
  }

  var checkExist = setInterval(function () {
    if (asyncCounter === profileLinks.length) {
      if (debug) {
        time = new Date() - currentDate;
        console.log("Split after all predictions parsed: " + time / 1000);
      }
      clearInterval(checkExist);
      CalculatePoints();
    }
  }, 100);

  function CalculatePoints() {
    //Remove all temporary containers.
    $("div[id*=temp-container]").remove();
    if (debug) {
      console.log("League predictions: ");
      console.log(leaguePredictions);
    }
    //Compare users' predictions with actual race results and award points according to scoring rules http://gppredictor.com/howtoplay
    var keys = Object.keys(leaguePredictions);
    for (var i = 0; i < keys.length; i++) {
      //initialize user points
      leaguePredictions[keys[i]]['points'] = 0;
      //calculating points for driver-specific predictions
      for (var k = 1; k <= 10; k++) {
        leaguePredictions[keys[i]]['points'] += CheckPrediction(leaguePredictions[keys[i]][k], k);
      }
      //calculating points for extra predictions
      leaguePredictions[keys[i]]['points'] += CheckPredictionExtras(
              leaguePredictions[keys[i]]['polePosition'],
              leaguePredictions[keys[i]]['fastestLap'],
              leaguePredictions[keys[i]]['positionsGained']
              );
      //calculating bonus points for accurately predicted sequence
      var accuratePredictedSequence = 0;
      for (var k = 1; k <= 10; k++) {
        if (leaguePredictions[keys[i]][k] === raceResults[k])
          accuratePredictedSequence++;
        else
          break;
      }
      if (accuratePredictedSequence >= 1)
        leaguePredictions[keys[i]]['points'] += 10; //predicted race winner
      if (accuratePredictedSequence >= 3)
        leaguePredictions[keys[i]]['points'] += 30; //predicted top 3
      if (accuratePredictedSequence >= 6)
        leaguePredictions[keys[i]]['points'] += 60; //predicted top 6
      if (accuratePredictedSequence === 10)
        leaguePredictions[keys[i]]['points'] += 100; //predicted top 10
    }
    //include estimated awarded points into league table
    PrintPoints();
    if (debug) {
      time = new Date() - currentDate;
      console.log("Execution time: " + time / 1000);
    }
  }

  function CheckPrediction(driver, predictedPosition) {
    //read actual finish position of the specific driver, than compare it with predicted finish position
    var actualPosition = raceResults.indexOf(driver);
    if (actualPosition <= 0)
      return 0;
    var predictionAccuracy = Math.abs(predictedPosition - actualPosition);
    if (predictionAccuracy > 2)
      return 0; //prediction more than 2 positions away - award 0 points
    if (predictionAccuracy === 2)
      return 2; //within 2 positions - award 2 points
    if (predictionAccuracy === 1)
      return 5; //within 1 position - award 5 points
    if (predictionAccuracy === 0)
      return 10; //correct prediction - award 10 points
  }

  function CheckPredictionExtras(polePosition, fastestLap, positionsGained) {
    var extraPoints = 0;
    if (polePosition === raceResults['polePosition'])
      extraPoints += 5;
    if (fastestLap === raceResults['fastestLap'])
      extraPoints += 5;
    if (positionsGained === raceResults['positionsGained'])
      extraPoints += 5;
    //add bonus points for predicting all 3 correctly
    if (extraPoints === 15)
      extraPoints += 20;
    return extraPoints;
  }

  function PrintPoints() {
    var tableElem = $("div#tabs-1 table.leaderboard")[0];
    var tableHead = $("> thead > tr", tableElem)[0];
    var oCell = document.createElement('th');
    oCell.innerHTML = "ESTIMATED GAIN";
    tableHead.appendChild(oCell);
    //If gppredictor haven't calculated points yet - display estimated total.
    if (!pointsCalculatedFlag) {
      oCell = document.createElement('th');
      oCell.innerHTML = "TOTAL";
      tableHead.appendChild(oCell);
    }
    var tableRows = $("> tbody > tr", tableElem);
    tableRows.each(function () {
      var currentPoints = $("td", this).filter(function () {
        return this.textContent.length !== 0;
      }).get(-1).textContent;
      var key = $("a", this).attr('href');
      var myCell = this.insertCell(-1);
      $(myCell).css({color: "#00cc00"});
      myCell.innerHTML = "+" + leaguePredictions[key]['points'];
      //If gppredictor haven't calculated points yet - display estimated total.
      if (!pointsCalculatedFlag) {
        myCell = this.insertCell(-1);
        myCell.innerHTML = leaguePredictions[key]['points'] + parseInt(currentPoints);
      }
    });
    //If gppredictor haven't calculated points yet - sort table according to estimated points
    if (!pointsCalculatedFlag) {
      //sort table to take estimated points into account
      var sorted = tableRows.sort(function (a, b) {
        var ax = parseInt($("td", a).filter(function () {
          return this.textContent.length !== 0;
        }).get(-1).textContent);
        var bx = parseInt($("td", b).filter(function () {
          return this.textContent.length !== 0;
        }).get(-1).textContent);
        return bx - ax;
      });
      //move sorted records into the new container
      var newTBody = document.createElement("tbody");
      $(newTBody).append(sorted);
      $(tableElem).append(newTBody);
      //get rid of the old container
      $("tbody", tableElem).filter(function () {
        return $(this).children().length === 0;
      }).remove();
      //if (debug) console.log(tableRows);
      //change RANK numbers accordingly
      tableRows.each(function (index) {
        var elem = $("td:first-of-type", this)[0];
        elem.innerHTML = index + 1;
      });
      //assign css accordingly
      var currentUser = $("> tbody > tr.findme", tableElem);
      $("> tbody > tr:even", tableElem).each(function () {
        this.className = "even";
      });
      $("> tbody > tr:odd", tableElem).each(function () {
        this.className = "odd";
      });
      currentUser.addClass("findme");
    }
  }
}
