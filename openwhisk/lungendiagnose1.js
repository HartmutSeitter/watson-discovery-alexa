//*****************************************************************
//  * main() will be invoked when you Run This Action.
//  * @param OpenWhisk actions accept a single parameter, which must be a JSON object.
//  *
//  * This function will be call by Amazons Alexa -- discovery skill
//  *
//  *  A json structure is passed as parameter which contains the info Alexa collected
//        args.session.new   - a new session is started by Alexa
//        args.request.type === 'LaunchRequest' -> the skill is started an no intent was assigned, yet.
//        args.request.type === 'IntnetRequest' -> the skill is statted an the intent was assigend.
//        args.request.intent.name === "askDiscovery" 
//        args.request.slots.search.value = the search string for Watson Discovery
//     
//     The we will save the state of the conversation in the cloudantDB
//        and we also save the request parameter   
//        for debugging purpose different states of processing will also saved in the cloudantDB
//*****************************************************************

var https = require('https');
var request = require('request');
var moment = require('moment');
var Cloudant = require('cloudant');

var cloudant = new Cloudant({
    account: "your user id, you get it from the cloudant credentials",
    password: "your cloudantDB password, you get it from the cloudant credentials"
});


//***********************************************
function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}
//***********************************************

function main(args) {
    var intent = args.request.intent.name;
    //check if new session is started
    if (args.session.new) {
        onSessionStarted({ requestId: args.request.requestId }, args.session);
        console.log("onSessionStarted request");
    }
    //****************************************************************/
    // check if we have a LaunchRequest
    //****************************************************************/
    if (args.request.type === 'LaunchRequest') {
         
        console.log("on LaunchRequest received");

        const cardTitle = 'Willkommen zu Watson Discovery service';
        const speechOutput = 'Willkommen zu Watson Discovery service für Lungendiagnose, welche Daten kann ich für dich herausfinden?';
        const repromptText = "Hello, bitte sage mir welche Daten ich für Dich ermitteln soll";
        const shouldEndSession = false;
        var response = {
            "version": "1.0",
            "sessionAttribute": {},
            "response": {
                "outputSpeech": {
                    "type": 'PlainText',
                    "text": speechOutput,
                },
                "card": {
                    "type": "Simple",
                    "title": `SessionSpeechlet - ${cardTitle}`,
                    "content": `SessionSpeechlet - ${speechOutput}`,
                },
                "reprompt": {
                    "outputSpeech": {
                        "type": 'PlainText',
                        "text": repromptText,
                    },
                },
                "shouldEndSession": true
            }
        }
        return response;
    }

    //****************************************************************/
    // IntentRequest recieved ?
    //****************************************************************/
    if (args.request.type === 'IntentRequest') {
        console.log("IntentRequest");

        //********************************************************** */
        //  which intent request
        //********************************************************** */
        console.log("IntentRequest name = ", args.request.intent.name);
        switch(args.request.intent.name) {
            case "infoallgemein":
                //****** */
                // return to alex an tell something about watson discovery and what are the intents to be used
                 var outtext = "hallo und willkommen zu Alexa und Watson Services für Lungendiagnose." + 
                               "Watson hat Zugriff auf verschiedene Dokumente über Lungenkrankheiten und deren Diagnose." +
                               "Du kannst weitere Informationen zu den vorhandenen Dokumenten bekommen, indem Du zum Beispiel die Frage stellst: " +
                               "welche Daten stehen zur Verfügung?" +
                               "oder " +
                               "welche Schlüsselwörter gibt es";
                               
                var response = {
                    "version": "1.0",
                    "response": {
                    "shouldEndSession": true,
                        "outputSpeech":{
                            "type": "PlainText",
                            "text": outtext
                        }
                    }
                };
                return response;
            break;             
        }
    }
    if (args.request.type === 'SessionEndedRequest') {
       console.log("SessionEndedRequest");
                     
    }

}
