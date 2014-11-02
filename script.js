/*jslint browser: true, plusplus: true*/
/*global $, console, PieChart*/

var questionNumber = 0;
var responses = [];
var firstName;
var userData;

var json;
var jsonURL = "https://techonup.github.io/quiz.json";
var flickrURL = "https://api.flickr.com/services/rest/?&method=flickr.photos.search&api_key=070f5d06eaefc2ccb14dbc52ca35c6d5&format=json&per_page=1&tags="

function callback(response) {
    "use strict";
    
    // See below for an explanation.
    json = response;

    $("#title").text(json[0].title);
    
    // Prevents quiz from being accessed before JSON loads.
    $("#loading").hide();
    $("#body").show();
}

$(document).ready(function () {
    "use strict";
    
    // 9/30/14
    // This is a very hacky way of getting the JSON.
    // JSON-P is already a really hacky way of getting around cross-domain security policies,
    // but here we use it to just get JSON. The page returns "callback(json)" (the JSON-P tags are ignored)
    // and the callback function (defined above) writes that JSON to a variable. Any other form of data 
    // could also be returned.
    // HTTP is used instead of HTTPS to save about 75ms of loading time.
    //
    // 10/6/14
    // Added cache. Shaves a bit off loading time.
    $.ajax({
        type: "POST",
        dataType: "jsonp",
        jsonpCallback: "callback",
        url: jsonURL,
        crossDomain: true,
        cache: true
    });
    
    userData = JSON.parse(localStorage.getItem("users"));
    
    if (userData === null) {
        userData = {};
    }
});

function results() {
    "use strict";
    
    // JSLint requires this to be here for the later "for" loop. Honestly, kind of silly,
    // but since JSLint is nice for other things and Brackets doesn't allow you to use 
    // other hinters, we'll deal with it.
    var i, pieChart, correct = 0, correctPct, incorrectPct, correctDeg, incorrectDeg, scores;
    
    for (i = 0; i < responses.length; i++) {
        if (responses[i] === json[i + 1].correct) {
            correct++;
        }
    }
    
    $("#score").text(firstName + ", you got " + correct.toString() + " right out of " +
                     (Object.keys(json).length - 1).toString() + " questions!");
    
    correctDeg = correct * 360 / (Object.keys(json).length - 1);
    correctPct = (correct * 100 / (Object.keys(json).length - 1)).toString() + "% Correct";
    
    if (correct !== Object.keys(json).length) {
        incorrectDeg = 360 - correctDeg;
        incorrectPct = ((Object.keys(json).length - correct - 1) * 100 / (Object.keys(json).length - 1)
                        .toString()) + "% Incorrect";
    } else {
        incorrectDeg = 0;
        incorrectPct = '';
    }
    
    pieChart = new PieChart("piechart",
        {
            includeLabels: true,
            data: [correctDeg, incorrectDeg],
            labels: [correctPct, incorrectPct],
            colors: [["#009933", "#009933"], ["#CC0000", "#CC0000"]]
        });
    
    pieChart.draw();
    
    userData[firstName][1] = (correct * 100 / (Object.keys(json).length - 1));
    scores = [];
    
    Object.keys(userData).forEach(function (value, index, array) {
        scores.push([value, userData[value][1]]);
    });
    
    console.log(scores);
    
    scores.sort(function (a, b) {
        a = a[1];
        b = b[1];
        return (a === b ? 0 : (a < b ? 1 : -1));
    });
    
    console.log(scores);
    
    for (i = 0; i < scores.length; i++) {
        $("#table").append("<tr><td>" + scores[i][0] + "</td><td>" + scores[i][1].toString() + "</td></tr>");
    }
    
    localStorage.setItem("users", JSON.stringify(userData));
}

