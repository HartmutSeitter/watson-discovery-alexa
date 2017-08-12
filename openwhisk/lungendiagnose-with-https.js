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

var watson = require('watson-developer-cloud');
var DiscoveryV1 = require('watson-developer-cloud/discovery/v1');
var https = require('https');
var request = require('request');
var moment = require('moment');
var Cloudant = require('cloudant');

var cloudant = new Cloudant({
    account: "6cd6ca19-4125-4f6e-83b9-27c9566f6a0a-bluemix",
    password: "b118f61acfb6927b388d4f69f526e51187d1b4525805242f5b838f34f7402a3b"
});
var params = {};
var discovery = new DiscoveryV1({
  username: 'b290a4a9-4708-4a21-bc0f-c5c7df303d59',
  password: 'pogSVLGGJZjb',
  version_date: '2017-05-26'
});
//****************************************************
// write data to cloudantDB
//  cloudantDB is the cloundant instance
//  index is a index-nr appended to doc name and must be unique in this function
//  fct - in which part of the function is this db-call invoked
//  args - is the json object received from Alexa
//  addData - additional Data stored in this document

//********************************************** */
// save a document in cloudantDB
//********************************************** */
function insert(cloudantDb, index, fct, args, addData,  params) {
  return new Promise(function(resolve, reject) {
    var now = moment();
    var formatted = now.format('YYYY-MM-DD-HH:mm:ss:SSS')
    var cloudantDocName = formatted + '-' + index;
    var doc = {
            "_id": cloudantDocName,
            "timestamp": formatted,
            "fct": fct,
            "args": args,
            "addData": addData,
            "cloudantDocName": cloudantDocName
    }
    
    cloudantDb.insert(doc, params, function(error, response) {
      if (!error) {
        //console.log("success", response);
        resolve(response);
      } else {
        console.log("error", error);
        reject(error);
      }
    });
  });
};

//***********************************************
function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}
//***********************************************

