case "infoschluesselwoerter":
    return new Promise ((resolve, reject) => {
        discovery.query({
            environment_id: 'bd8821ab-4451-4a8d-ad72-85625d0d6cdf',
            collection_id: 'ae611af9-9419-4a67-ab25-2868b21ea5e2',
            query: "",
            count: 5,
            return: "title",
            aggregation: " term(enriched_text.keywords.text,count:5)"                
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