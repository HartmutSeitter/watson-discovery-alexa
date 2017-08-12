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
    var cloudantDb = cloudant.db.use("askdiscoveryservice");

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

        const cardTitle = 'Welcome to the Watson Discovery service';
        const speechOutput = 'Welcome to the Watson Discovery service, what should watson analyze for you?';
        const repromptText = "Hello, please give me search string and Watson Discovery will serach for an answer in the news collection";
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
       insert(cloudantDb, 4, "IntentRequest received", args, "-",  params);

        if (args.request.intent.name === "askDiscovery"){
            insert(cloudantDb, "5", "IntentRequest askDiscovery received", args, "-",  params);
            // get the search string
            var searchString = args.request.intent.slots.search.value;
            if (searchString === 'undefined') {
                // handle no search string entered
            } else {
                // now call discovery with search string
                var queryString = {'query':searchString};
                //var queryString = {'query': "Example",'term':"nested(entities).filter(entities.type:Person).term(entities.text)"}

                return new Promise ((resolve, reject) => {
                    discovery.query({
                           environment_id: '0f4863d5-2f5a-424e-82af-9b251b4de16b',
                           collection_id: 'f1fd3604-5d65-4aab-a919-8dadfcb55112',
                            query: searchString,
                            count: 1,
                            return: "title",
                            aggregation: "term(docSentiment.type,count:2)"                
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
                                insert(cloudantDb,"6", "Return from Discovery", text2, "-",  params);                    
                                
                                // create response to alexa
                                var outtext = "we found in the news collection " + matching_results + 
                                              " matching results for the query " + searchString +
                                              "we also analyzed the sentiment of the different matching articels" ;
                                            //  aggregations_pos + 
                                            //  "articles have a positive sentiment" +
                                            //  aggregations_neg +
                                            //  "have a negative sentiment";


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
            }
        }
    }
    if (args.request.type === 'SessionEndedRequest') {
       insert(cloudantDb,"7", "SessionEndedRequest", args, "-",  params);                    
    }

}