function jsonFlickrApi(data) {
    "use strict";
    
    data = data.photos.photo[0]
    
    $("#flickr").empty();
    $("#flickr").html("<img src='https://farm" + data.farm.toString() + ".staticflickr.com/" + data.server + "/" 
                      + data.id + "_" + data.secret + "_n.jpg'>");
    
    $("#flickr").fadeIn();
}

function nextQuestion() {
    "use strict";
    
    // See above.
    var i;
    
    questionNumber = questionNumber + 1;
    
    $("#questions").hide();
    $("#buttons").hide();
    
    if (questionNumber === 1) {
        $("#back").hide();
    } else if (questionNumber === 2) {
        $("#back").show();
        $("#alerts").hide();
    }
    
    // Since "json" is an Object of Objects, this works as a method of counting questions.
    // Allows any number of questions to be used.
    if (questionNumber === Object.keys(json).length) {
        $("#results").fadeIn();
        
        results();
        return;
    }
    
    // Show question number, question text, and image. Images are hosted locally (specifically for 
    // this quiz variant). Since text is loaded from the JSON file, if the image line is commented
    // out, this code can be used for any text quiz.
    $("#number").text(questionNumber.toString());
    $("#question").html("<h4>" + json[questionNumber].question + ", " + firstName + "?");
    $("#image").html("<img src='images/" + questionNumber + ".png'>");
    
    $("#flickr").hide();
    // Get Flickr image.
    $.ajax({
        type: "POST",
        dataType: "jsonp",
        jsonpCallback: "jsonFlickrApi",
        url: (flickrURL + json[questionNumber].choices[json[questionNumber].correct - 1]),
        crossDomain: true,
    });
        
    
    // Allows any number of choices. Since the choice is stored as a number, there is no limit
    // on how many choices can be implemented.
    $("#answers").empty();
    for (i = 1; i <= json[questionNumber].choices.length; i++) {
        $("#answers").append('<input type="radio" name="pokemon" value="' + i.toString() + '" id="' +
                             i.toString() + '_button"><label for="' + i.toString() + '_button">' +
                             json[questionNumber].choices[i - 1] + '</label><br>');
    }
    
    // Reselect previous answer or deselect all answers.
    if (responses.length >= questionNumber) {
        $("#" + responses[questionNumber - 1] + "_button").prop("checked", true);
    } else {
        $(':radio').prop('checked', false);
    }
    
    $("#questions").fadeIn();
    $("#buttons").fadeIn();
}

function goBack() {
    "use strict";
    
    // Another relatively hacky way of doing things, but it works since all troublesome numbers
    // are checked for.
    questionNumber = questionNumber - 2;
    nextQuestion();
}

function recordResult() {
    "use strict";
    
    // Forces user to pick an answer.
    if (questionNumber !== 0) {
        if ($('input[name=pokemon]:checked', '#answers').val() === undefined) {
            $("#noAnswer").show();
            return;
        } else {
            // Allows any number of questions to be used, as the length of the saved responses array
            // is dynamically changed.
            if (responses.length < questionNumber) {
                responses.push($('input[name=pokemon]:checked', '#answers').val());
            } else {
                responses[questionNumber - 1] = $('input[name=pokemon]:checked', '#answers').val();
            }
            $("#noAnswer").hide();
        }
    }
        
    nextQuestion();
}

function start(name) {
    "use strict";
    
    firstName = name;
    
    $("#questions").show();
    $("#buttons").show();
    $("#login").hide();
    
    nextQuestion();
}

function login() {
    "use strict";
    
    var username, password;
    
    username = $("#user").val();
    password = $("#pass").val();
    
    if (username in userData) {
        if (password === userData[username][0]) {
            $("#alerts").text("Logged in.");
            start(username);
        } else {
            $("#alerts").text("Wrong password.");
        }
    } else {
        userData[username] = [password, 0];
        localStorage.setItem("users", JSON.stringify(userData));
        $("#alerts").text("Account created.");
        start(username);
    }
}

function loginLoad() {
    "use strict";
 
    $("#inputName").hide();
    $("#login").show();
}