function main(args) {
    var intent = args.request.intent.name;
    var cloudantDb = cloudant.db.use("lungendiagnose");

    insert(cloudantDb, "1", "fct main", args, "-",  params);

    //check if new session is started
    if (args.session.new) {
        onSessionStarted({ requestId: args.request.requestId }, args.session);
        insert(cloudantDb, "2", "fct session started", args, "-",  params);
    }
    //****************************************************************/
    // check if we have a LaunchRequest
    //****************************************************************/
    if (args.request.type === 'LaunchRequest') {
         
        insert(cloudantDb, "3", "LaunchRequest received", args, "-",  params);

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
       insert(cloudantDb, "4", "IntentRequest received", args, "-",  params);
        //********************************************************** */
        //  which intent request
        //********************************************************** */
        insert(cloudantDb, "5", "IntentRequest lungendiagnose received", args, "-",  params);
            
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
            case "infodaten":
                return new Promise ((resolve, reject) => {
                    discovery.query({
                        environment_id: 'bd8821ab-4451-4a8d-ad72-85625d0d6cdf',
                        collection_id: 'ae611af9-9419-4a67-ab25-2868b21ea5e2',
                        query: "",
                        count: 3,
                        return: "title",
                        aggregation: "term(enriched_text.docSentiment.type,count:3)"                
                    },  function(err, response) {
                            if (err) {
                                console.log('error:',err);
                            } else {
                                console.log('discovery call successful');
                                var matching_results = response.matching_results;
                                var text2 = response.results[0].text;
                                //var aggregations_pos = response.aggregations.results[0].matching_results;
                                //var aggregations_neg = response.aggregations.results[1].matching_results;
                                //var aggregations_neu = response.aggregations.results[2].matching_results;
                                insert(cloudantDb,"6", "Return from infodateb Discovery", text2, "-",  params);                    
                                
                                // create response to alexa
                                var outtext = "Die Daten über Lungendiagnose enthalten derzeit " + 
                                               matching_results + " Dokumente. " +
                                               "In der Summe sind " + response.aggregations[0].results[0].matching_results +
                                               " mit einem " + response.aggregations[0].results[0].key +
                                               " Stimmungsbild verfasst und " +
                                               response.aggregations[0].results[1].matching_results +
                                               " mit einem " + response.aggregations[0].results[1].key +
                                               " Stimmungsbild verfasst." + 
                                               " Weitere Details kannst Du zum Beispiel mit der Frage nach Schlüsselwörter oder Enitäten erhalten";


                                var response = {
                                    "version": "1.0",
                                    "response": {
                                    "shouldEndSession": true,
                                        "outputSpeech":{
                                            "type": "PlainText",
                                            "text": outtext
                                        }
                                    }
                                }
                                return resolve (response);
                            } 
                        }
                    );
                });
            break;
            case "infoschluesselwoerter":
                return new Promise ((resolve, reject) => {
                    discovery.query({
                        environment_id: 'bd8821ab-4451-4a8d-ad72-85625d0d6cdf',
                        collection_id: 'ae611af9-9419-4a67-ab25-2868b21ea5e2',
                        query: "",
                        count: 3,
                        return: "title",
                        aggregation: "term(enriched_text.entites.text,count:5)"                
                    },  function(err, response) {
                            if (err) {
                                console.log('error:',err);
                            } else {
                                console.log('discovery call successful');
                                var matching_results = response.matching_results;
                                var text2 = response.results[0].text;
                                //var aggregations_pos = response.aggregations.results[0].matching_results;
                                //var aggregations_neg = response.aggregations.results[1].matching_results;
                                //var aggregations_neu = response.aggregations.results[2].matching_results;
                                insert(cloudantDb,"7", "Return from  infoschluesselwoerter Discovery", text2, "-",  params);                    
                                
                                // create response to alexa
                                var outtext = "Waston discovery hat folgende Begriffe zu bedeutenden Schlüsselwörter in den Dokumenten gefunden und festgelegt " + 
                                               "Hier die drei Schlüsselwörter die als bedeutend identifiziert wurden: " +
                                               "Das Wort oder der Begriff: " + response.aggregations[0].results[0].key +
                                               " wurde in " + response.aggregations[0].results[0].matching_results +
                                               " Dokumenten identifiziert und festgelegt " +
                                               "Das Wort oder der Begriff: " + response.aggregations[0].results[1].key +
                                               " wurde in " + response.aggregations[0].results[1].matching_results +
                                               " Dokumenten identifiziert und festgelegt! " +
                                               "Das Wort oder der Begriff: " + response.aggregations[0].results[2].key +
                                               " wurde in " + response.aggregations[0].results[2].matching_results +
                                               " Dokumenten identifiziert und festgelegt! " +
                                               "Das Wort oder der Begriff: " + response.aggregations[0].results[3].key +
                                               " wurde in " + response.aggregations[0].results[3].matching_results +
                                               " Dokumenten identifiziert und festgelegt! " +
                                               " Weitere Details kannst Du zum Beispiel mit der Frage nach Enitäten erhalten";


                                var response = {
                                    "version": "1.0",
                                    "response": {
                                    "shouldEndSession": true,
                                        "outputSpeech":{
                                            "type": "PlainText",
                                            "text": outtext
                                        }
                                    }
                                }
                                return resolve (response);
                            } 
                        }
                    );
                });
            break;
            case "infoentitaeten":
                return new Promise ((resolve, reject) => {
                    discovery.query({
                        environment_id: 'bd8821ab-4451-4a8d-ad72-85625d0d6cdf',
                        collection_id: 'ae611af9-9419-4a67-ab25-2868b21ea5e2',
                        query: "",
                        count: 5,
                        return: "title",
                        aggregation: " term(enriched_text.entities.text,count:5)"                
                    },  function(err, response) {
                            if (err) {
                                console.log('error:',err);
                            } else {
                                console.log('discovery call successful');
                                var matching_results = response.matching_results;
                                var text2 = response.results[0].text;
                                //var aggregations_pos = response.aggregations.results[0].matching_results;
                                //var aggregations_neg = response.aggregations.results[1].matching_results;
                                //var aggregations_neu = response.aggregations.results[2].matching_results;
                                insert(cloudantDb,"8", "Return from infoentitäten Discovery", text2, "-",  params);                    
                                
                                // create response to alexa
                                var outtext = "Waston discovery hat folgende Begriffe als bedeutenden Entitäten in den Dokumenten gefunden und festgelegt " + 
                                               "Hier die drei Entitäten die als bedeutend identifiziert wurden: " +
                                               "Das Wort oder der Begriff: " + response.aggregations[0].results[0].key +
                                               " wurde in " + response.aggregations[0].results[0].matching_results +
                                               " Dokumenten identifiziert und festgelegt " +
                                               "Das Wort oder der Begriff: " + response.aggregations[0].results[1].key +
                                               " wurde in " + response.aggregations[0].results[1].matching_results +
                                               " Dokumenten identifiziert und festgelegt! " +
                                               "Das Wort oder der Begriff: " + response.aggregations[0].results[2].key +
                                               " wurde in " + response.aggregations[0].results[2].matching_results +
                                               " Dokumenten identifiziert und festgelegt! " +
                                               "Das Wort oder der Begriff: " + response.aggregations[0].results[3].key +
                                               " wurde in " + response.aggregations[0].results[3].matching_results +
                                               " Dokumenten identifiziert und festgelegt! " +
                                               " Weitere Details kannst Du zum Beispiel mit der Frage nach Schlüsselwörter erhalten"
                                               " oder du kannst direkt nach Krankheiten, Symptomen oder Diagnosen fragen. ";


                                var response = {
                                    "version": "1.0",
                                    "response": {
                                    "shouldEndSession": true,
                                        "outputSpeech":{
                                            "type": "PlainText",
                                            "text": outtext
                                        }
                                    }
                                }
                                return resolve (response);
                            } 
                        }
                    );
                });
            break;
                
            case "lungenanalyse":
                var searchString = args.request.intent.slots.search.value;
                if (searchString === 'undefined') {
                    outtext = "ich konnte leider keine Suchkriterien in deiner Anfrage erkennen ";
                    var response = {
                        "version": "1.0",
                        "response": {
                        "shouldEndSession": true,
                            "outputSpeech":{
                                "type": "PlainText",
                                "text": outtext
                            }
                        }
                    }
                    return  response;
                    // handle no search string entered
                } else {
                    // now call discovery with search string
                    var queryString = {'natural_language_query':searchString};
                    insert(cloudantDb,"9", "Call freie Textsuche ", queryString, "-",  params);                    
                              
                    return new Promise ((resolve, reject) => {
                       
                       
                        var username = "b290a4a9-4708-4a21-bc0f-c5c7df303d59";
                        var password = "pogSVLGGJZjb";
                        var auth = "Basic " + new Buffer(username + ":" + password).toString("base64");
                        var request = require('request');
                        var url = "https://gateway.watsonplatform.net/discovery/api/v1/" + 
                                                  "environments/e0e3321c-90fc-4d9e-b6d1-f264f3d9cfd3/" + 
                                                  "collections/32442f75-2e86-4826-9d32-0cd7b6d58c06/" +
                                                  "query?version=2017-08-01&"+
                                                  "count=&"+
                                                  "offset=&"+
                                                  "aggregation=&" +
                                                  "filter=&" +
                                                  "passages=true&" +
                                                  "highlight=true&" + 
                                                  "return=&" +
                                                  "natural_language_query=welche%20Zusammenhang%20besteht%20zwischen%20Rauchen%20und%20Husten";

                        console.log("discovery url = ", url);
                        console.log("discovery auth = ", auth);
                        var request = require("request");

                        var options = { method: 'GET',
                          url: 'https://gateway.watsonplatform.net/discovery/api/v1/environments/bd8821ab-4451-4a8d-ad72-85625d0d6cdf/collections/ae611af9-9419-4a67-ab25-2868b21ea5e2/query',
                          qs: 
                           { version: '2017-08-01',
                             count: '3',
                             offset: '1',
                             aggregation: '',
                             filter: '',
                             passages: 'true',
                             highlight: 'true',
                             return: 'text',
                             natural_language_query: 'was ist der Unterschied zwischen Husten und Bronchitis' },
                          headers: 
                           { 'postman-token': 'db71934e-e1bf-4ea3-0fe1-03b23432aa16',
                             'cache-control': 'no-cache',
                             authorization: 'Basic YjI5MGE0YTktNDcwOC00YTIxLWJjMGYtYzVjN2RmMzAzZDU5OnBvZ1NWTEdHSlpqYg==' } };
                                            
                        request(options, function (error, response, body) {
                          if (error) throw new Error(error);
                        
                          console.log(body);
                            var body_json = JSON.parse(body);
                             insert(cloudantDb,"10", "Call freie Textsuche response body", body_json, "-",  params); 
                         
                           console.log(body_json.matching_results);
                           console.log(body_json.passages[0].passage_text);
                        
                           var outtext = "Waston discovery hat in seinen Dokumenten" +
                                          "folgende Informationen für die Frage: " + searchString +
                                          "gefunden: " +
                                          "Die Passage mit der höchsten Trefferquote lautet :" +
                                          body_json.passages[0].passage_text +
                                          "Während des enrichment Prozess hat Discovery noch weitere Eigenschaften ermittetl." +
                                          "Das Highlight bezogen auf das Dokument mit den größen Wahrscheinlichkeit lautet:" +
                                           body_json.results[0].highlight.text[0];
                                          
                                           
                                       
                          var response = {
                            "version": "1.0",
                            "response": {
                            "shouldEndSession": true,
                            "outputSpeech":{
                                "type": "PlainText",
                                "text": outtext
                            }
                        }
                    }
                          return resolve (response);
                        });
                        
                        
                    });
                }
                break;                




        }
    }
    if (args.request.type === 'SessionEndedRequest') {
       insert(cloudantDb,"7", "SessionEndedRequest", args, "-",  params);                    
    }

}
