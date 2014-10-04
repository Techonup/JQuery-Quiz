/*jslint browser: true, plusplus: true*/
/*global $, console, PieChart*/

var questionNumber = 0;
var responses = [];
var firstName;

var json;
//var jsonURL = "http://techonup.github.io/quiz.json";
var jsonURL = "quiz.json";

function callback(response) {
    "use strict";
    
    // See below for an explanation.
    json = response;
}

$(document).ready(function () {
    "use strict";
    
    // This is a very hacky way of getting the JSON.
    //
    // JSON-P is already a really hacky way of getting around cross-domain security policies,
    // but here we use it to just get JSON. The page returns "callback(json)" (the JSON-P tags are ignored)
    // and the callback function (defined above) writes that JSON to a variable. Any other form of data 
    // could also be returned.
    //
    // HTTP is used instead of HTTPS to save about 75ms of loading time.
    json = $.ajax({
        type: "GET",
        //dataType: "jsonp",
        dataType: "json",
        url: jsonURL,
        //crossDomain: true,
        async: false,
        cache: true
    });
    
});


function results() {
    "use strict";
    
    // JSLint requires this to be here for the later "for" loop. Honestly, kind of silly,
    // but since JSLint is nice for other things and Brackets doesn't allow you to use 
    // other hinters, we'll deal with it.
    var i, pieChart, correct = 0, correctPct, incorrectPct, correctDeg, incorrectDeg;
    
    for (i = 0; i < responses.length; i++) {
        if (responses[i] === json[i + 1].correct) {
            correct++;
        }
    }
    
    $("#score").text(firstName + ", you got " + correct.toString() + " right out of " +
                     Object.keys(json).length.toString() + " questions!");
    
    correctDeg = correct * 360 / Object.keys(json).length;
    correctPct = (correct * 100 / Object.keys(json).length).toString() + "% Correct";
    
    if (correct !== Object.keys(json).length) {
        incorrectDeg = 360 - correctDeg;
        incorrectPct = ((Object.keys(json).length - correct) * 100 / Object.keys(json).length)
                        .toString() + "% Incorrect";
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
    }
    
    // Since "json" is an Object of Objects, this works as a method of counting questions.
    // Allows any number of questions to be used.
    if (questionNumber === Object.keys(json).length + 1) {
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

function start() {
    "use strict";
    
    if ($("#firstName") === "") {
        return;
    }
    
    firstName = $("#firstName").val();
    
    $("#inputName").hide();
    $("#questions").show();
    $("#buttons").show();
    
    nextQuestion();
}