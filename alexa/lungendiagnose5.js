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
                        discovery.query({
                            environment_id: 'bd8821ab-4451-4a8d-ad72-85625d0d6cdf',
                            collection_id: 'ae611af9-9419-4a67-ab25-2868b21ea5e2',
                            query: queryString,
                            count: 3
                                        
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
                                    insert(cloudantDb,"10", "Return from Discovery", text2, response,  params);                    
                                    
                                    // create response to alexa
                                    var outtext = "Waston discovery hat in seinen Dokumenten folgende Informationen für die Frage: " + searchString +
                                                   "gefunden: "+
                                                   "Das Dokument enhält die Entität " +
                                                    response.results[0].enriched_text.entities[0].text +
                                                   " vom Entitätentyp: " + 
                                                   response.results[0].enriched_text.entities[0].type +
                                                   " . Der Inhalt des Dokument lautet:" +
                                                   response.results[0].text;

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
                break; 